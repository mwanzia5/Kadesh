import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Heart,
  CreditCard,
  Coins,
  LogOut,
  Loader2,
  XCircle,
  RotateCcw,
  ChevronRight,
  Save,
  Check,
  AlertTriangle,
} from "lucide-react";

import PageTransition from "@/animations/PageTransition";
import { staggerContainer, slideUp } from "@/animations/variants";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import OptimizedImage from "@/components/ui/OptimizedImage";
import ScrollReveal from "@/components/ui/ScrollReveal";
import CreditShortfallNotice from "@/components/CreditShortfallNotice";
import { useDonorAuth } from "@/context/DonorAuthContext";
import {
  useSponsorships,
  useCancelSponsorship,
  useReactivateSponsorship,
  useDonorDonations,
  useSponsorshipCreditBalance,
} from "@/hooks/useSponsorships";
import { isInsufficientCreditError, isSponsorshipOverdue } from "@/services/sponsorships";
import { cn, getGravatarUrl } from "@/lib/utils";

const STATUS_TABS = ["All", "Active", "Cancelled"];

function SponsorshipStatusBadge({ status, cancelledBy, currentUserId }) {
  const styles = {
    active: "bg-green-100 text-green-700",
    paused: "bg-amber-100 text-amber-700",
    cancelled: "bg-gray-100 text-gray-500",
  };

  let label = status;
  if (status === "paused") {
    label = "Paused by admin";
  } else if (status === "cancelled" && cancelledBy && cancelledBy !== currentUserId) {
    label = "Cancelled by admin";
  }

  return (
    <span
      className={cn(
        "inline-block px-3 py-1 rounded-full font-body text-xs font-semibold capitalize",
        styles[status] || "bg-gray-100 text-gray-500"
      )}
    >
      {label}
    </span>
  );
}

// Names the child(ren) a donation funded, from the sponsorship_payments links.
// A cart payment funds several children, so join the names rather than picking
// the first — otherwise a donor sees one name for money that covered three.
function sponsoredChildNames(donation) {
  const links = donation.sponsorship_payments;
  if (!Array.isArray(links) || links.length === 0) return "";
  const names = links
    .map((link) => link?.sponsorships?.children?.first_name)
    .filter(Boolean);
  if (names.length === 0) return "";
  return names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

function DonationStatusBadge({ status }) {
  const styles = {
    completed: "bg-green-100 text-green-700",
    pending: "bg-hope-orange/10 text-hope-orange",
    failed: "bg-red-100 text-red-700",
    refunded: "bg-gray-100 text-gray-500",
  };
  return (
    <span
      className={cn(
        "inline-block px-2.5 py-0.5 rounded-full font-body text-xs font-semibold capitalize",
        styles[status] || "bg-gray-100 text-gray-500"
      )}
    >
      {status}
    </span>
  );
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function DonorDashboard() {
  const { user, profile, loading: authLoading, signOut, updateProfile } = useDonorAuth();
  const [activeTab, setActiveTab] = useState("sponsorships");
  const [statusFilter, setStatusFilter] = useState("All");
  // Per-sponsorship plan choice shown on cancelled cards, so a donor can
  // reactivate as one-time or monthly. Defaults to the slot's original plan.
  const [reactivatePlans, setReactivatePlans] = useState({});
  // Amount the donor is agreeing to on reactivation, per sponsorship id.
  // Switching a one-time sponsorship to monthly reuses the one-time figure as
  // the MONTHLY figure server-side unless we send an explicit amount, so the
  // donor types (or confirms) the number they actually intend to pay.
  const [reactivateAmounts, setReactivateAmounts] = useState({});
  // Per-sponsorship error text, e.g. "not enough credit" or a server message.
  const [reactivateErrors, setReactivateErrors] = useState({});

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "", location: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        phone: profile.phone || "",
        location: profile.location || "",
      });
    }
  }, [profile]);
  const cancelSponsorship = useCancelSponsorship();
  const reactivateSponsorship = useReactivateSponsorship();

  const { data: sponsorshipsData, isLoading: sponsorshipsLoading } =
    useSponsorships(user?.id);
  const { data: donationsData, isLoading: donationsLoading } =
    useDonorDonations(user?.id, user?.email);
  // Spendable sponsorship credit, owned by the server. Read the same number
  // everywhere so the card, the reactivation form and the server can't disagree.
  const { data: creditBalance = 0 } = useSponsorshipCreditBalance(user?.id);

  const sponsorships = sponsorshipsData?.data ?? [];
  const donations = donationsData?.data ?? [];

  const filteredSponsorships = sponsorships.filter((s) => {
    if (statusFilter === "All") return true;
    return s.status === statusFilter.toLowerCase();
  });

  const activeSponsorships = sponsorships.filter(
    (s) => s.status === "active"
  ).length;
  // Money from cancelled sponsorships, reusable to sponsor another child
  // without paying again. Cancelling a sponsorship credits the money back;
  // reactivating or sponsoring with credit draws it down. The server keeps the
  // ledger, so this is the authoritative balance rather than a sum computed
  // here (which used to drift when a reactivation overwrote a row's amount).
  const creditRemaining = Number(creditBalance) || 0;

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
    return <Navigate to="/donor-auth" replace />;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await updateProfile({
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone || null,
        location: form.location || null,
      });
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition>
      {/* Hero */}
      <section className="relative min-h-[40vh] flex items-end overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-deep-navy via-vibrant-blue/90 to-deep-navy">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-[10%] w-64 h-64 rounded-full bg-hope-orange/30 blur-3xl" />
            <div className="absolute bottom-10 right-[15%] w-80 h-80 rounded-full bg-vibrant-blue/30 blur-3xl" />
          </div>
        </div>

        <div className="relative z-10 w-full">
          <Container>
            <div className="pt-32 pb-16">
                <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-vibrant-blue flex items-center justify-center overflow-hidden shadow-lg shrink-0">
                    {getGravatarUrl(user?.email) ? (
                      <img
                        src={getGravatarUrl(user.email, 128)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-display text-xl font-bold">
                        {profile?.first_name?.charAt(0) || "D"}
                      </span>
                    )}
                  </div>
                  <div>
                    <h1 className="font-display text-3xl md:text-4xl text-white mb-2">
                      My Account
                    </h1>
                    <p className="font-body text-body-lg text-white/70">
                      Welcome back, {profile?.first_name || "Donor"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-body text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            </div>
          </Container>
        </div>
      </section>

      <Section background="white" className="pt-0 pb-16 -mt-12 relative z-10">
        <Container>
          {/* Stats cards */}
          <ScrollReveal>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
              <div className="bg-white rounded-xl border border-soft-accent/50 shadow-card p-6 text-center">
                <Heart className="h-8 w-8 text-hope-orange mx-auto mb-3" />
                <p className="font-display text-3xl font-bold text-deep-navy">
                  {activeSponsorships}
                </p>
                <p className="font-body text-sm text-on-surface-variant">
                  Active Sponsorships
                </p>
              </div>
              <div className="bg-white rounded-xl border border-soft-accent/50 shadow-card p-6 text-center">
                <Coins className="h-8 w-8 text-hope-orange mx-auto mb-3" />
                <p className="font-display text-3xl font-bold text-deep-navy">
                  ${creditRemaining.toLocaleString()}
                </p>
                <p className="font-body text-sm text-on-surface-variant">
                  Sponsorship Credit
                </p>
                <p className="font-body text-xs text-on-surface-variant/70 mt-0.5">
                  Available to cover a reactivation
                </p>
              </div>
              <div className="bg-white rounded-xl border border-soft-accent/50 shadow-card p-6 text-center">
                <Calendar className="h-8 w-8 text-vibrant-blue mx-auto mb-3" />
                <p className="font-display text-3xl font-bold text-deep-navy">
                  {donations.length}
                </p>
                <p className="font-body text-sm text-on-surface-variant">
                  Total Donations
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 max-w-xs mb-8">
            {["sponsorships", "payments", "profile"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 py-2.5 rounded-md font-body text-xs sm:text-sm font-medium transition-all capitalize whitespace-nowrap",
                  activeTab === tab
                    ? "bg-white text-deep-navy shadow-sm"
                    : "text-on-surface-variant hover:text-deep-navy"
                )}
              >
                {tab === "sponsorships" ? "Sponsorships" : tab === "payments" ? "Payments" : "Profile"}
              </button>
            ))}
          </div>

          {/* Sponsorships Tab */}
          {activeTab === "sponsorships" && (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {/* Status filter */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 max-w-md mb-6">
                {STATUS_TABS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      "px-4 py-1.5 rounded-md font-body text-xs font-medium transition-colors capitalize",
                      statusFilter === s
                        ? "bg-white text-deep-navy shadow-sm"
                        : "text-on-surface-variant hover:text-deep-navy"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {sponsorshipsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-vibrant-blue" />
                </div>
              ) : filteredSponsorships.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-soft-accent/50">
                  <Heart className="h-16 w-16 mx-auto text-on-surface-variant/30 mb-4" />
                  <p className="font-body text-body-lg text-on-surface-variant mb-2">
                    {statusFilter === "All"
                      ? "You haven't sponsored any children yet."
                      : `No ${statusFilter.toLowerCase()} sponsorships.`}
                  </p>
                  <Button
                    variant="primary"
                    as={Link}
                    to="/sponsor-a-child"
                    className="mt-4"
                  >
                    Browse Children to Sponsor
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSponsorships.map((sponsorship) => (
                    <motion.div
                      key={sponsorship.id}
                      variants={slideUp}
                      className="bg-white rounded-xl border border-soft-accent/50 shadow-card overflow-hidden"
                    >
                      <div className="flex flex-col sm:flex-row">
                        {/* Child photo */}
                        <div className="sm:w-40 overflow-hidden">
                          {sponsorship.children?.photo_url ? (
                            <OptimizedImage
                              src={sponsorship.children.photo_url}
                              alt={sponsorship.children.first_name}
                              className="w-full h-auto"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-vibrant-blue/15 to-hope-orange/15 flex items-center justify-center min-h-[12rem]">
                              <span className="font-display text-4xl font-bold text-vibrant-blue/30">
                                {sponsorship.children?.first_name?.charAt(0) || "?"}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 p-5">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <div className="min-w-0">
                              <h3 className="font-display text-headline-md text-deep-navy">
                                {sponsorship.children?.first_name || "Unknown Child"}
                              </h3>
                              <p className="font-body text-sm text-on-surface-variant">
                                {sponsorship.children?.age && `Age ${sponsorship.children.age}`}
                                {sponsorship.children?.age && sponsorship.children?.location && " · "}
                                {sponsorship.children?.location}
                              </p>
                            </div>
                            <SponsorshipStatusBadge
                              status={sponsorship.status}
                              cancelledBy={sponsorship.cancelled_by}
                              currentUserId={user?.id}
                            />
                          </div>

                          <div className="mt-4 text-sm font-body text-on-surface-variant">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4" />
                              Since {formatDate(sponsorship.start_date)}
                            </span>
                          </div>

                          {(sponsorship.amount ?? sponsorship.monthly_amount) && (
                            <p className="mt-1.5 flex items-center gap-1.5 font-body text-sm font-medium text-deep-navy">
                              <CreditCard className="h-4 w-4 text-on-surface-variant" />
                              Sponsored with{" "}
                              <span className="font-bold text-hope-orange">
                                $
                                {Number(
                                  sponsorship.amount ?? sponsorship.monthly_amount
                                ).toLocaleString()}
                              </span>
                              {sponsorship.monthly_amount ? "/mo" : ""}
                            </p>
                          )}

                          {sponsorship.reassigned_at && sponsorship.previous_child && (
                            <p className="mt-1 font-body text-xs text-vibrant-blue">
                              Reassigned from{" "}
                              {sponsorship.previous_child.first_name} on{" "}
                              {formatDate(sponsorship.reassigned_at)} (no extra
                              payment)
                            </p>
                          )}

                          {sponsorship.status === "paused" && (
                            <p className="mt-2 font-body text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                              Sponsorship paused by our team — your child stays
                              reserved for you. Contact us to resume.
                            </p>
                          )}

                          {/* Monthly billing period. The due date comes from the
                              server (next_payment_due) rather than being
                              recalculated in the browser, so what the donor is
                              told can never disagree with what the renewal
                              payment will actually do. The old version looped
                              from start_date in the browser, which drifted out
                              of step with the stored period. */}
                          {sponsorship.status === "active" &&
                            sponsorship.monthly_amount != null &&
                            (() => {
                              const overdue = isSponsorshipOverdue(sponsorship);
                              const due = sponsorship.next_payment_due
                                ? new Date(sponsorship.next_payment_due)
                                : null;

                              if (!due || Number.isNaN(due.getTime())) return null;

                              return (
                                <div
                                  role={overdue ? "alert" : undefined}
                                  className={`mt-2 rounded-lg border px-3 py-2 ${
                                    overdue
                                      ? "border-red-300 bg-red-50"
                                      : "border-vibrant-blue/20 bg-vibrant-blue/5"
                                  }`}
                                >
                                  <p
                                    className={`font-body text-xs font-medium ${
                                      overdue ? "text-red-800" : "text-vibrant-blue"
                                    }`}
                                  >
                                    {overdue ? (
                                      <span className="inline-flex items-center gap-1">
                                        <AlertTriangle className="h-3.5 w-3.5" />
                                        Payment overdue — due {formatDate(due)}
                                      </span>
                                    ) : (
                                      <>Next payment due {formatDate(due)}</>
                                    )}
                                  </p>
                                  {overdue && (
                                    <p className="mt-1 font-body text-xs text-red-700">
                                      Your monthly sponsorship of ${Number(sponsorship.monthly_amount).toLocaleString()} for{" "}
                                      {sponsorship.children?.first_name || "this child"}{" "}
                                      isn&apos;t covered for the next period.{" "}
                                      {/* Takes the donor to the donate page
                                          pre-filled to renew this exact
                                          sponsorship; paying there advances the
                                          period and re-activates the child. */}
                                      <Link
                                        to={`/donate?renew=${sponsorship.id}&child=${sponsorship.child_id}`}
                                        className="font-medium text-vibrant-blue underline underline-offset-2 hover:text-hope-orange"
                                      >
                                        Update sponsorship
                                      </Link>{" "}
                                      to keep this child supported.
                                    </p>
                                  )}
                                </div>
                              );
                            })()}

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 border-t border-gray-100 pt-3">
                            <Link
                              to={`/sponsor-a-child/${sponsorship.child_id}`}
                              className="inline-flex items-center gap-1 font-body text-sm font-medium text-vibrant-blue hover:underline"
                            >
                              View Profile
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                            {sponsorship.status === "active" && (
                              <button
                                onClick={() => {
                                  if (confirm("Cancel this sponsorship? The child will become available for others to sponsor.")) {
                                    cancelSponsorship.mutate(sponsorship.id);
                                  }
                                }}
                                className="inline-flex items-center gap-1 font-body text-sm font-medium text-on-surface-variant hover:text-hope-orange transition-colors"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Cancel
                              </button>
                            )}
                            {sponsorship.status === "cancelled" && (() => {
                              const plan =
                                reactivatePlans[sponsorship.id] ??
                                (sponsorship.monthly_amount
                                  ? "monthly"
                                  : "one-time");
                              // Default to the figure already on the slot for the
                              // chosen plan, so an unchanged reactivation needs
                              // no typing, but the donor can override it.
                              const defaultAmount =
                                plan === "monthly"
                                  ? (sponsorship.monthly_amount ??
                                     sponsorship.amount ??
                                     "")
                                  : (sponsorship.amount ??
                                     sponsorship.monthly_amount ??
                                     "");
                              const amount =
                                reactivateAmounts[sponsorship.id] ??
                                String(defaultAmount ?? "");
                              const requested = Number(amount);
                              const amountInvalid =
                                amount.trim() === "" ||
                                Number.isNaN(requested) ||
                                requested <= 0;
                              // The amount is charged against the donor's credit
                              // balance, so it can never exceed what's available.
                              // Caught here to give immediate feedback; the server
                              // enforces the same rule authoritatively.
                              const exceedsCredit =
                                !amountInvalid && requested > creditRemaining;
                              const error = reactivateErrors[sponsorship.id];

                              const setError = (text) =>
                                setReactivateErrors((prev) => ({
                                  ...prev,
                                  [sponsorship.id]: text,
                                }));

                              return (
                                <div className="w-full">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="inline-flex rounded-lg border border-soft-accent/60 overflow-hidden">
                                      {["one-time", "monthly"].map((p) => {
                                        const selected = plan === p;
                                        return (
                                          <button
                                            key={p}
                                            type="button"
                                            onClick={() => {
                                              setReactivatePlans((prev) => ({
                                                ...prev,
                                                [sponsorship.id]: p,
                                              }));
                                              setError(null);
                                            }}
                                            aria-pressed={selected}
                                            className={cn(
                                              "px-2.5 py-1 font-body text-xs font-medium transition-colors",
                                              selected
                                                ? "bg-vibrant-blue text-white"
                                                : "bg-white text-on-surface-variant hover:bg-vibrant-blue/5"
                                            )}
                                          >
                                            {p === "one-time" ? "One-time" : "Monthly"}
                                          </button>
                                        );
                                      })}
                                    </div>

                                    <label className="inline-flex items-center gap-1 text-xs text-on-surface-variant">
                                      <span className="sr-only">
                                        Sponsorship amount per {plan}
                                      </span>
                                      <span aria-hidden="true">$</span>
                                      <input
                                        type="number"
                                        inputMode="decimal"
                                        min="1"
                                        step="1"
                                        value={amount}
                                        onChange={(e) => {
                                          setReactivateAmounts((prev) => ({
                                            ...prev,
                                            [sponsorship.id]: e.target.value,
                                          }));
                                          setError(null);
                                        }}
                                        aria-label={`Sponsorship amount${
                                          plan === "monthly" ? " per month" : ""
                                        }`}
                                        aria-invalid={exceedsCredit}
                                        className={cn(
                                          "w-20 rounded-lg border px-2 py-1 font-body text-xs text-deep-navy focus:outline-none",
                                          exceedsCredit
                                            ? "border-amber-500 focus:border-amber-600"
                                            : "border-soft-accent/60 focus:border-vibrant-blue"
                                        )}
                                      />
                                      {plan === "monthly" ? (
                                        <span>/mo</span>
                                      ) : (
                                        <span className="sr-only">one-time</span>
                                      )}
                                    </label>

                                    <span className="text-xs text-on-surface-variant/80">
                                      of ${creditRemaining.toLocaleString()} credit
                                    </span>

                                    <button
                                      onClick={async () => {
                                        if (amountInvalid) {
                                          setError(
                                            "Enter an amount greater than zero to reactivate."
                                          );
                                          return;
                                        }
                                        if (exceedsCredit) return; // notice is showing
                                        const verb =
                                          plan === "monthly"
                                            ? "monthly"
                                            : "one-time";
                                        const suffix =
                                          plan === "monthly" ? " per month" : "";
                                        if (
                                          !confirm(
                                            `Reactivate this ${verb} sponsorship at $${requested.toLocaleString()}${suffix}?`
                                          )
                                        )
                                          return;
                                        try {
                                          await reactivateSponsorship.mutateAsync({
                                            id: sponsorship.id,
                                            plan,
                                            amount: requested,
                                          });
                                          setError(null);
                                        } catch (err) {
                                          setError(
                                            err?.message ||
                                              "Could not reactivate this sponsorship."
                                          );
                                        }
                                      }}
                                      disabled={
                                        reactivateSponsorship.isPending ||
                                        exceedsCredit
                                      }
                                      className="inline-flex items-center gap-1 font-body text-sm font-medium text-vibrant-blue hover:underline disabled:opacity-50 disabled:hover:no-underline"
                                    >
                                      {reactivateSponsorship.isPending ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <RotateCcw className="h-3.5 w-3.5" />
                                      )}
                                      Reactivate
                                    </button>
                                  </div>

                                  {exceedsCredit && (
                                    <CreditShortfallNotice
                                      available={creditRemaining}
                                      required={requested}
                                    />
                                  )}
                                  {!exceedsCredit && error && (
                                    <p
                                      role="alert"
                                      className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 font-body text-xs text-red-800"
                                    >
                                      {error}
                                      {isInsufficientCreditError({
                                        message: error,
                                      }) && (
                                        <>
                                          {" "}
                                          <Link
                                            to="/donate"
                                            className="font-medium text-vibrant-blue underline underline-offset-2"
                                          >
                                            add money on the donations page
                                          </Link>
                                        </>
                                      )}
                                    </p>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Payments Tab */}
          {activeTab === "payments" && (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {donationsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-vibrant-blue" />
                </div>
              ) : donations.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-soft-accent/50">
                  <CreditCard className="h-16 w-16 mx-auto text-on-surface-variant/30 mb-4" />
                  <p className="font-body text-body-lg text-on-surface-variant">
                    No donation history yet.
                  </p>
                  <Button
                    variant="primary"
                    as={Link}
                    to="/donate"
                    className="mt-4"
                  >
                    Make a Donation
                  </Button>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-soft-accent/50 overflow-hidden">
                  <div className="hidden sm:grid grid-cols-[1fr_100px_100px_120px_100px] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200">
                    <span className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                      Reference
                    </span>
                    <span className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                      Amount
                    </span>
                    <span className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                      Currency
                    </span>
                    <span className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                      Date
                    </span>
                    <span className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                      Status
                    </span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {donations.map((donation) => (
                      <div
                        key={donation.id}
                        className="px-6 py-4 sm:grid sm:grid-cols-[1fr_100px_100px_120px_100px] sm:gap-4 sm:items-center"
                      >
                        <div className="mb-2 sm:mb-0">
                          <p className="font-body text-sm font-medium text-deep-navy truncate">
                            {donation.is_sponsorship
                              ? `Child sponsorship${sponsoredChildNames(donation) ? ` — ${sponsoredChildNames(donation)}` : ""}`
                              : "General donation"}
                          </p>
                          <p className="font-body text-xs text-on-surface-variant truncate">
                            {donation.payment_reference || "—"}
                          </p>
                          <p className="font-body text-xs text-on-surface-variant sm:hidden">
                            {formatDate(donation.created_at)}
                          </p>
                        </div>
                        <span className="hidden sm:block font-body text-sm text-deep-navy font-medium">
                          ${Number(donation.amount).toLocaleString()}
                        </span>
                        <span className="hidden sm:block font-body text-sm text-on-surface-variant">
                          {donation.currency}
                        </span>
                        <span className="hidden sm:block font-body text-sm text-on-surface-variant">
                          {formatDate(donation.created_at)}
                        </span>
                        <span className="hidden sm:block">
                          <DonationStatusBadge status={donation.status} />
                        </span>
                        {/* Mobile */}
                        <div className="flex items-center gap-3 sm:hidden mt-1">
                          <span className="font-body text-sm font-medium text-deep-navy">
                            ${Number(donation.amount).toLocaleString()} {donation.currency}
                          </span>
                          <DonationStatusBadge status={donation.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="max-w-lg"
            >
              <div className="bg-white rounded-xl border border-soft-accent/50 shadow-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display text-headline-md text-deep-navy">
                    Profile Information
                  </h3>
                  {!editing && (
                    <button
                      onClick={() => setEditing(true)}
                      className="font-body text-sm font-medium text-vibrant-blue hover:underline"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {/* Gravatar preview */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                  <div className="w-14 h-14 rounded-full bg-vibrant-blue flex items-center justify-center overflow-hidden shrink-0">
                    {getGravatarUrl(user?.email) ? (
                      <img
                        src={getGravatarUrl(user.email, 112)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-display text-lg font-bold">
                        {profile?.first_name?.charAt(0) || "D"}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-body text-sm font-medium text-deep-navy">
                      {profile?.first_name} {profile?.last_name}
                    </p>
                    <p className="font-body text-xs text-on-surface-variant">
                      {profile?.email || user?.email}
                    </p>
                    <p className="font-body text-xs text-on-surface-variant mt-1">
                      Profile image from Gravatar
                    </p>
                  </div>
                </div>

                {editing ? (
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-body text-xs font-medium text-on-surface-variant mb-1.5">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={form.first_name}
                          onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                          required
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm text-deep-navy focus:outline-none focus:ring-2 focus:ring-vibrant-blue/30 focus:border-vibrant-blue transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block font-body text-xs font-medium text-on-surface-variant mb-1.5">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={form.last_name}
                          onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                          required
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm text-deep-navy focus:outline-none focus:ring-2 focus:ring-vibrant-blue/30 focus:border-vibrant-blue transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-body text-xs font-medium text-on-surface-variant mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        value={profile?.email || user?.email || ""}
                        disabled
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm text-on-surface-variant bg-gray-50 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block font-body text-xs font-medium text-on-surface-variant mb-1.5">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="Optional"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm text-deep-navy focus:outline-none focus:ring-2 focus:ring-vibrant-blue/30 focus:border-vibrant-blue transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block font-body text-xs font-medium text-on-surface-variant mb-1.5">
                        Location
                      </label>
                      <input
                        type="text"
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                        placeholder="Optional"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-sm text-deep-navy focus:outline-none focus:ring-2 focus:ring-vibrant-blue/30 focus:border-vibrant-blue transition-colors"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={saving}
                        className="inline-flex items-center gap-1.5"
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : saved ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
                      </Button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(false);
                          setForm({
                            first_name: profile.first_name || "",
                            last_name: profile.last_name || "",
                            phone: profile.phone || "",
                            location: profile.location || "",
                          });
                        }}
                        className="font-body text-sm text-on-surface-variant hover:text-deep-navy transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-vibrant-blue/10 flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-vibrant-blue" />
                      </div>
                      <div>
                        <p className="font-body text-xs text-on-surface-variant">Name</p>
                        <p className="font-body text-sm font-medium text-deep-navy">
                          {profile?.first_name} {profile?.last_name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-vibrant-blue/10 flex items-center justify-center shrink-0">
                        <Mail className="h-5 w-5 text-vibrant-blue" />
                      </div>
                      <div>
                        <p className="font-body text-xs text-on-surface-variant">Email</p>
                        <p className="font-body text-sm font-medium text-deep-navy">
                          {profile?.email || user?.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-vibrant-blue/10 flex items-center justify-center shrink-0">
                        <Phone className="h-5 w-5 text-vibrant-blue" />
                      </div>
                      <div>
                        <p className="font-body text-xs text-on-surface-variant">Phone</p>
                        <p className="font-body text-sm font-medium text-deep-navy">
                          {profile?.phone || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-vibrant-blue/10 flex items-center justify-center shrink-0">
                        <MapPin className="h-5 w-5 text-vibrant-blue" />
                      </div>
                      <div>
                        <p className="font-body text-xs text-on-surface-variant">Location</p>
                        <p className="font-body text-sm font-medium text-deep-navy">
                          {profile?.location || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-vibrant-blue/10 flex items-center justify-center shrink-0">
                        <Calendar className="h-5 w-5 text-vibrant-blue" />
                      </div>
                      <div>
                        <p className="font-body text-xs text-on-surface-variant">Member Since</p>
                        <p className="font-body text-sm font-medium text-deep-navy">
                          {profile?.created_at
                            ? formatDate(profile.created_at)
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </Container>
      </Section>
    </PageTransition>
  );
}
