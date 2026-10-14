import { hasAnnualFundingAmount } from "../../supabase/functions/_shared/sponsorship-rules.js";

async function withTimeout(request, timeoutMs) {
  let timer;
  try {
    return await Promise.race([
      request,
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Funding lookup timed out.")),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

// The annual aggregate is optional display metadata. If it is unavailable
// (including an unapplied migration), use actual public child availability.
// Keep known restrictions and totals from this year's cache; never assume $0.
export async function fetchAnnualFunding(
  client,
  year,
  previous = {},
  timeoutMs = 8000,
) {
  const knownFunding = { ...previous };
  const verifiedFunding = {};
  try {
    const { data, error } = await withTimeout(
      client.rpc("get_child_annual_funding", { p_year: year }),
      timeoutMs,
    );
    if (error) throw error;
    if (Array.isArray(data)) {
      for (const row of data) {
        if (!row?.child_id) continue;
        const known = knownFunding[row.child_id];
        if (
          hasAnnualFundingAmount(row) &&
          typeof row.pending === "boolean" &&
          typeof row.legacy_reserved === "boolean"
        ) {
          verifiedFunding[row.child_id] = { ...row, funding_available: true };
        }
        knownFunding[row.child_id] = {
          ...known,
          ...row,
          funded_amount: hasAnnualFundingAmount(row)
            ? row.funded_amount
            : known?.funded_amount,
          legacy_reserved: Boolean(
            row.legacy_reserved || known?.legacy_reserved,
          ),
          pending: Boolean(row.pending || known?.pending),
        };
      }
    }
  } catch {
    // Funding totals cannot determine availability in this response; resolve
    // it independently below without hiding failures of the child lookup.
  }

  let children;
  try {
    const response = await withTimeout(
      client.from("children").select("id, sponsorship_status"),
      timeoutMs,
    );
    if (response.error) throw response.error;
    if (!Array.isArray(response.data))
      throw new Error(
        "Child availability could not be checked. Please try again.",
      );
    children = response.data;
  } catch (error) {
    // A valid aggregate includes availability itself. Missing children still
    // fail selection validation, but a separate status outage need not hide it.
    if (Object.keys(verifiedFunding).length) return verifiedFunding;
    throw error;
  }
  return {
    ...verifiedFunding,
    ...Object.fromEntries(
      children.map((child) => {
        if (verifiedFunding[child.id])
          return [child.id, verifiedFunding[child.id]];
        const known = knownFunding[child.id];
        return [
          child.id,
          {
            child_id: child.id,
            child_status: child.sponsorship_status,
            funded_amount: hasAnnualFundingAmount(known)
              ? Number(known.funded_amount)
              : null,
            funding_available: false,
            legacy_reserved:
              child.sponsorship_status === "sponsored" ||
              Boolean(known?.legacy_reserved),
            pending:
              child.sponsorship_status === "pending" || Boolean(known?.pending),
            uses_annual_funding: Boolean(known?.uses_annual_funding),
          },
        ];
      }),
    ),
  };
}
