import { useState, useEffect } from "react";
import { useSearchParams, useLocation, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield, Heart, Globe, ChevronDown, CheckCircle2, XCircle, UserPlus, Loader2, X } from "lucide-react";
import PageTransition from "@/animations/PageTransition";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import SectionHeading from "@/components/ui/SectionHeading";
import ScrollReveal from "@/components/ui/ScrollReveal";
import Button from "@/components/ui/Button";
import { cmsText, useCMSReady } from "@/hooks/useCMS";
import { useDonorAuth } from "@/context/DonorAuthContext";
import { useSponsorshipCart } from "@/context/SponsorshipCartContext";
import SponsorshipAmountInput from "@/components/cart/SponsorshipAmountInput";
import supabase from "@/supabase/client";
import {
  CURRENCIES as currencies,
  fetchRates,
  rateFor,
  formatCurrency,
} from "@/lib/currency";

const USD_AMOUNTS = [10, 25, 50, 100, 250, 500];

// Currency list and live-rate plumbing live in lib/currency. Rates are fetched
// at runtime (cached ~6h) rather than hardcoded, because the old constants had
// drifted far enough to quote donors the wrong amount — see lib/currency.js.

const impactMap = {
  10: "Provides a meal for a child for one day",
  25: "Supplies basic school materials for a student",
  50: "Feeds a family of four for one week",
  100: "Covers medical supplies for a clinic visit",
  250: "Funds a clean water installation for a village",
  500: "Sponsors a child's education for one year",
};

// Paystack's merchant account settles in KES only. Whatever display currency
// the donor picks, the charge is computed from the live USD->KES rate, and the
// rate actually used is recorded with the payment.
const CHARGED_CURRENCY = "KES";

const inputClasses =
  "w-full px-4 py-3 rounded-lg border border-soft-accent bg-white font-body text-on-background placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-vibrant-blue/50 focus:border-vibrant-blue transition-all";

// key for the repeated-donor autofill (last donor details on this device)
const AUTO_KEY = "khm_donor_autofill";

// Compact hero for the top of the Donate page. Every other page in the site
// opens with a badge/title/subtitle block, and the CMS exposes those three
// fields for "donate" — this is what they drive.
function DonateHero() {
  return (
    <section className="relative overflow-hidden bg-deep-navy">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-vibrant-blue/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-hope-orange/20 blur-3xl" />
      </div>

      <Container className="relative z-10">
        <div className="flex flex-col items-center text-center text-white pt-32 pb-10 md:pt-40 md:pb-14">
          <ScrollReveal>
            <span className="inline-block rounded-full bg-hope-orange px-5 py-2 font-body text-label-bold uppercase tracking-widest text-white">
              {cmsText("donate", "heroBadge")}
            </span>
          </ScrollReveal>
          <SectionHeading
            title={cmsText("donate", "heroTitle")}
            subtitle={cmsText("donate", "heroSubtitle")}
            light
            className="mt-6"
          />
        </div>
      </Container>
    </section>
  );
}

export default function Donate() {
  useCMSReady();

  const { user, profile, loading: authLoading } = useDonorAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const sponsorshipChildId = searchParams.get("child_id");
  const sponsorshipChildName = searchParams.get("child_name");
  const isSponsorship = searchParams.get("purpose") === "sponsorship";

  const {
    cartItems,
    cartCount,
    subtotal,
    setItemAmount,
    removeFromCart,
    clearCart,
  } = useSponsorshipCart();
  // Cart checkout: the donor queued one or more children and is paying for all
  // of them in this single transaction.
  const isCartCheckout =
    isSponsorship && searchParams.get("cart") === "1" && cartItems.length > 0;

  // Renewal: the donor arrived from the red "Update sponsorship" link on an
  // overdue monthly sponsorship. We pre-select monthly and carry the
  // sponsorship id in the payment metadata so a successful payment advances
  // that specific sponsorship's billing period instead of enrolling anyone new.
  const renewSponsorshipId = searchParams.get("renew");
  const renewChildId = searchParams.get("child");
  const isRenewal = Boolean(renewSponsorshipId);
  const renewalSponsor = useQuery({
    queryKey: ["renewal-sponsorship", renewSponsorshipId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sponsorships")
        .select("id, child_id, monthly_amount, status, next_payment_due, children(first_name)")
        .eq("id", renewSponsorshipId)
        .eq("donor_id", user?.id ?? "")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: isRenewal && !!user?.id,
  });

  const [frequency, setFrequency] = useState(isRenewal ? "monthly" : "one-time");
  // A renewal defaults to the amount actually agreed for the month, so the
  // donor isn't asked to re-enter a figure they already committed to.
  const [selectedUSD, setSelectedUSD] = useState(50);
  const [customAmount, setCustomAmount] = useState("");
  const [isOther, setIsOther] = useState(false);
  const [currencyCode, setCurrencyCode] = useState("USD");
  // Live USD-base rates. `ratesLive` is false when the lookup failed and we're
  // on fallback figures, which we disclose rather than silently misquote.
  const [rates, setRates] = useState(null);
  const [ratesLive, setRatesLive] = useState(true);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
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
        [profile.first_name, profile.last_name].filter(Boolean).join(" ")
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
          })
        );
      } catch {
        // Storage unavailable — autofill just won't persist this session.
      }
    }, 600);
    return () => clearTimeout(t);
  }, [donorName, donorEmail, donorLocation, donorPhone]);

  // Live rates, fetched once per mount. Until they resolve, fall back to the
  // bundled figures so the form still renders and totals stay consistent.
  useEffect(() => {
    let cancelled = false;
    fetchRates().then(({ rates: r, live }) => {
      if (cancelled) return;
      setRates(r);
      setRatesLive(live);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const currency =
    currencies.find((c) => c.code === currencyCode) ?? currencies[0];
  // The selected currency's rate, preferring the live value.
  const currencyRate = rates ? rateFor(rates, currency.code) : currency.rate;

  // For a renewal, the amount is the existing monthly figure unless the donor
  // deliberately overrides it. The sponsorship row is only readable by its
  // owner (RLS), so this can't be used to read someone else's pledge.
  const renewalAmount = Number(renewalSponsor.data?.monthly_amount) || 0;

  const baseAmount = isCartCheckout
    ? subtotal
    : isRenewal && renewalAmount > 0
      ? renewalAmount
      : isOther
        ? Number(customAmount) || 0
        : selectedUSD;
  // A gift must be above zero and no larger than a million US dollars, which is
  // the ceiling the ledger and donation columns are sized for. Catching it here
  // means the donor is told plainly instead of Paystack quietly declining a
  // charge that size.
  const MAX_GIFT_USD = 1000000;
  const amountError =
    !(baseAmount > 0)
      ? "Enter an amount greater than zero"
      : baseAmount > MAX_GIFT_USD
        ? `The maximum single gift is $${MAX_GIFT_USD.toLocaleString()}`
        : null;
  const isValidAmount = !amountError;
  // The donor always thinks in USD (the preset amounts and the reporting
  // currency); this is just that figure restated in the currency they picked,
  // at the live rate.
  const convertedAmount = baseAmount * currencyRate;
  // What Paystack will actually charge: USD converted to KES at the live rate.
  const kesRate = rates ? rateFor(rates, CHARGED_CURRENCY) : 129;
  const amountInKES = baseAmount * kesRate;
  const impactText = impactMap[baseAmount] || "Every gift makes a difference";

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

  useEffect(() => {
    const handleClick = () => setShowCurrencyPicker(false);
    if (showCurrencyPicker) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [showCurrencyPicker]);

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
    const invokePromise = supabase.functions.invoke("verify-paystack-transaction", {
      body: { reference },
    });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              "Verification is taking longer than expected. Your payment may still have succeeded — we'll confirm it automatically shortly."
            )
          ),
        15000
      )
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
  // confirmation and note their reference. A renewal instead returns the
  // donor to their account, where the advanced period and cleared overdue
  // badge are the proof the payment landed.
  const scheduleReload = () => {
    if (isRenewal) {
      setTimeout(() => navigate("/account"), 3000);
      return;
    }
    setTimeout(() => window.location.reload(), 3000);
  };

  const handlePay = () => {
    setAttemptedSubmit(true);

    if (!formIsValid) {
      setResult({
        type: "error",
        message: "Please fill in all required fields correctly before donating.",
      });
      return;
    }

    setResult(null);
    setProcessing(true);

    // Always bill in KES regardless of the display currency picked above —
    // Paystack's account settles in KES. Paystack expects subunits, and the
    // amount is rounded to whole KES (shillings) so the charge matches the
    // figure shown to the donor.
    const chargedKES = Math.round(amountInKES);
    const amountInKESSubunit = chargedKES * 100;

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
        message: isRenewal
          ? `Thank you! Reference: ${ref}. Your next month is now active — returning you to your account…`
          : `Thank you for your donation! Reference: ${ref}. This page will refresh automatically…`,
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
        if (isRenewal) {
          queryClient.invalidateQueries({ queryKey: ["renewal-sponsorship"] });
        }
        if (isCartCheckout) clearCart();
      } catch (err) {
        console.error("Payment verification failed:", err);
        // The charge went through on Paystack's side, so this stays a
        // success — just note that our records may lag behind (the webhook
        // still records it), keeping the reference visible for support.
        setResult({
          type: "success",
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
        // What the donor selected, for their receipt.
        display_currency: currency.code,
        display_amount: Math.round(convertedAmount),
        usd_equivalent: baseAmount,
        // What Paystack will charge, and the rate used to get there. The server
        // re-derives USD from the charged amount and re-fetches a live rate, so
        // these are informational — a tampered value can't change the books.
        charged_currency: CHARGED_CURRENCY,
        charged_amount: chargedKES,
        fx_rate: Number(kesRate.toFixed(6)),
        location: donorLocation,
        phone: donorPhone,
        // Sponsorship intent travels with the transaction itself, so it's
        // recoverable from Paystack's own records (via verify or webhook)
        // even if the donor's browser never calls back successfully.
        is_sponsorship: (isSponsorship || isRenewal) && !!user?.id,
        child_id: isRenewal
          ? renewChildId || null
          : isSponsorship
            ? isCartCheckout
              ? cartItems[0]?.child_id || null
              : sponsorshipChildId || null
            : null,
        // A renewal payment advances an existing monthly sponsorship's period.
        // The id travels through Paystack's verified metadata and the RPC
        // re-checks ownership, so it can't be edited client-side to unlock
        // somebody else's child.
        renew_sponsorship_id: isRenewal ? renewSponsorshipId : null,
        monthly_amount:
          isSponsorship && !isCartCheckout && frequency === "monthly"
            ? baseAmount
            : null,
        // Cart checkout: one payment covers several children. Each child gets
        // its own sponsorship row (with its amount) linked to this donation.
        children: isCartCheckout
          ? cartItems.map((i) => ({
              child_id: i.child_id,
              amount: Number(i.amount) || 0,
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
              message: `Thank you for your donation! Reference: ${reference}. This page will refresh automatically…`,
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
  const redirectTarget = encodeURIComponent(`${location.pathname}${location.search}`);

  if (authLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-vibrant-blue" />
        </div>
      </PageTransition>
    );
  }

  if (!user) {
    return (
      <PageTransition>
        <DonateHero />
        <Section className="pt-10 pb-20">
          <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {isSponsorship && sponsorshipChildName && (
              <div className="bg-hope-orange/10 border border-hope-orange/30 rounded-xl p-4 mb-8 flex items-center gap-3 text-left">
                <Heart className="h-5 w-5 text-hope-orange shrink-0" />
                <p className="font-body text-sm text-deep-navy">
                  You're about to sponsor <strong>{decodeURIComponent(sponsorshipChildName)}</strong>.
                  Sign in or create a free account first so this sponsorship is saved to yours.
                </p>
              </div>
            )}

            <SectionHeading
              title="Sign in to continue"
              subtitle="An account lets you track your donations and sponsorships in one place"
            />

            <div className="mt-10 flex justify-center">
              <Button
                variant="lightblue"
                size="lg"
                as={Link}
                to={`/donor-auth?mode=signup&redirect=${redirectTarget}`}
                className="w-full sm:w-auto"
              >
                Get Started
                <UserPlus className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <p className="mt-6 font-body text-sm text-on-surface-variant">
              Already have an account? You can sign in from the next screen.
            </p>
          </div>
        </Section>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <DonateHero />
      <Section className="pt-10 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isSponsorship && sponsorshipChildName && (
            <div className="bg-hope-orange/10 border border-hope-orange/30 rounded-xl p-4 mb-8 flex items-center gap-3">
              <Heart className="h-5 w-5 text-hope-orange shrink-0" />
              <p className="font-body text-sm text-deep-navy">
                You are sponsoring <strong>{decodeURIComponent(sponsorshipChildName)}</strong>. Your
                donation will help provide education, healthcare, and hope.
              </p>
            </div>
          )}

          <SectionHeading
            title={
              isSponsorship
                ? "Complete Your Sponsorship"
                : cmsText("donate", "sectionTitle")
            }
            subtitle={
              isSponsorship
                ? "Your generosity transforms a child's life"
                : cmsText("donate", "sectionSub")
            }
          />

          {result && (
            <div
              className={`mt-8 rounded-xl p-4 flex items-start gap-3 border ${
                result.type === "success"
                  ? "bg-green-50 border-green-200"
                  : result.type === "info"
                    ? "bg-vibrant-blue/5 border-soft-accent"
                    : "bg-red-50 border-red-200"
              }`}
            >
              {result.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              ) : result.type === "info" ? (
                <Shield className="h-5 w-5 text-vibrant-blue shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <p
                className={`font-body text-sm ${
                  result.type === "success"
                    ? "text-green-800"
                    : result.type === "info"
                      ? "text-deep-navy"
                      : "text-red-800"
                }`}
              >
                {result.message}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-16">
            {/* Donation Form */}
            <div className="lg:col-span-8">
              {/* Donor Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div>
                  <label htmlFor="donorName" className="block text-sm font-medium text-on-background mb-2">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="donorName"
                    type="text"
                    placeholder="John Doe"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className={`${inputClasses} ${
                      attemptedSubmit && fieldErrors.donorName ? "border-red-400 focus:ring-red-300 focus:border-red-400" : ""
                    }`}
                  />
                  {attemptedSubmit && fieldErrors.donorName && (
                    <p className="mt-1 text-sm text-red-600 font-body">{fieldErrors.donorName}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="donorEmail" className="block text-sm font-medium text-on-background mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="donorEmail"
                    type="email"
                    placeholder="john@example.com"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    className={`${inputClasses} ${
                      attemptedSubmit && fieldErrors.donorEmail ? "border-red-400 focus:ring-red-300 focus:border-red-400" : ""
                    }`}
                  />
                  {attemptedSubmit && fieldErrors.donorEmail && (
                    <p className="mt-1 text-sm text-red-600 font-body">{fieldErrors.donorEmail}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="donorLocation" className="block text-sm font-medium text-on-background mb-2">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="donorLocation"
                    type="text"
                    placeholder="City, Country"
                    value={donorLocation}
                    onChange={(e) => setDonorLocation(e.target.value)}
                    className={`${inputClasses} ${
                      attemptedSubmit && fieldErrors.donorLocation ? "border-red-400 focus:ring-red-300 focus:border-red-400" : ""
                    }`}
                  />
                  {attemptedSubmit && fieldErrors.donorLocation && (
                    <p className="mt-1 text-sm text-red-600 font-body">{fieldErrors.donorLocation}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="donorPhone" className="block text-sm font-medium text-on-background mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="donorPhone"
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={donorPhone}
                    onChange={(e) => setDonorPhone(e.target.value)}
                    className={`${inputClasses} ${
                      attemptedSubmit && fieldErrors.donorPhone ? "border-red-400 focus:ring-red-300 focus:border-red-400" : ""
                    }`}
                  />
                  {attemptedSubmit && fieldErrors.donorPhone && (
                    <p className="mt-1 text-sm text-red-600 font-body">{fieldErrors.donorPhone}</p>
                  )}
                </div>
              </div>

              {/* Frequency Selection */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-on-background mb-3">
                  Giving Frequency
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFrequency("monthly")}
                    aria-pressed={frequency === "monthly"}
                    className={`flex items-center gap-3 px-4 py-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      frequency === "monthly"
                        ? "border-vibrant-blue bg-vibrant-blue/5 shadow-md"
                        : "border-soft-accent bg-white hover:border-vibrant-blue/40 hover:bg-vibrant-blue/5"
                    }`}
                  >
                    <span
                      className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 transition-colors ${
                        frequency === "monthly"
                          ? "bg-vibrant-blue text-white"
                          : "bg-cream text-on-surface-variant"
                      }`}
                    >
                      <Heart className="w-5 h-5" />
                    </span>
                    <span>
                      <span className="block font-body font-semibold text-on-background">Monthly</span>
                      <span className="block text-sm font-body text-on-surface-variant">
                        Sustained support every month
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFrequency("one-time")}
                    aria-pressed={frequency === "one-time"}
                    className={`flex items-center gap-3 px-4 py-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      frequency === "one-time"
                        ? "border-vibrant-blue bg-vibrant-blue/5 shadow-md"
                        : "border-soft-accent bg-white hover:border-vibrant-blue/40 hover:bg-vibrant-blue/5"
                    }`}
                  >
                    <span
                      className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 transition-colors ${
                        frequency === "one-time"
                          ? "bg-vibrant-blue text-white"
                          : "bg-cream text-on-surface-variant"
                      }`}
                    >
                      <Heart className="w-5 h-5" />
                    </span>
                    <span>
                      <span className="block font-body font-semibold text-on-background">One-time</span>
                      <span className="block text-sm font-body text-on-surface-variant">
                        A single gift when it suits you
                      </span>
                    </span>
                  </button>
                </div>
              </div>

              {/* Currency Selector */}
              <div className="mb-8 relative">
                <label className="block text-sm font-medium text-on-background mb-2">
                  Currency
                </label>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCurrencyPicker(!showCurrencyPicker);
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border border-soft-accent bg-white font-body text-on-background hover:border-vibrant-blue transition-colors w-full sm:w-auto"
                >
                  <Globe className="w-4 h-4 text-vibrant-blue" />
                  <span className="font-semibold">{currency.code}</span>
                  <span className="text-on-surface-variant">— {currency.name}</span>
                  <ChevronDown className="w-4 h-4 ml-auto text-on-surface-variant" />
                </button>

                {/* Rate transparency: the donor can always see the rate their
                    money is being converted at, and is told when it isn't live. */}
                <p className="mt-2 font-body text-xs text-on-surface-variant">
                  1 USD = {currency.symbol}
                  {currencyRate.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                  {!ratesLive && (
                    <span className="ml-1 text-amber-700">
                      (indicative rate — live rates unavailable)
                    </span>
                  )}
                </p>

                {showCurrencyPicker && (
                  <div className="absolute z-30 mt-2 w-full sm:w-80 bg-white rounded-xl border border-soft-accent shadow-lg overflow-hidden">
                    {currencies.map((cur) => (
                      <button
                        key={cur.code}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrencyCode(cur.code);
                          setShowCurrencyPicker(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-cream transition-colors ${
                          currency.code === cur.code ? "bg-vibrant-blue/5" : ""
                        }`}
                      >
                        <span className="w-10 text-center font-display font-bold text-vibrant-blue">
                          {cur.code}
                        </span>
                        <div className="flex-1">
                          <p className="font-body font-medium text-on-background text-sm">{cur.name}</p>
                          <p className="font-body text-xs text-on-surface-variant">
                            1 USD = {cur.symbol}
                            {rateFor(rates, cur.code).toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                        <span className="text-xs text-on-surface-variant">{cur.country}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Amount Selection */}
              {isCartCheckout ? (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-on-background mb-3">
                    Children you're sponsoring ({cartCount})
                  </label>
                  <div className="rounded-xl border border-soft-accent bg-white overflow-hidden divide-y divide-soft-accent/60">
                    {cartItems.map((item) => (
                      <div
                        key={item.child_id}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-vibrant-blue/15 to-hope-orange/15 flex items-center justify-center">
                          {item.photo_url ? (
                            <img
                              src={item.photo_url}
                              alt={item.first_name}
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="font-display text-lg font-bold text-vibrant-blue/40">
                              {(item.first_name || "?").charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-body text-sm font-semibold text-deep-navy truncate">
                            {item.first_name}
                          </p>
                          {item.location && (
                            <p className="font-body text-xs text-on-surface-variant truncate">
                              {item.location}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-body text-sm text-on-surface-variant">
                            $
                          </span>
                          <SponsorshipAmountInput
                            value={item.amount}
                            onCommit={(v) => setItemAmount(item.child_id, v)}
                            min={0}
                            aria-label={`Sponsorship amount for ${item.first_name}`}
                            className="w-24 px-3 py-1.5 rounded-lg border border-soft-accent bg-white font-body text-sm text-deep-navy text-right focus:outline-none focus:ring-2 focus:ring-vibrant-blue/50 focus:border-vibrant-blue transition-all"
                          />
                        </div>
                        <button
                          onClick={() => removeFromCart(item.child_id)}
                          aria-label={`Remove ${item.first_name}`}
                          className="text-on-surface-variant hover:text-hope-orange transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}

                    <div className="flex items-center justify-between px-4 py-3 bg-cream/60">
                      <span className="font-body text-sm font-medium text-on-background">
                        Total{frequency === "monthly" ? "/month" : ""}
                      </span>
                      <span className="font-body text-base font-bold text-deep-navy">
                        ${subtotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 font-body text-xs text-on-surface-variant">
                    {frequency === "monthly"
                      ? "One monthly payment covers every child above — each gets their own sponsorship, billed at this total."
                      : "One payment covers every child above — each gets their own sponsorship, funded by this single gift."}
                  </p>
                  {amountError && (
                    <p className="mt-2 font-body text-xs text-red-600">{amountError}</p>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
                {USD_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleAmountClick(amount)}
                    className={`py-3 rounded-lg font-body font-semibold text-sm transition-all ${
                      selectedUSD === amount && !isOther
                        ? "bg-vibrant-blue text-white shadow-md"
                        : "bg-cream text-on-background hover:bg-soft-accent"
                    }`}
                  >
                    {formatCurrency(amount * currencyRate, currency)}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setIsOther(true);
                    setResult(null);
                  }}
                  className={`py-3 rounded-lg font-body font-semibold text-sm transition-all ${
                    isOther
                      ? "bg-vibrant-blue text-white shadow-md"
                      : "bg-cream text-on-background hover:bg-soft-accent"
                  }`}
                >
                  Other
                </button>
              </div>

              {/* Other Amount Input */}
              {isOther && (
                <div className="mb-6">
                  <label htmlFor="customAmount" className="block text-sm font-medium text-on-background mb-2">
                    {cmsText("donate", "customLabel")}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-body">$</span>
                    <input
                      id="customAmount"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setResult(null);
                      }}
                      className={`${inputClasses} pl-8`}
                    />
                    {baseAmount > 0 && currency.code !== "USD" && (
                      <p className="mt-1 text-sm text-on-surface-variant font-body">
                        ≈ {formatCurrency(convertedAmount, currency)}
                      </p>
                    )}
                    {customAmount !== "" && amountError && (
                      <p className="mt-1 text-sm text-red-600 font-body">
                        {amountError}
                      </p>
                    )}
                  </div>
                </div>
              )}
                </>
              )}

              {/* Impact Description */}
              <div className="bg-cream rounded-xl p-6 mb-8">
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-vibrant-blue mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-body text-on-background">
                      {isCartCheckout ? (
                        <>
                          <span className="font-semibold">
                            {formatCurrency(convertedAmount, currency)}
                          </span>{" "}
                          {frequency === "monthly"
                            ? `covers sponsorship for ${cartCount} ${
                                cartCount === 1 ? "child" : "children"
                              } every month.`
                            : `covers sponsorship for ${cartCount} ${
                                cartCount === 1 ? "child" : "children"
                              }.`}
                        </>
                      ) : baseAmount > 0 ? (
                        <>
                          <span className="font-semibold">{formatCurrency(convertedAmount, currency)}</span> {impactText}
                        </>
                      ) : (
                        impactText
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="mt-6 p-4 bg-cream rounded-xl">
                <p className="text-sm font-body font-medium text-on-background mb-2">Accepted payment methods</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 rounded-full bg-white text-xs font-body font-medium text-on-background border border-soft-accent">
                    Card (Visa, Mastercard)
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-white text-xs font-body font-medium text-on-background border border-soft-accent">
                    M-Pesa
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-white text-xs font-body font-medium text-on-background border border-soft-accent">
                    Airtel Money
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-white text-xs font-body font-medium text-on-background border border-soft-accent">
                    {cmsText("donate", "bankTitle")}
                  </span>
                </div>
                {cmsText("donate", "bankDetails") && (
                  <p className="mt-3 text-sm font-body text-on-surface-variant">
                    {cmsText("donate", "bankDetails")}
                  </p>
                )}
              </div>

              {/* Security Notice */}
              <div className="flex items-center gap-2 mt-6 text-on-surface-variant">
                <Shield className="w-4 h-4" />
                <p className="text-sm font-body">Payments are securely processed via Paystack</p>
              </div>

              {/* Submit Button */}
              <Button
                className={`w-full mt-6 py-4 text-lg text-white ${
                  result?.type === "success" && !processing
                    ? "bg-green-600 hover:bg-green-600"
                    : "bg-lightblue hover:bg-vibrant-blue"
                }`}
                onClick={handlePay}
                disabled={processing || !isValidAmount || (result?.type === "success" && !processing)}
              >
                {processing ? (
                  "Processing..."
                ) : result?.type === "success" ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Payment Successful
                  </span>
                ) : isSponsorship ? (
                  isCartCheckout
                    ? `Sponsor ${cartCount} ${cartCount === 1 ? "Child" : "Children"} · ${formatCurrency(convertedAmount, currency)}`
                    : `Sponsor ${formatCurrency(convertedAmount, currency)}`
                ) : (
                  `Donate ${formatCurrency(convertedAmount, currency)}`
                )}
              </Button>
              {attemptedSubmit && hasFieldErrors && (
                <p className="mt-3 text-sm text-red-600 font-body text-center">
                  Please fill in all required fields above before donating.
                </p>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              {/* Where Your Money Goes */}
              <div className="bg-white rounded-2xl border border-soft-accent p-6">
                <h3 className="text-lg font-display font-bold text-navy mb-6">Where your money goes</h3>
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm font-body font-medium text-on-background">Program Services</span>
                      <span className="text-sm font-body font-semibold text-on-background">92%</span>
                    </div>
                    <div className="w-full h-2 bg-cream rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: "92%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm font-body font-medium text-on-background">Administration</span>
                      <span className="text-sm font-body font-semibold text-on-background">5%</span>
                    </div>
                    <div className="w-full h-2 bg-cream rounded-full overflow-hidden">
                      <div className="h-full bg-vibrant-blue rounded-full" style={{ width: "5%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm font-body font-medium text-on-background">Fundraising</span>
                      <span className="text-sm font-body font-semibold text-on-background">3%</span>
                    </div>
                    <div className="w-full h-2 bg-cream rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full" style={{ width: "3%" }} />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </Section>
    </PageTransition>
  );
}