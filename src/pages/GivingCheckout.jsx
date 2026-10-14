import { useState, useEffect } from "react";
import { useLocation, useSearchParams, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  Heart,
  CheckCircle2,
  XCircle,
  UserPlus,
  Loader2,
  ArrowRight,
  LockKeyhole,
  Users,
  BookOpen,
  Stethoscope,
} from "lucide-react";
import PageTransition from "@/animations/PageTransition";
import SEO from "@/components/ui/SEO";
import Button from "@/components/ui/Button";
import { useDonorAuth } from "@/context/DonorAuthContext";
import { useSponsorshipCart } from "@/context/SponsorshipCartContext";
import {
  SponsorshipCartSelection,
  AnnualFundingNotice,
} from "@/components/cart/SponsorshipSelection";
import { getAnnualFunding, useAnnualFunding } from "@/hooks/useAnnualFunding";
import {
  KES_PER_USD,
  currentFundingYear,
  donationAmountsFor,
  isValidDonationAmount,
  MIN_CUSTOM_DONATION,
  sponsorshipSelectionError,
  usdToKesSubunits,
  validateSponsorshipAllocation,
} from "@/lib/sponsorship";
import supabase from "@/supabase/client";

// Every gift is shown in US dollars and charged by Paystack in Kenyan
// shillings at KES_PER_USD. The donor sees the exact KSh charge before paying.
// key for the repeated-donor autofill (last donor details on this device)
const AUTO_KEY = "khm_donor_autofill";

function formatUSD(amount) {
  return `$${Number(amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function formatKES(amount) {
  return `KSh ${Number(amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function GivingCheckout({ mode = "donation" }) {
  const { user, profile, loading: authLoading } = useDonorAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const isSponsorship = mode === "sponsorship";
  const {
    cartItems,
    cartCount,
    subtotal,
    clearCart,
    frequency: cartFrequency,
    setFrequency: setCartFrequency,
    loaded: cartLoaded,
  } = useSponsorshipCart();
  const isCartCheckout = isSponsorship;
  const funding = useAnnualFunding(isSponsorship && cartCount > 0);
  // A monthly reminder link opens checkout as /donate?frequency=monthly&amount=100.
  const initialDonationFrequency =
    searchParams.get("frequency") === "monthly" ? "monthly" : "one-time";
  const requestedDonationAmount = Number(searchParams.get("amount"));
  const initialDonationAmount = (() => {
    const presets = donationAmountsFor(initialDonationFrequency);
    return presets.includes(requestedDonationAmount)
      ? requestedDonationAmount
      : presets[0];
  })();
  // A larger custom monthly gift (e.g. $600) reopens in the custom box.
  const initialCustomAmount =
    !donationAmountsFor(initialDonationFrequency).includes(
      requestedDonationAmount,
    ) && isValidDonationAmount(requestedDonationAmount, true)
      ? String(requestedDonationAmount)
      : "";
  const [donationFrequency, setDonationFrequency] = useState(
    initialDonationFrequency,
  );
  const frequency = isSponsorship ? cartFrequency : donationFrequency;
  const [selectedUSD, setSelectedUSD] = useState(initialDonationAmount);
  const [customAmount, setCustomAmount] = useState(initialCustomAmount);
  const [isOther, setIsOther] = useState(Boolean(initialCustomAmount));
  const donationPresets = donationAmountsFor(donationFrequency);
  // Minimum for the "Enter a different amount" box.
  const minDonation = MIN_CUSTOM_DONATION;
  // Switching between monthly and one-time keeps a suggested amount that is
  // valid for the new frequency (both start at $100).
  const setFrequency = (next) => {
    if (isSponsorship) {
      setCartFrequency(next);
      return;
    }
    setDonationFrequency(next);
    const presets = donationAmountsFor(next);
    if (!presets.includes(selectedUSD)) setSelectedUSD(presets[0]);
    setResult(null);
  };
  const [processing, setProcessing] = useState(false);
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorLocation, setDonorLocation] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  // Explicit result banner instead of a blocking alert() — and it only shows
  // once we actually know whether the server verified the payment, not just
  // whether Paystack's popup closed.
  const [result, setResult] = useState(null); // { type: "success" | "error", message }
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  useEffect(() => {
    if (profile) {
      setDonorName(
        [profile.first_name, profile.last_name].filter(Boolean).join(" "),
      );
      setDonorEmail(profile.email || user?.email || "");
      setDonorLocation(profile.location || "");
      setDonorPhone(profile.phone || "");
    } else if (user?.email) {
      setDonorEmail(user.email);
    }
  }, [profile, user]);

  // Autofill for repeat visitors — remember the last donor details on this
  // device so the form isn't typed from scratch every time. Signed-in donors
  // always get their account profile (see effect above) instead.
  useEffect(() => {
    if (profile) return;
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(AUTO_KEY) || "null");
    } catch {
      saved = null;
    }
    if (saved && typeof saved === "object") {
      setDonorName((v) => v || saved.donor_name || "");
      setDonorEmail((v) => v || saved.donor_email || "");
      setDonorLocation((v) => v || saved.donor_location || "");
      setDonorPhone((v) => v || saved.donor_phone || "");
    }
    // Just once on mount; the profile effect is the source of truth for
    // signed-in donors, which may resolve slightly later.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          AUTO_KEY,
          JSON.stringify({
            donor_name: donorName,
            donor_email: donorEmail,
            donor_location: donorLocation,
            donor_phone: donorPhone,
          }),
        );
      } catch {
        // Storage unavailable — autofill just won't persist this session.
      }
    }, 600);
    return () => clearTimeout(t);
  }, [donorName, donorEmail, donorLocation, donorPhone]);

  const baseAmount = isCartCheckout
    ? subtotal
    : isOther
      ? Number(customAmount) || 0
      : selectedUSD;
  const sponsorshipError = isSponsorship
    ? !cartLoaded || funding.isLoading
      ? "Checking child availability…"
      : !cartCount
        ? "Choose at least one child to sponsor."
        : funding.isError || !funding.data
          ? "Child availability could not be checked. Please try again."
          : cartItems
              .map((item) =>
                sponsorshipSelectionError(item, funding.data[item.child_id]),
              )
              .find(Boolean)
    : null;
  const isValidAmount = isSponsorship
    ? cartLoaded && cartCount > 0 && !sponsorshipError
    : isValidDonationAmount(baseAmount, isOther, donationFrequency);
  // Exact amount Paystack will charge, shown to the donor before paying.
  const chargeKES = isValidAmount ? usdToKesSubunits(baseAmount) / 100 : 0;

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const fieldErrors = {
    donorName: donorName.trim() ? null : "Name is required",
    donorEmail: !donorEmail.trim()
      ? "Email is required"
      : !EMAIL_RE.test(donorEmail.trim())
        ? "Enter a valid email address"
        : null,
    donorLocation: donorLocation.trim() ? null : "Location is required",
    donorPhone: donorPhone.trim() ? null : "Phone number is required",
  };
  const hasFieldErrors = Object.values(fieldErrors).some(Boolean);
  const formIsValid = !hasFieldErrors && isValidAmount;

  const handleAmountClick = (amount) => {
    setIsOther(false);
    setCustomAmount("");
    setSelectedUSD(amount);
    setResult(null);
  };

  // Confirms the payment with our own backend (which re-checks with Paystack
  // directly) instead of trusting the browser-side popup callback alone.
  // This is what actually gets called whether onSuccess fires cleanly or the
  // donor has to retry after a flaky callback.
  const confirmPayment = async (reference) => {
    // Only the reference is required now — donor and sponsorship details are
    // read server-side from the metadata attached at payment time (Paystack's
    // own verified record), not re-supplied by the browser after the fact.
    //
    // A hard timeout prevents an indefinite "Processing..." state if the
    // Edge Function call stalls (cold start, slow network, dropped
    // connection) — the payment itself already succeeded on Paystack's side
    // regardless, and the webhook will still record it in the background
    // even if this call times out client-side. Promise.race is used instead
    // of AbortSignal since supabase-js's functions.invoke doesn't reliably
    // support cancellation signals across client versions.
    const invokePromise = supabase.functions.invoke(
      "verify-paystack-transaction",
      {
        body: { reference },
      },
    );
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              "Verification is taking longer than expected. Your payment may still have succeeded — we'll confirm it automatically shortly.",
            ),
          ),
        15000,
      ),
    );

    const { data, error } = await Promise.race([invokePromise, timeoutPromise]);

    if (error || data?.error) {
      throw new Error(data?.error || error?.message || "Verification failed");
    }
    return data;
  };

  // After a confirmed successful payment, reload shortly afterwards so every
  // piece of the site (dashboard totals, admin lists, sponsorship status)
  // comes back fully fresh from the server instead of relying on cache
  // invalidation alone. Delayed just enough for the donor to read the
  // confirmation and note their reference.
  // Guests are not reloaded: they stay on the thank-you message, which offers
  // to create an account with the email they just used.
  const isGuest = !user;
  const scheduleReload = () => {
    if (isGuest) return;
    setTimeout(() => window.location.reload(), 3000);
  };
  const thankYouMessage = (ref) => {
    const monthlyNote =
      !isSponsorship && frequency === "monthly"
        ? " This month's gift is complete. Monthly gifts are not charged automatically, so come back next month to give again."
        : "";
    return isGuest
      ? `Thank you for your donation! Reference: ${ref}.${monthlyNote}`
      : `Thank you for your donation! Reference: ${ref}.${monthlyNote} This page will refresh automatically…`;
  };

  const handlePay = async () => {
    setAttemptedSubmit(true);

    if (!formIsValid) {
      setResult({
        type: "error",
        message:
          sponsorshipError ||
          (!isValidAmount
            ? `Custom amounts start at $${minDonation}. Enter $${minDonation} or more, or select one of the suggested amounts.`
            : "Please fill in all required fields correctly before continuing."),
      });
      return;
    }

    setResult(null);
    setProcessing(true);
    if (isSponsorship) {
      try {
        const latest = await getAnnualFunding(undefined, funding.data);
        queryClient.setQueryData(
          ["annual-child-funding", currentFundingYear()],
          latest,
        );
        const issue = cartItems
          .map((item) => sponsorshipSelectionError(item, latest[item.child_id]))
          .find(Boolean);
        if (issue) throw new Error(issue);
        validateSponsorshipAllocation(cartItems, baseAmount, frequency);
      } catch (error) {
        setProcessing(false);
        setResult({
          type: "error",
          message:
            error?.message ||
            "We could not check child availability. Please try again.",
        });
        funding.refetch();
        return;
      }
    }

    // Always bill in KES at the fixed rate shown to the donor on this page.
    const amountInKESSubunit = usdToKesSubunits(baseAmount);
    const amountInKES = amountInKESSubunit / 100;

    if (typeof PaystackPop === "undefined") {
      setProcessing(false);
      setResult({
        type: "error",
        message:
          "Payment couldn't start — the payment provider failed to load. Please disable any ad blocker or privacy extension for this site and try again.",
      });
      return;
    }

    const reference = `KHM-${Date.now()}`;
    let sawSuccess = false;

    // Runs once the charge is confirmed. Paystack has already taken the money
    // at this point, so flip the button to success immediately instead of
    // holding it in "Processing..." while the server verifies.
    const handleSuccess = async (ref) => {
      if (sawSuccess) return;
      sawSuccess = true;
      setProcessing(false);
      setResult({
        type: "success",
        guestEmail: isGuest ? donorEmail.trim().toLowerCase() : null,
        message: thankYouMessage(ref),
      });
      scheduleReload();

      // Then confirm + record server-side in the background.
      try {
        await confirmPayment(ref);

        // The donation (and, if applicable, the sponsorship + child status
        // flip) were just written server-side by the Edge Function, not by
        // a React Query mutation running in this component — so nothing
        // has invalidated the relevant caches yet. Do that manually here,
        // otherwise the child stays "Available" and dashboard totals stay
        // stale until the 5-minute staleTime lapses or a hard refresh.
        queryClient.invalidateQueries({ queryKey: ["donations"] });
        queryClient.invalidateQueries({ queryKey: ["donation-stats"] });
        queryClient.invalidateQueries({ queryKey: ["donor-donations"] });
        queryClient.invalidateQueries({ queryKey: ["sponsorships"] });
        queryClient.invalidateQueries({ queryKey: ["children"] });
        queryClient.invalidateQueries({ queryKey: ["annual-child-funding"] });
        if (isCartCheckout) clearCart();
      } catch (err) {
        console.error("Payment verification failed:", err);
        // The charge went through on Paystack's side, so this stays a
        // success — just note that our records may lag behind (the webhook
        // still records it), keeping the reference visible for support.
        setResult({
          type: "success",
          guestEmail: isGuest ? donorEmail.trim().toLowerCase() : null,
          message: `Thank you for your donation! Reference: ${ref}. Your payment was received — it may take a moment to appear in your history.`,
        });
      }
    };

    const handler = PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      // Lowercased so the email Paystack echoes back always matches the
      // account email exactly — the "view own donations" check depends on it.
      email: donorEmail.trim().toLowerCase(),
      amount: amountInKESSubunit,
      currency: "KES",
      ref: reference,
      metadata: {
        donor_name: donorName,
        donor_id: user?.id || null,
        frequency,
        giving_model: isSponsorship ? null : "donation_v1",
        donation_amount_type: isSponsorship
          ? null
          : isOther
            ? "custom"
            : "preset",
        display_currency: "USD",
        display_amount: baseAmount,
        usd_equivalent: baseAmount,
        charged_currency: "KES",
        charged_amount: amountInKES,
        location: donorLocation,
        phone: donorPhone,
        // Sponsorship intent travels with the transaction itself, so it's
        // recoverable from Paystack's own records (via verify or webhook)
        // even if the donor's browser never calls back successfully.
        is_sponsorship: isSponsorship && !!user?.id,
        sponsorship_model: isSponsorship ? "annual_v1" : null,
        child_id: isSponsorship ? cartItems[0]?.child_id || null : null,
        monthly_amount: null,
        // Cart checkout: one payment covers several children. Each child gets
        // its own sponsorship row (with its amount) linked to this donation.
        children: isCartCheckout
          ? cartItems.map((i) => ({
              child_id: i.child_id,
              amount: Number(i.amount) || 0,
              support_type: i.support_type,
              monthly_amount:
                frequency === "monthly" ? Number(i.amount) || 0 : null,
            }))
          : null,
      },
      // Paystack v1/inline.js reports success via `callback`; `onSuccess` is
      // kept as an alias for build versions that use it instead. Both funnel
      // into handleSuccess so "Processing..." clears the instant it succeeds.
      callback: (transaction) => handleSuccess(transaction.reference),
      onSuccess: (transaction) => handleSuccess(transaction.reference),
      onClose: () => {
        setProcessing(false);

        // The popup closed without Paystack's success callback — common with
        // mobile money, where the donor approves an STK push on their phone
        // and the popup may vanish before it polls the final status. The
        // charge can still have succeeded, so ask our server to check the
        // known reference directly against Paystack before giving up.
        if (sawSuccess) return;

        (async () => {
          try {
            await confirmPayment(reference);
            if (sawSuccess) return;
            sawSuccess = true;
            setResult({
              type: "success",
              guestEmail: isGuest ? donorEmail.trim().toLowerCase() : null,
              message: thankYouMessage(reference),
            });
            scheduleReload();
            if (isCartCheckout) clearCart();
          } catch {
            // Not verified (abandoned checkout, or the charge is still being
            // processed on the donor's phone). Never show a scary error here:
            // if money did move, the webhook / a later verification will
            // still record it — nothing is lost.
            setResult({
              type: "info",
              message:
                "Payment window closed. If you completed the payment on your phone, it was received and will appear in your history shortly.",
            });
          }
        })();
      },
      onCancel: () => {
        // Safety net: some inline.js builds only emit onCancel (not onClose)
        // when the donor abandons the popup, so always clear the busy state.
        setProcessing(false);
      },
    });

    try {
      handler.openIframe();
    } catch (err) {
      // Popup blocked or failed to open — never leave the button stuck on
      // "Processing...".
      console.error("Failed to open payment window:", err);
      setProcessing(false);
      setResult({
        type: "error",
        message:
          "Couldn't open the payment window. Please allow pop-ups for this site and try again.",
      });
    }
  };

  // Full current URL (path + query) so a sponsorship deep link's child_id/
  // child_name/purpose params survive the round trip through sign-in/sign-up
  // and land the donor right back where they started, form intact.
  const redirectTarget = encodeURIComponent(
    `${location.pathname}${location.search}`,
  );

  if (authLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-[#fffdf8] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0b2d47] text-[#f0cd72] shadow-[0_14px_32px_rgba(11,45,71,.14)]">
              <Loader2 className="h-6 w-6 animate-spin" />
            </span>
            <p className="font-body text-sm text-[#766d5f]">
              Preparing your giving page…
            </p>
          </div>
        </div>
      </PageTransition>
    );
  }

  // Child sponsorship must be linked to a donor account. General donations
  // can be made as a guest, with an optional account afterwards.
  if (!user && isSponsorship) {
    return (
      <PageTransition>
        <main className="min-h-screen overflow-hidden bg-[#fffdf8]">
          <section className="relative isolate overflow-hidden bg-[#08243a] pt-32 pb-24 sm:pt-36 sm:pb-28">
            <div className="pointer-events-none absolute -left-28 top-10 h-80 w-80 rounded-full border border-white/[0.06]" />
            <div className="pointer-events-none absolute -right-20 -top-24 h-96 w-96 rounded-full border border-[#d3a32b]/15" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#245a72]/10 blur-3xl" />

            <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
              <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 font-body text-xs font-bold uppercase tracking-[0.2em] text-[#f0cd72]">
                <Heart className="h-4 w-4" />
                Give with confidence
              </div>

              <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl">
                Your generosity can become
                <span className="block text-[#f0cd72]">
                  someone's next opportunity.
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl font-body text-base leading-8 text-white/70 sm:text-lg">
                Sign in or create an account to continue. Your account keeps
                your donations and sponsorships together in one secure place.
              </p>
            </div>

            <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
              <svg
                viewBox="0 0 1440 90"
                preserveAspectRatio="none"
                className="block h-[48px] w-[calc(100%+1.3px)] sm:h-[68px]"
              >
                <path
                  d="M0 42C250 82 420 18 690 38C980 60 1160 76 1440 22V90H0Z"
                  fill="#fffdf8"
                />
              </svg>
            </div>
          </section>

          <section className="relative py-16 sm:py-20 lg:py-24">
            <div className="pointer-events-none absolute -left-24 top-24 h-64 w-64 rounded-full border border-[#d9bd7c]/20" />
            <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full border border-[#d9bd7c]/20" />

            <div className="relative mx-auto max-w-xl px-4 sm:px-6">
              <div className="rounded-[2rem] border border-[#eadfc8] bg-white p-7 text-center shadow-[0_22px_54px_rgba(55,43,20,.08)] sm:p-10">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#0b2d47] text-[#f0cd72]">
                  <UserPlus className="h-6 w-6" />
                </span>
                <p className="mt-6 font-body text-xs font-bold uppercase tracking-[0.18em] text-[#a7770c]">
                  One quick step
                </p>
                <h2 className="mt-2 font-display text-3xl font-bold text-deep-navy sm:text-4xl">
                  Sign in to continue
                </h2>
                <p className="mx-auto mt-4 max-w-md font-body text-sm leading-7 text-[#6b6255] sm:text-base">
                  Create a free donor account to securely track your giving,
                  sponsorships, and donation history.
                </p>

                <Link
                  to={`/donor-auth?mode=signup&redirect=${redirectTarget}`}
                  className="group mx-auto mt-8 flex w-full max-w-[330px] items-center justify-between rounded-full border border-[#163d59]/80 bg-[#0b2d47] py-2 pl-6 pr-2 font-body text-[15px] font-semibold text-white shadow-[0_12px_28px_rgba(11,45,71,0.16)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#c99a2e] hover:bg-[#103652] hover:shadow-[0_16px_34px_rgba(11,45,71,0.22)] focus:outline-none focus:ring-2 focus:ring-[#c99a2e]/30 focus:ring-offset-2 sm:max-w-[300px]"
                >
                  <span className="pl-1">Continue to Account</span>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] text-[#f0cd72] transition-all duration-300 group-hover:border-[#f0cd72] group-hover:bg-[#f0cd72] group-hover:text-[#0b2d47]">
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </span>
                </Link>

                <p className="mt-5 font-body text-xs text-[#8a8173]">
                  Already have an account? You can sign in on the next screen.
                </p>
              </div>
            </div>
          </section>
        </main>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <SEO title="Donate" description="Make a secure donation to Kadesh Hope Mission and support education, healthcare, and food security across Africa." />
      <main className="overflow-hidden bg-[#f5f7fb]">
        {/* Hero */}
        <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#0b2342] via-[#12366d] to-[#1e5bab] pb-24 pt-14 sm:pt-16">
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/[0.08]" />
          <div className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-white/[0.04] blur-2xl" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 font-body text-xs font-semibold uppercase tracking-[0.16em] text-white/85">
              <LockKeyhole className="h-3.5 w-3.5" />
              {isSponsorship ? "Secure sponsorship checkout" : "Secure donation"}
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              {isSponsorship
                ? "Complete your sponsorship"
                : "Make a donation"}
            </h1>
            <p className="mt-3 max-w-2xl font-body text-base leading-7 text-white/75">
              {isSponsorship
                ? "Help provide education fees, school supplies and meals for the children you've chosen."
                : "Support education, health, food security and long-term development in the communities we serve."}
            </p>
            <ol className="mt-6 flex flex-wrap gap-2 font-body text-xs font-semibold text-white/80">
              {["Your details", isSponsorship ? "Support options" : "Amount", "Secure payment"].map(
                (step, index) => (
                  <li
                    key={step}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-[#12366d]">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ),
              )}
            </ol>
          </div>
        </section>

        <section className="relative -mt-14 pb-16 sm:pb-20">

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {result && (
              <div
                className={`mx-auto mb-8 flex max-w-4xl items-start gap-3 rounded-[1.35rem] border p-4 ${
                  result.type === "success"
                    ? "border-green-200 bg-green-50"
                    : result.type === "info"
                      ? "border-[#d6e3e9] bg-[#f3f8fa]"
                      : "border-red-200 bg-red-50"
                }`}
              >
                {result.type === "success" ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                ) : result.type === "info" ? (
                  <Shield className="mt-0.5 h-5 w-5 shrink-0 text-[#0e5874]" />
                ) : (
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                )}
                <div className="min-w-0">
                  <p
                    className={`font-body text-sm leading-6 ${
                      result.type === "success"
                        ? "text-green-800"
                        : result.type === "info"
                          ? "text-deep-navy"
                          : "text-red-800"
                    }`}
                  >
                    {result.message}
                  </p>
                  {result.type === "success" && result.guestEmail && (
                    <div className="mt-3 rounded-xl border border-green-200 bg-white p-4">
                      <p className="font-body text-sm font-semibold text-deep-navy">
                        Create a free account to keep track of your giving
                      </p>
                      <p className="mt-1 font-body text-xs leading-5 text-slate-600">
                        Sign up with {result.guestEmail} and this donation will
                        appear in your account automatically, along with
                        reminders for monthly gifts.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          to={`/signup?redirect=${encodeURIComponent("/account")}&email=${encodeURIComponent(result.guestEmail)}`}
                          className="inline-flex items-center gap-2 rounded-full bg-[#0b2d47] px-4 py-2 font-body text-sm font-semibold text-white hover:bg-[#103652]"
                        >
                          <UserPlus className="h-4 w-4" />
                          Create my account
                        </Link>
                        <Link
                          to={`/login?redirect=${encodeURIComponent("/account")}&email=${encodeURIComponent(result.guestEmail)}`}
                          className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 font-body text-sm font-semibold text-deep-navy hover:border-[#1e5bab]/50"
                        >
                          I already have an account
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px] xl:gap-10">
              {/* Main donation card */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-30px_rgba(15,38,82,0.35)]">
                <div className="border-b border-slate-100 px-6 py-6 sm:px-8 lg:px-10">
                  <p className="font-body text-xs font-bold uppercase tracking-[0.18em] text-[#1e5bab]">
                    {isSponsorship ? "Sponsorship details" : "Your gift"}
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-bold text-deep-navy sm:text-3xl">
                    {isSponsorship
                      ? "Complete your support"
                      : "Choose how you would like to give"}
                  </h2>
                  <p className="mt-3 max-w-2xl font-body text-sm leading-7 text-slate-600 sm:text-base">
                    Enter your details, choose the frequency and amount, then
                    continue to secure payment.
                  </p>
                  {isGuest && (
                    <p className="mt-4 max-w-2xl rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 font-body text-sm leading-6 text-slate-700">
                      You're giving as a guest. You can create a free account
                      after your gift, or{" "}
                      <Link
                        to={`/login?redirect=${redirectTarget}`}
                        className="font-semibold text-[#0b2d47] underline underline-offset-2"
                      >
                        sign in now
                      </Link>{" "}
                      to fill in your details.
                    </p>
                  )}
                </div>

                <div className="p-6 sm:p-8 lg:p-10">
                  {/* Donor Information */}
                  <div>
                    <div className="mb-5 flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0b2d47] font-display text-sm font-bold text-white">
                        1
                      </span>
                      <div>
                        <h3 className="font-display text-xl font-bold text-deep-navy">
                          Your details
                        </h3>
                        <p className="font-body text-xs text-slate-500">
                          Used for your receipt and donation record.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="donorName"
                          className="mb-2 block font-body text-sm font-semibold text-deep-navy"
                        >
                          Your name <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="donorName"
                          type="text"
                          placeholder="John Doe"
                          value={donorName}
                          onChange={(e) => setDonorName(e.target.value)}
                          className={`w-full rounded-xl border bg-white px-4 py-3.5 font-body text-[15px] text-deep-navy outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                            attemptedSubmit && fieldErrors.donorName
                              ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                              : "border-slate-200 focus:border-[#1e5bab] focus:ring-[#1e5bab]/10"
                          }`}
                        />
                        {attemptedSubmit && fieldErrors.donorName && (
                          <p className="mt-1.5 font-body text-xs text-red-600">
                            {fieldErrors.donorName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="donorEmail"
                          className="mb-2 block font-body text-sm font-semibold text-deep-navy"
                        >
                          Email address <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="donorEmail"
                          type="email"
                          placeholder="john@example.com"
                          value={donorEmail}
                          onChange={(e) => setDonorEmail(e.target.value)}
                          className={`w-full rounded-xl border bg-white px-4 py-3.5 font-body text-[15px] text-deep-navy outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                            attemptedSubmit && fieldErrors.donorEmail
                              ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                              : "border-slate-200 focus:border-[#1e5bab] focus:ring-[#1e5bab]/10"
                          }`}
                        />
                        {attemptedSubmit && fieldErrors.donorEmail && (
                          <p className="mt-1.5 font-body text-xs text-red-600">
                            {fieldErrors.donorEmail}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="donorLocation"
                          className="mb-2 block font-body text-sm font-semibold text-deep-navy"
                        >
                          Location <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="donorLocation"
                          type="text"
                          placeholder="City, Country"
                          value={donorLocation}
                          onChange={(e) => setDonorLocation(e.target.value)}
                          className={`w-full rounded-xl border bg-white px-4 py-3.5 font-body text-[15px] text-deep-navy outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                            attemptedSubmit && fieldErrors.donorLocation
                              ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                              : "border-slate-200 focus:border-[#1e5bab] focus:ring-[#1e5bab]/10"
                          }`}
                        />
                        {attemptedSubmit && fieldErrors.donorLocation && (
                          <p className="mt-1.5 font-body text-xs text-red-600">
                            {fieldErrors.donorLocation}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="donorPhone"
                          className="mb-2 block font-body text-sm font-semibold text-deep-navy"
                        >
                          Phone number <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="donorPhone"
                          type="tel"
                          placeholder="+1 234 567 8900"
                          value={donorPhone}
                          onChange={(e) => setDonorPhone(e.target.value)}
                          className={`w-full rounded-xl border bg-white px-4 py-3.5 font-body text-[15px] text-deep-navy outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                            attemptedSubmit && fieldErrors.donorPhone
                              ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                              : "border-slate-200 focus:border-[#1e5bab] focus:ring-[#1e5bab]/10"
                          }`}
                        />
                        {attemptedSubmit && fieldErrors.donorPhone && (
                          <p className="mt-1.5 font-body text-xs text-red-600">
                            {fieldErrors.donorPhone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="my-9 h-px bg-slate-100" />

                  {/* Giving preferences */}
                  <div>
                    <div className="mb-5 flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0b2d47] font-display text-sm font-bold text-white">
                        2
                      </span>
                      <div>
                        <h3 className="font-display text-xl font-bold text-deep-navy">
                          Giving preference
                        </h3>
                        <p className="font-body text-xs text-slate-500">
                          {isSponsorship
                            ? "Choose how often you would like to give."
                            : "Suggested gifts from $100 monthly or one-time; custom amounts from $500."}
                        </p>
                      </div>
                    </div>

                    <div>
                      <div>
                        <label className="mb-2 block font-body text-sm font-semibold text-deep-navy">
                          Frequency
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setFrequency("monthly")}
                            disabled={processing}
                            aria-pressed={frequency === "monthly"}
                            className={`rounded-xl border px-4 py-3.5 text-left transition ${
                              frequency === "monthly"
                                ? "border-[#1e5bab] bg-[#1e5bab] text-white shadow-[0_10px_24px_-12px_rgba(30,91,171,.6)]"
                                : "border-slate-200 bg-white text-deep-navy hover:border-[#1e5bab]/50"
                            }`}
                          >
                            <span className="block font-body text-sm font-bold">
                              Monthly
                            </span>
                            <span
                              className={`mt-1 block font-body text-xs ${frequency === "monthly" ? "text-white/65" : "text-slate-500"}`}
                            >
                              {isSponsorship
                                ? "$25 or $50 per child / month"
                                : "From $100, paid each month"}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFrequency("one-time")}
                            disabled={processing}
                            aria-pressed={frequency === "one-time"}
                            className={`rounded-xl border px-4 py-3.5 text-left transition ${
                              frequency === "one-time"
                                ? "border-[#1e5bab] bg-[#1e5bab] text-white shadow-[0_10px_24px_-12px_rgba(30,91,171,.6)]"
                                : "border-slate-200 bg-white text-deep-navy hover:border-[#1e5bab]/50"
                            }`}
                          >
                            <span className="block font-body text-sm font-bold">
                              One-time
                            </span>
                            <span
                              className={`mt-1 block font-body text-xs ${frequency === "one-time" ? "text-white/65" : "text-slate-500"}`}
                            >
                              {isSponsorship
                                ? "$100 per need or $300 full year"
                                : "Single gift, from $100"}
                            </span>
                          </button>
                        </div>
                      </div>

                    </div>
                    {!isSponsorship && frequency === "monthly" && (
                      <p className="mt-3 rounded-xl bg-blue-50/60 px-4 py-3 font-body text-xs leading-5 text-slate-600">
                        Monthly gifts are not charged automatically. You pay
                        this month's gift now and give again each month. If
                        you have an account, it will remind you when your next
                        gift is due.
                      </p>
                    )}
                  </div>

                  <div className="my-9 h-px bg-slate-100" />

                  {/* Amount */}
                  <div>
                    <div className="mb-5 flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0b2d47] font-display text-sm font-bold text-white">
                        3
                      </span>
                      <div>
                        <h3 className="font-display text-xl font-bold text-deep-navy">
                          {isCartCheckout
                            ? "Sponsorship amount"
                            : "Choose an amount"}
                        </h3>
                        <p className="font-body text-xs text-slate-500">
                          {isCartCheckout
                            ? "Choose a support option for each child, then review your total."
                            : "Select a suggested gift or enter your own amount."}
                        </p>
                      </div>
                    </div>

                    {isCartCheckout ? (
                      <>
                        <SponsorshipCartSelection
                          editable
                          disabled={processing}
                        />
                        {sponsorshipError && (
                          <p
                            role="status"
                            className="mt-3 text-sm text-amber-900"
                          >
                            {sponsorshipError}
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {donationPresets.map((amount) => (
                            <button
                              type="button"
                              key={amount}
                              onClick={() => handleAmountClick(amount)}
                              disabled={processing}
                              className={`rounded-xl border px-3 py-3.5 font-body text-sm font-bold transition ${
                                selectedUSD === amount && !isOther
                                  ? "border-[#1e5bab] bg-[#1e5bab] text-white shadow-[0_10px_24px_-12px_rgba(30,91,171,.6)]"
                                  : "border-slate-200 bg-white text-deep-navy hover:border-[#1e5bab]/50 hover:bg-slate-50"
                              }`}
                            >
                              {formatUSD(amount)}
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setIsOther(true);
                            setResult(null);
                          }}
                          className={`mt-3 w-full rounded-xl border px-4 py-3.5 font-body text-sm font-bold transition ${
                            isOther
                              ? "border-[#1e5bab] bg-[#eef4fc] text-[#1e5bab]"
                              : "border-slate-200 bg-white text-deep-navy hover:border-[#1e5bab]/50"
                          }`}
                        >
                          Enter a different amount
                        </button>

                        {isOther && (
                          <div className="mt-4">
                            <label
                              htmlFor="customAmount"
                              className="mb-2 block font-body text-sm font-semibold text-deep-navy"
                            >
                              Custom amount (USD, minimum ${minDonation})
                            </label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-body text-slate-500">
                                $
                              </span>
                              <input
                                id="customAmount"
                                disabled={processing}
                                type="number"
                                min={minDonation}
                                step="0.01"
                                placeholder={String(minDonation)}
                                aria-describedby="custom-amount-help"
                                aria-invalid={
                                  customAmount !== "" && !isValidAmount
                                }
                                value={customAmount}
                                onChange={(e) => {
                                  setCustomAmount(e.target.value);
                                  setResult(null);
                                }}
                                className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-8 pr-4 font-body text-deep-navy outline-none transition focus:border-[#1e5bab] focus:bg-white focus:ring-4 focus:ring-[#1e5bab]/10"
                              />
                            </div>
                            <p
                              id="custom-amount-help"
                              className="mt-2 text-xs text-slate-600"
                            >
                              {frequency === "monthly"
                                ? `Custom monthly gifts start at $${minDonation} USD. For smaller gifts, choose a suggested amount above.`
                                : `Custom gifts start at $${minDonation} USD. For smaller gifts, choose a suggested amount above.`}
                            </p>
                            {customAmount !== "" && !isValidAmount && (
                              <p className="mt-1.5 font-body text-xs text-red-600">
                                Please enter ${minDonation} or more, or select a
                                suggested amount above.
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {isSponsorship && <AnnualFundingNotice />}
                  {/* Payment */}
                  <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-deep-navy sm:p-6">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#1e5bab] shadow-sm">
                        <LockKeyhole className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-body text-sm font-bold">
                          Secure payment
                        </p>
                        <p className="mt-1 font-body text-xs leading-5 text-slate-600">
                          Payments are securely processed via Paystack in
                          Kenyan shillings (KSh) at $1 = KSh {KES_PER_USD}.
                          {isValidAmount && baseAmount > 0 && (
                            <>
                              {" "}
                              You will be charged{" "}
                              <span className="font-bold text-deep-navy">
                                {formatKES(chargeKES)}
                              </span>{" "}
                              for this {formatUSD(baseAmount)} gift. Your bank
                              or mobile money provider may apply its own
                              exchange rate.
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {[
                        "Visa / Mastercard",
                        "M-Pesa",
                        "Airtel Money",
                        "Bank Transfer",
                      ].map((method) => (
                        <span
                          key={method}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-body text-[11px] font-semibold text-slate-600"
                        >
                          {method}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Button
                    className={`mt-6 w-full justify-center rounded-xl py-4 text-base font-bold text-white sm:text-lg ${
                      result?.type === "success" && !processing
                        ? "bg-green-600 hover:bg-green-600"
                        : "bg-[#1e5bab] hover:bg-[#174a8d]"
                    }`}
                    onClick={handlePay}
                    disabled={
                      processing ||
                      !isValidAmount ||
                      (result?.type === "success" && !processing)
                    }
                  >
                    {processing ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing…
                      </span>
                    ) : result?.type === "success" ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        Payment Successful
                      </span>
                    ) : isSponsorship ? (
                      isCartCheckout ? (
                        `Sponsor ${cartCount} ${cartCount === 1 ? "Child" : "Children"} · ${formatUSD(baseAmount)}`
                      ) : (
                        `Complete Sponsorship · ${formatUSD(baseAmount)}`
                      )
                    ) : (
                      `Donate ${formatUSD(baseAmount)}${frequency === "monthly" ? " this month" : ""}`
                    )}
                  </Button>

                  {attemptedSubmit && hasFieldErrors && (
                    <p className="mt-3 text-center font-body text-sm text-red-600">
                      Please fill in all required fields above before donating.
                    </p>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <aside className="space-y-5 lg:sticky lg:top-28">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-34px_rgba(15,38,82,0.4)]">
                  <div className="border-b border-slate-100 px-6 py-5">
                    <p className="font-body text-xs font-bold uppercase tracking-[0.18em] text-[#1e5bab]">
                      Summary
                    </p>
                  </div>
                  <dl className="space-y-3 px-6 py-5 font-body text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Type</dt>
                      <dd className="font-semibold text-deep-navy">
                        {isSponsorship
                          ? `Sponsorship · ${cartCount} ${cartCount === 1 ? "child" : "children"}`
                          : "Donation"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Frequency</dt>
                      <dd className="font-semibold text-deep-navy">
                        {frequency === "monthly" ? "Monthly (paid each month)" : "One-time"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Amount</dt>
                      <dd className="font-semibold text-deep-navy">
                        {formatUSD(baseAmount)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-dashed border-slate-200 pt-3">
                      <dt className="text-slate-500">You&apos;ll be charged</dt>
                      <dd className="text-right">
                        <span className="block font-display text-2xl font-bold text-deep-navy">
                          {isValidAmount && baseAmount > 0
                            ? formatKES(chargeKES)
                            : "—"}
                        </span>
                        <span className="text-xs text-slate-500">
                          at $1 = KSh {KES_PER_USD}
                        </span>
                      </dd>
                    </div>
                  </dl>
                  <ul className="space-y-2.5 border-t border-slate-100 bg-slate-50/70 px-6 py-5 font-body text-sm text-slate-600">
                    {[
                      "Secure Paystack checkout",
                      isGuest
                        ? "Optional free account after your gift"
                        : "Saved to your account",
                      "Card, M-Pesa, Airtel Money or bank",
                    ].map((line) => (
                      <li key={line} className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <p className="font-body text-xs font-bold uppercase tracking-[0.18em] text-[#1e5bab]">
                    Where your money goes
                  </p>
                  <div className="mt-4 space-y-4">
                    {[
                      { label: "Program services", value: 92 },
                      { label: "Administration", value: 5 },
                      { label: "Fundraising", value: 3 },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="mb-1.5 flex items-center justify-between font-body text-sm">
                          <span className="text-slate-600">{item.label}</span>
                          <span className="font-semibold text-deep-navy">
                            {item.value}%
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[#1e5bab]"
                            style={{ width: `${item.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 grid grid-cols-3 gap-2 border-t border-slate-100 pt-5 text-center">
                    {[
                      { icon: BookOpen, label: "Education" },
                      { icon: Stethoscope, label: "Health" },
                      { icon: Users, label: "Families" },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label}>
                        <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-[#1e5bab]">
                          <Icon className="h-4 w-4" />
                        </span>
                        <p className="mt-1.5 font-body text-[11px] font-semibold text-slate-600">
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>
    </PageTransition>
  );
}
