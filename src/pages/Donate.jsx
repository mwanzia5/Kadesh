import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Shield, Award, Heart, Gift, Building2, Globe, ChevronDown } from "lucide-react";
import PageTransition from "@/animations/PageTransition";
import Section from "@/components/ui/Section";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import { useCreateDonation } from "@/hooks/useDonations";

const USD_AMOUNTS = [10, 25, 50, 100, 250, 500];

const currencies = [
  { code: "USD", symbol: "$", name: "US Dollar", rate: 1, country: "United States" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling", rate: 129, country: "Kenya" },
  { code: "UGX", symbol: "UGX", name: "Ugandan Shilling", rate: 3750, country: "Uganda" },
  { code: "CDF", symbol: "FC", name: "Congolese Franc", rate: 2550, country: "DR Congo" },
  { code: "TZS", symbol: "TSh", name: "Tanzanian Shilling", rate: 2500, country: "Tanzania" },
  { code: "INR", symbol: "₹", name: "Indian Rupee", rate: 83, country: "India" },
];

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
  const createDonation = useCreateDonation();

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

  const baseAmount = isOther ? Number(customAmount) || 0 : selectedUSD;
  const convertedAmount = Math.round(baseAmount * currency.rate);
  const impactText = impactMap[baseAmount] || "Every gift makes a difference";

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
  };

  const handlePay = () => {
    if (!baseAmount || baseAmount <= 0 || !donorEmail) return;

    setProcessing(true);

    const USD_TO_NGN = 1500;
    const amountInKobo = Math.round(baseAmount * USD_TO_NGN * 100);

    const handler = PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email: donorEmail,
      amount: amountInKobo,
      currency: "NGN",
      ref: `KHM-${Date.now()}`,
      metadata: {
        custom_fields: [
          { display_name: "Donor Name", variable_name: "donor_name", value: donorName },
          { display_name: "Frequency", variable_name: "frequency", value: frequency },
          { display_name: "Selected Currency", variable_name: "currency", value: currency.code },
          { display_name: "Converted Amount", variable_name: "converted_amount", value: convertedAmount },
          { display_name: "USD Equivalent", variable_name: "usd_equivalent", value: baseAmount },
          { display_name: "Location", variable_name: "location", value: donorLocation },
          { display_name: "Phone", variable_name: "phone", value: donorPhone },
        ],
      },
      onSuccess: async (transaction) => {
        try {
          await createDonation.mutateAsync({
            donor_name: donorName,
            donor_email: donorEmail,
            amount: baseAmount,
            currency: currency.code,
            converted_amount: convertedAmount,
            frequency,
            status: "completed",
            payment_reference: transaction.reference,
            location: donorLocation || null,
            phone: donorPhone || null,
          });
        } catch (dbErr) {
          console.error("Failed to save donation record:", dbErr);
        }
        setProcessing(false);
        alert(`Thank you for your donation! Reference: ${transaction.reference}`);
      },
      onClose: () => {
        setProcessing(false);
      },
    });

    handler.openIframe();
  };

  return (
    <PageTransition>
      <Section className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Choose your impact level"
            subtitle="Your generosity transforms lives across Africa"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-16">
            {/* Donation Form */}
            <div className="lg:col-span-8">
              {/* Donor Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div>
                  <label htmlFor="donorName" className="block text-sm font-medium text-on-background mb-2">
                    Your Name
                  </label>
                  <input
                    id="donorName"
                    type="text"
                    placeholder="John Doe"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label htmlFor="donorEmail" className="block text-sm font-medium text-on-background mb-2">
                    Email Address
                  </label>
                  <input
                    id="donorEmail"
                    type="email"
                    placeholder="john@example.com"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label htmlFor="donorLocation" className="block text-sm font-medium text-on-background mb-2">
                    Location
                  </label>
                  <input
                    id="donorLocation"
                    type="text"
                    placeholder="City, Country"
                    value={donorLocation}
                    onChange={(e) => setDonorLocation(e.target.value)}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label htmlFor="donorPhone" className="block text-sm font-medium text-on-background mb-2">
                    Phone Number
                  </label>
                  <input
                    id="donorPhone"
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={donorPhone}
                    onChange={(e) => setDonorPhone(e.target.value)}
                    className={inputClasses}
                  />
                </div>
              </div>

              {/* Frequency Toggle */}
              <div className="flex bg-cream rounded-lg p-1 max-w-xs mb-8">
                <button
                  onClick={() => setFrequency("monthly")}
                  className={`flex-1 py-2.5 rounded-md text-sm font-body font-medium transition-all ${
                    frequency === "monthly"
                      ? "bg-navy text-white shadow-sm"
                      : "text-on-surface-variant hover:text-on-background"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setFrequency("one-time")}
                  className={`flex-1 py-2.5 rounded-md text-sm font-body font-medium transition-all ${
                    frequency === "one-time"
                      ? "bg-navy text-white shadow-sm"
                      : "text-on-surface-variant hover:text-on-background"
                  }`}
                >
                  One-time
                </button>
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
                  onClick={() => setIsOther(true)}
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
                      min="1"
                      placeholder="0"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className={`${inputClasses} pl-8`}
                    />
                    {baseAmount > 0 && currency.code !== "USD" && (
                      <p className="mt-1 text-sm text-on-surface-variant font-body">
                        ≈ {formatCurrency(convertedAmount, currency)}
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
                className="w-full mt-6 bg-lightblue hover:bg-vibrant-blue text-white py-4 text-lg"
                onClick={handlePay}
                disabled={processing || baseAmount <= 0}
              >
                {processing ? "Processing..." : `Donate ${formatCurrency(convertedAmount, currency)}`}
              </Button>
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

              {/* Certified Transparency */}
              <div className="bg-cream rounded-2xl p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-navy text-white flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-display font-bold text-navy">Certified Transparency</p>
                  <p className="text-sm font-body text-on-surface-variant">Verified by independent auditors</p>
                </div>
              </div>

              {/* Other Ways to Give */}
              <div className="bg-white rounded-2xl border border-soft-accent p-6">
                <h3 className="text-lg font-display font-bold text-navy mb-4">Other Ways to Give</h3>
                <div className="space-y-4">
                  <Link to="/partners" className="flex items-center gap-3 group">
                    <div className="w-9 h-9 rounded-full bg-cream flex items-center justify-center flex-shrink-0 group-hover:bg-vibrant-blue group-hover:text-white transition-colors">
                      <Heart className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-body font-medium text-on-background group-hover:text-vibrant-blue transition-colors">
                      Sponsor a specific child
                    </span>
                  </Link>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-cream flex items-center justify-center flex-shrink-0">
                      <Gift className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-body font-medium text-on-background">Gift Catalog</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-cream flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-body font-medium text-on-background">Corporate matching &amp; partnerships</span>
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
