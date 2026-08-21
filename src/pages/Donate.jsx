import { useState, useEffect } from "react";
import { useSearchParams, useLocation, useNavigate, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Shield, Heart, Globe, ChevronDown, CheckCircle2, XCircle, UserPlus, Loader2 } from "lucide-react";
import PageTransition from "@/animations/PageTransition";
import Section from "@/components/ui/Section";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import { useDonorAuth } from "@/context/DonorAuthContext";
import supabase from "@/supabase/client";

const USD_AMOUNTS = [10, 25, 50, 100, 250, 500];

const currencies = [
  { code: "USD", symbol: "$", name: "US Dollar", rate: 1, country: "United States" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling", rate: 129, country: "Kenya" },
  { code: "UGX", symbol: "UGX", name: "Ugandan Shilling", rate: 3750, country: "Uganda" },
  { code: "CDF", symbol: "FC", name: "Congolese Franc", rate: 2550, country: "DR Congo" },
  { code: "TZS", symbol: "TSh", name: "Tanzanian Shilling", rate: 2500, country: "Tanzania" },
  { code: "INR", symbol: "₹", name: "Indian Rupee", rate: 83, country: "India" },
];

// Paystack merchant account is configured for KES only. The currency picker
// above is display-only — whatever the donor selects there just changes what
// they *see* (amount buttons, impact text). The actual charge sent to
// Paystack always converts through this rate, regardless of currency.code.
const KES_RATE = currencies.find((c) => c.code === "KES").rate;

const impactMap = {
  10: "Provides a meal for a child for one day",
  25: "Supplies basic school materials for a student",
  50: "Feeds a family of four for one week",
  100: "Covers medical supplies for a clinic visit",
  250: "Funds a clean water installation for a village",
  500: "Sponsors a child's education for one year",
};

const inputClasses =
  "w-full px-4 py-3 rounded-lg border border-soft-accent bg-white font-body text-on-background placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-vibrant-blue/50 focus:border-vibrant-blue transition-all";

function formatCurrency(amount, currency) {
  return `${currency.symbol}${Math.round(amount).toLocaleString()}`;
}

export default function Donate() {
  const { user, profile, loading: authLoading } = useDonorAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const sponsorshipChildId = searchParams.get("child_id");
  const sponsorshipChildName = searchParams.get("child_name");
  const isSponsorship = searchParams.get("purpose") === "sponsorship";

  const [frequency, setFrequency] = useState("one-time");
  const [selectedUSD, setSelectedUSD] = useState(50);
  const [customAmount, setCustomAmount] = useState("");
  const [isOther, setIsOther] = useState(false);
  const [currency, setCurrency] = useState(currencies[0]);
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

  const baseAmount = isOther ? Number(customAmount) || 0 : selectedUSD;
  const isValidAmount = baseAmount > 0;
  const convertedAmount = Math.round(baseAmount * currency.rate);
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
  // confirmation and note their reference.
  const scheduleReload = () => {
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

    // Always bill in KES regardless of whichever display currency the donor
    // picked in the selector above — that picker is dummy/display-only.
    const amountInKES = Math.round(baseAmount * KES_RATE);
    const amountInKESSubunit = amountInKES * 100; // Paystack expects subunits

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
        display_currency: currency.code,
        display_amount: convertedAmount,
        usd_equivalent: baseAmount,
        charged_currency: "KES",
        charged_amount: amountInKES,
        location: donorLocation,
        phone: donorPhone,
        // Sponsorship intent travels with the transaction itself, so it's
        // recoverable from Paystack's own records (via verify or webhook)
        // even if the donor's browser never calls back successfully.
        is_sponsorship: isSponsorship && !!sponsorshipChildId && !!user?.id,
        child_id: isSponsorship ? sponsorshipChildId || null : null,
        monthly_amount:
          isSponsorship && frequency === "monthly" ? baseAmount : null,
      },
      onSuccess: async (transaction) => {
        sawSuccess = true;
        // Paystack has already confirmed the charge at this point — flip the
        // button to success immediately instead of holding it in
        // "Processing..." while the server verifies (mobile money prompts can
        // make that wait feel like a hang).
        setProcessing(false);
        setResult({
          type: "success",
          message: `Thank you for your donation! Reference: ${transaction.reference}. This page will refresh automatically…`,
        });
        scheduleReload();

        // Then confirm + record server-side in the background.
        try {
          await confirmPayment(transaction.reference);

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
        } catch (err) {
          console.error("Payment verification failed:", err);
          // The charge went through on Paystack's side, so this stays a
          // success — just note that our records may lag behind (the webhook
          // still records it), keeping the reference visible for support.
          setResult({
            type: "success",
            message: `Thank you for your donation! Reference: ${transaction.reference}. Your payment was received — it may take a moment to appear in your history.`,
          });
        }
      },
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
            setResult({
              type: "success",
              message: `Thank you for your donation! Reference: ${reference}. This page will refresh automatically…`,
            });
            scheduleReload();
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
    });

    handler.openIframe();
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
        <Section className="pt-32 pb-20">
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
      <Section className="pt-32 pb-20">
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
            title={isSponsorship ? "Complete Your Sponsorship" : "Choose your impact level"}
            subtitle={isSponsorship ? "Your generosity transforms a child's life" : "Your generosity transforms lives across Africa"}
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

                {showCurrencyPicker && (
                  <div className="absolute z-30 mt-2 w-full sm:w-80 bg-white rounded-xl border border-soft-accent shadow-lg overflow-hidden">
                    {currencies.map((cur) => (
                      <button
                        key={cur.code}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrency(cur);
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
                            1 USD = {cur.symbol}{cur.rate.toLocaleString()}
                          </p>
                        </div>
                        <span className="text-xs text-on-surface-variant">{cur.country}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Amount Selection */}
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
                    {formatCurrency(amount * currency.rate, currency)}
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
                    Enter amount (USD)
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
                    {customAmount !== "" && !isValidAmount && (
                      <p className="mt-1 text-sm text-red-600 font-body">
                        Please enter an amount greater than zero.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Impact Description */}
              <div className="bg-cream rounded-xl p-6 mb-8">
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-vibrant-blue mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-body text-on-background">
                      {baseAmount > 0 ? (
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
                    Bank Transfer
                  </span>
                </div>
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
                  `Sponsor ${formatCurrency(convertedAmount, currency)}`
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