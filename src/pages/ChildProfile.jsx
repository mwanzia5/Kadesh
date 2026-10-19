import { useState } from "react";
import {
  useParams,
  Link,
  useNavigate,
} from "react-router-dom";
import {
  Heart,
  MapPin,
  Calendar,
  ArrowLeft,
  Loader2,
  LogIn,
  Lock,
} from "lucide-react";

import PageTransition from "@/animations/PageTransition";
import SEO from "@/components/ui/SEO";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import OptimizedImage from "@/components/ui/OptimizedImage";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { useChild } from "@/hooks/useChildren";
import { useDonorAuth } from "@/context/DonorAuthContext";
import { useSponsorshipCart } from "@/context/SponsorshipCartContext";
import { cn } from "@/lib/utils";
import { useAnnualFunding } from "@/hooks/useAnnualFunding";
import { annualChildStatus, getSponsorshipOption } from "@/lib/sponsorship";
import {
  MonthlyAmountSelect,
  SponsorshipPlanSelect,
} from "@/components/cart/SponsorshipSelection";

function StatusBadge({ status }) {
  const styles = {
    available: "bg-green-100 text-green-700",
    sponsored: "bg-vibrant-blue/10 text-vibrant-blue",
    pending: "bg-hope-orange/10 text-hope-orange",
  };
  return (
    <span
      className={cn(
        "inline-block px-4 py-1.5 rounded-full font-body text-sm font-semibold capitalize",
        styles[status] || "bg-gray-100 text-gray-600",
      )}
    >
      {status}
    </span>
  );
}

export default function ChildProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useDonorAuth();
  const { addToCart, openCart } = useSponsorshipCart();
  const funding = useAnnualFunding();
  // Signed-out visitors only get the photo; full details need a sign-in.
  const locked = !user;
  const {
    data,
    isLoading: childLoading,
    error,
  } = useChild(id, { publicOnly: locked, enabled: !authLoading });
  const isLoading = authLoading || childLoading;

  const child = data?.data
    ? {
        ...data.data,
        sponsorship_status: annualChildStatus(data.data, funding.data?.[id]),
      }
    : null;

  // How the donor wants to support this child before adding to the cart.
  const [giveMode, setGiveMode] = useState("one-time");
  const [annualPlan, setAnnualPlan] = useState("education");
  const [monthlyAmount, setMonthlyAmount] = useState(25);

  if (isLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-vibrant-blue" />
        </div>
      </PageTransition>
    );
  }

  if (error || !child) {
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col items-center justify-center px-6">
          <p className="font-body text-body-lg text-on-surface-variant mb-6">
            Child profile not found.
          </p>
          <Button variant="primary" as={Link} to="/sponsor-a-child">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Sponsor a Child
          </Button>
        </div>
      </PageTransition>
    );
  }

  if (locked) {
    const redirect = encodeURIComponent(`/sponsor-a-child/${id}`);
    return (
      <PageTransition>
        <SEO title="Sponsor a Child" />
        <Section background="white" className="relative z-10 pt-5 pb-16 sm:pt-6 lg:pt-8">
          <Container>
            <Link
              to="/sponsor-a-child"
              className="mb-4 inline-flex items-center gap-2 font-body text-sm font-semibold text-deep-navy transition-colors hover:text-[#1e5bab] sm:mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sponsor a Child
            </Link>
            <div className="mx-auto grid max-w-4xl grid-cols-1 items-center gap-8 md:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-soft-accent/50 bg-white shadow-card">
                {child.photo_url ? (
                  <OptimizedImage
                    src={child.photo_url}
                    alt="Child waiting for a sponsor"
                    className="h-auto w-full"
                  />
                ) : (
                  <div className="flex aspect-[4/5] w-full items-center justify-center bg-gradient-to-br from-vibrant-blue/20 to-hope-orange/20">
                    <Heart className="h-16 w-16 text-vibrant-blue/30" />
                  </div>
                )}
              </div>
              <div>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#0b2d47] text-[#f0cd72]">
                  <Lock className="h-5 w-5" />
                </span>
                <h1 className="mt-5 font-display text-3xl font-bold text-deep-navy sm:text-4xl">
                  Sign in to view this child&apos;s profile
                </h1>
                <p className="mt-4 font-body text-base leading-7 text-on-surface-variant">
                  To protect the children in our care, their names, ages,
                  locations and stories are only visible to signed-in donors.
                  Sign in or create a free account to read this child&apos;s
                  story and become their sponsor.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Button variant="primary" as={Link} to={`/login?redirect=${redirect}`}>
                    <LogIn className="mr-2 h-5 w-5" />
                    Sign in
                  </Button>
                  <Link
                    to={`/signup?redirect=${redirect}`}
                    className="inline-flex items-center rounded-full border border-slate-300 px-6 py-3 font-body text-sm font-bold text-deep-navy transition hover:border-[#1e5bab] hover:text-[#1e5bab]"
                  >
                    Create a free account
                  </Link>
                </div>
              </div>
            </div>
          </Container>
        </Section>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <SEO title="Sponsor a Child" />
      {/* Profile */}
      <Section background="white" className="relative z-10 pt-5 pb-16 sm:pt-6 lg:pt-8">
        <Container>
          <Link
            to="/sponsor-a-child"
            className="mb-4 inline-flex items-center gap-2 font-body text-sm font-semibold text-deep-navy transition-colors hover:text-[#1e5bab] sm:mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sponsor a Child
          </Link>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Photo + quick info — sticks in view while the story scrolls */}
            <ScrollReveal direction="left" className="lg:col-span-5">
              <div className="lg:sticky lg:top-8">
                <div className="bg-white rounded-2xl overflow-hidden shadow-card border border-soft-accent/50">
                  <div className="overflow-hidden">
                    {child.photo_url ? (
                      <OptimizedImage
                        src={child.photo_url}
                        alt={child.first_name}
                        className="w-full h-auto"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-vibrant-blue/20 to-hope-orange/20 flex items-center justify-center">
                        <span className="font-display text-7xl font-bold text-vibrant-blue/30">
                          {child.first_name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h1 className="font-display text-headline-lg text-deep-navy">
                        {child.first_name}
                      </h1>
                      <StatusBadge status={child.sponsorship_status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mb-6">
                      <span className="inline-flex items-center gap-1.5 font-body text-body-md text-on-surface-variant">
                        <Calendar className="h-4 w-4" />
                        Age {child.age}
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-body text-body-md text-on-surface-variant">
                        <MapPin className="h-4 w-4" />
                        {child.location}
                      </span>
                      <span className="font-body text-body-md text-on-surface-variant capitalize">
                        {child.gender}
                      </span>
                    </div>

                    {child.sponsorship_status === "available" ? (
                      user ? (
                          <div className="space-y-4">
                            <div
                              role="group"
                              aria-label="How would you like to give?"
                              className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1"
                            >
                              {[
                                ["one-time", "One payment"],
                                ["monthly", "Monthly"],
                              ].map(([mode, label]) => (
                                <button
                                  key={mode}
                                  type="button"
                                  aria-pressed={giveMode === mode}
                                  onClick={() => setGiveMode(mode)}
                                  className={cn(
                                    "rounded-lg px-3 py-2 font-body text-sm font-semibold transition-colors",
                                    giveMode === mode
                                      ? "bg-white text-deep-navy shadow-sm"
                                      : "text-slate-600 hover:text-deep-navy",
                                  )}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                            {giveMode === "monthly" ? (
                              <MonthlyAmountSelect
                                name={`Monthly support for ${child.first_name}`}
                                value={monthlyAmount}
                                onChange={setMonthlyAmount}
                              />
                            ) : (
                              <SponsorshipPlanSelect
                                name={`Support for ${child.first_name}`}
                                value={annualPlan}
                                onChange={setAnnualPlan}
                              />
                            )}
                            <Button
                              size="lg"
                              className="w-full gap-2 rounded-xl bg-[#1e5bab] text-white shadow-[0_12px_28px_rgba(30,91,171,0.25)] hover:bg-[#174a8d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e5bab]/40 focus-visible:ring-offset-2"
                              onClick={() => {
                                if (giveMode === "monthly")
                                  addToCart(child, "monthly", monthlyAmount);
                                else addToCart(child, annualPlan);
                                openCart();
                              }}
                            >
                              <Heart className="h-5 w-5" aria-hidden="true" />
                              Sponsor This Child ·{" "}
                              {giveMode === "monthly"
                                ? `$${monthlyAmount}/month`
                                : `$${getSponsorshipOption(annualPlan)?.amount}`}
                            </Button>
                            <p className="font-body text-xs text-on-surface-variant text-center">
                              Each child can receive up to $300 per year. If{" "}
                              {child.first_name}&apos;s support for this year is
                              already complete, we&apos;ll ask you to choose
                              another child at checkout. All children in your
                              cart share one payment type (one payment or
                              monthly).
                            </p>
                          </div>
                      ) : (
                        <Button
                          variant="lightblue"
                          size="lg"
                          onClick={() =>
                            navigate(
                              `/donor-auth?mode=signup&redirect=/sponsor-a-child/${child.id}`,
                            )
                          }
                          className="w-full"
                        >
                          Sign Up or Log In to Sponsor
                          <LogIn className="ml-2 h-5 w-5" />
                        </Button>
                      )
                    ) : (
                      <div className="w-full py-3 text-center rounded-xl bg-gray-100 font-body text-sm font-medium text-on-surface-variant">
                        {child.sponsorship_status === "sponsored"
                          ? "This child is already sponsored"
                          : "Sponsorship pending"}
                      </div>
                    )}

                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Story / Bio — scrolls normally, aligned to the top of the sticky card */}
            <ScrollReveal direction="right" className="lg:col-span-7">
              <h2 className="font-display text-headline-lg text-deep-navy mb-6">
                {child.first_name}&rsquo;s Story
              </h2>

              {child.bio && (
                <div className="mb-8">
                  <h3 className="font-display text-headline-md text-deep-navy mb-3">
                    About {child.first_name}
                  </h3>
                  <p className="font-body text-body-lg text-on-surface-variant leading-relaxed whitespace-pre-line">
                    {child.bio}
                  </p>
                </div>
              )}

              {child.needs && (
                <div className="mb-8">
                  <h3 className="font-display text-headline-md text-deep-navy mb-3">
                    Needs &amp; How You Can Help
                  </h3>
                  <p className="font-body text-body-lg text-on-surface-variant leading-relaxed whitespace-pre-line">
                    {child.needs}
                  </p>
                </div>
              )}

              {!child.bio && !child.needs && (
                <p className="font-body text-body-lg text-on-surface-variant/60 italic">
                  This child&rsquo;s story is being prepared. Check back soon to
                  learn more about {child.first_name}.
                </p>
              )}

              <div className="mt-10 p-6 rounded-xl bg-surface border border-soft-accent/50">
                <h3 className="font-display text-headline-md text-deep-navy mb-3">
                  What Your Sponsorship Provides
                </h3>
                <ul className="space-y-3">
                  {[
                    "Education",
                    "School supplies (uniforms, books, supplies)",
                    "Meals",
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 font-body text-body-md text-on-surface-variant"
                    >
                      <Heart className="h-5 w-5 text-hope-orange shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          </div>
        </Container>
      </Section>
    </PageTransition>
  );
}
