import {
  validateSponsorshipAllocation,
  isRecordableDonationAmount,
  usdToKesSubunits,
  MIN_RECORDABLE_DONATION,
  KES_PER_USD,
} from "./sponsorship-rules.js";

export async function recordVerifiedTransaction(
  txn,
  supabase,
  clientFallback = {},
) {
  const amountKES = txn.amount / 100; // Paystack returns subunits
  const meta = txn.metadata || {};
  if (
    meta.giving_model === "donation_v1" &&
    (!isRecordableDonationAmount(meta.usd_equivalent) ||
      !["preset", "custom"].includes(meta.donation_amount_type))
  ) {
    throw new Error(
      `Invalid donation amount. Donations start at $${MIN_RECORDABLE_DONATION}.`,
    );
  }
  // The recorded USD amount must match what Paystack actually charged.
  if (
    meta.giving_model === "donation_v1" &&
    (txn.currency !== "KES" ||
      Number(txn.amount) !== usdToKesSubunits(meta.usd_equivalent))
  ) {
    throw new Error("Verified charge does not match the donation amount.");
  }
  const annual = meta.is_sponsorship && meta.sponsorship_model === "annual_v1";
  const allocations = annual
    ? validateSponsorshipAllocation(
        meta.children,
        meta.usd_equivalent,
        meta.frequency,
      )
    : null;
  // Confirm that the recorded USD allocation matches the actual KES charge.
  // This is the same conversion used by the existing checkout.
  if (
    annual &&
    (!meta.donor_id ||
      txn.currency !== "KES" ||
      Number(txn.amount) !== usdToKesSubunits(meta.usd_equivalent))
  ) {
    throw new Error(
      "Verified charge does not match the sponsorship allocation.",
    );
  }
  const paidAt = txn.paid_at || txn.created_at;

  // Never trust the USD amount the browser put in the metadata on its own.
  // It is only recorded when it matches what Paystack actually charged;
  // otherwise the real charge (converted at the fixed rate) is recorded, so a
  // tampered payment can never inflate donation totals.
  const claimMatchesCharge =
    meta.usd_equivalent !== undefined &&
    meta.usd_equivalent !== null &&
    txn.currency === "KES" &&
    Number(txn.amount) === usdToKesSubunits(meta.usd_equivalent);
  const chargedUsd =
    txn.currency === "KES" && Number.isFinite(Number(txn.amount))
      ? Math.round(Number(txn.amount) / KES_PER_USD) / 100
      : null;
  const recordedAmount = claimMatchesCharge
    ? Number(meta.usd_equivalent)
    : (chargedUsd ?? amountKES);
  if (annual && (!paidAt || !Number.isFinite(Date.parse(paidAt)))) {
    throw new Error("Verified sponsorship payment date is missing.");
  }

  // Prefer Paystack's verified metadata; fall back to what the browser sent
  // directly if metadata came back empty for these display-only fields.
  const donorName = meta.donor_name || clientFallback.donor_name || null;
  const location = meta.location || clientFallback.location || null;
  const phone = meta.phone || clientFallback.phone || null;
  // Lowercased so the "view own donations" RLS policy (which compares
  // against auth.email()) matches no matter what case the donor typed
  // into the Paystack popup.
  const donorEmail = (txn.customer?.email || "").toLowerCase() || null;

  // Conflict-safe insert: relies on the UNIQUE constraint on
  // donations.payment_reference (see migration) so a race between this
  // function and the webhook can never create duplicate rows.
  const { data: donation, error: donationError } = await supabase
    .from("donations")
    .insert({
      donor_name: donorName,
      donor_email: donorEmail,
      donor_id: meta.donor_id || null,
      amount: recordedAmount,
      currency: "KES",
      converted_amount: amountKES,
      frequency: meta.frequency || "one-time",
      status: "completed",
      // Only a verified annual sponsorship payment counts as a sponsorship.
      is_sponsorship: Boolean(annual),
      payment_reference: txn.reference,
      location,
      phone,
      created_at: paidAt || undefined,
    })
    .select()
    .single();

  // 23505 = unique_violation — another caller (webhook or a duplicate
  // client call) already recorded this reference. Not an error condition,
  // but if we have donor details this call's caller didn't, patch them in
  // rather than leaving the row permanently blank.
  const alreadyRecorded = donationError?.code === "23505";
  if (donationError && !alreadyRecorded) throw donationError;

  if (alreadyRecorded) {
    const patch = {};
    if (donorName) patch.donor_name = donorName;
    if (location) patch.location = location;
    if (phone) patch.phone = phone;
    // Also link the row to the donor's account. Without this, a donation
    // the webhook recorded first (e.g. with blank metadata) would never
    // appear in the donor's dashboard.
    if (meta.donor_id) patch.donor_id = meta.donor_id;
    if (donorEmail) patch.donor_email = donorEmail;
    if (annual) patch.is_sponsorship = true;

    if (Object.keys(patch).length > 0) {
      const { error: patchError } = await supabase
        .from("donations")
        .update(patch)
        .eq("payment_reference", txn.reference)
        .or(
          "donor_name.is.null,donor_id.is.null,donor_email.is.null,location.is.null,phone.is.null,is_sponsorship.is.false",
        );
      if (patchError)
        console.error("Backfill of donor details failed:", patchError);
    }
  }

  if (annual) {
    // Always retry allocations even if the donation already exists: a previous
    // attempt can have committed the payment before an RPC/network failure.
    // The RPC is atomic and deduplicates by donation + child.
    const { error } = await supabase.rpc("record_annual_sponsorship_payment", {
      p_reference: txn.reference,
      p_children: allocations,
      p_paid_at: new Date(paidAt).toISOString(),
    });
    if (error) {
      // Keep the verified donation and retry its annual allocation later.
      // Never convert an annual payment into a legacy reserved sponsorship:
      // that would change balances, child availability and credit behavior.
      if (["PGRST202", "42883", "42P01"].includes(error.code)) {
        const setupError = new Error(
          "Payment received, but annual sponsorship recording is not configured. Apply supabase/sponsorship-annual-funding.sql and retry this payment reference.",
        );
        setupError.cause = error;
        throw setupError;
      }
      throw error;
    }
  }
  // Older-style sponsorships (no "annual_v1" model) are no longer created
  // here. Their metadata is not tied to the amount charged, so a tampered
  // payment could otherwise mark a child "sponsored" for any amount. Such
  // payments are still recorded above as ordinary donations at the amount
  // Paystack actually charged, so no real money is ever lost.

  return { donation, alreadyRecorded };
}
