import { useState, useEffect, cloneElement } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Heart,
  CreditCard,
  LogOut,
  Loader2,
  XCircle,
  Save,
  Check,
  Pencil,
  AlertCircle,
  CheckCircle2,
  PauseCircle,
  Gift,
  Receipt,
} from "lucide-react";

import PageTransition from "@/animations/PageTransition";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import { useDonorAuth } from "@/context/DonorAuthContext";
import {
  useSponsorships,
  useCancelSponsorship,
  useDonorDonations,
} from "@/hooks/useSponsorships";
import { cn, getGravatarUrl } from "@/lib/utils";
import { monthlyGiftStatus, monthlySponsorshipStatus } from "@/lib/monthlyGiving";
import { validateProfile, profileHasChanges } from "@/lib/profileValidation";
import { KES_PER_USD, SPONSORSHIP_CHECKOUT } from "@/lib/sponsorship";
import { useSponsorshipCart } from "@/context/SponsorshipCartContext";

import { AnnualFundingNotice } from "@/components/cart/SponsorshipSelection";
import SponsorshipCard from "@/components/account/SponsorshipCard";

const STATUS_TABS = ["All", "Active", "Paused", "Cancelled"];

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
        styles[status] || "bg-gray-100 text-gray-500",
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

// Label, hint and error wrapper for the profile form. Styles the single
// input passed as its child and links it to the hint/error for screen readers.
function ProfileField({ id, label, required, optional, hint, error, children }) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`]
    .filter(Boolean)
    .join(" ");
  const input = children;
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 flex items-center gap-1 font-body text-sm font-semibold text-deep-navy"
      >
        {label}
        {required && (
          <span className="text-red-500" aria-hidden="true">
            *
          </span>
        )}
        {optional && (
          <span className="font-normal text-on-surface-variant">
            (optional)
          </span>
        )}
      </label>
      {cloneElement(input, {
          "aria-invalid": error ? true : undefined,
          "aria-describedby": describedBy || undefined,
          "aria-required": required || undefined,
          className: cn(
            "w-full rounded-xl border bg-white px-3.5 py-3 font-body text-sm text-deep-navy outline-none transition-colors placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-on-surface-variant",
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-100"
              : "border-slate-300 focus:border-vibrant-blue focus:ring-vibrant-blue/15",
          ),
      })}
      {hint && !error && (
        <p
          id={`${id}-hint`}
          className="mt-1.5 font-body text-xs text-on-surface-variant"
        >
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 flex items-center gap-1.5 font-body text-xs font-medium text-red-600"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

// Gift amounts are recorded in USD; Paystack charges them in KES.
function chargedLabel(donation) {
  const kes = Number(donation.converted_amount);
  if (donation.currency === "KES" && Number.isFinite(kes) && kes > 0)
    return `KSh ${kes.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (donation.currency === "KES") {
    const estimate = Number(donation.amount) * KES_PER_USD;
    return Number.isFinite(estimate)
      ? `KSh ${estimate.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
      : "KES";
  }
  return donation.currency || "USD";
}

export default function DonorDashboard() {
  const {
    user,
    profile,
    loading: authLoading,
    profileLoading,
    profileError,
    retryProfile,
    signOut,
    updateProfile,
  } = useDonorAuth();
  const [activeTab, setActiveTab] = useState("sponsorships");
  const [statusFilter, setStatusFilter] = useState("All");
  // Per-sponsorship plan choice shown on cancelled cards, so a donor can
  // reactivate as one-time or monthly. Defaults to the slot's original plan.
  const [reactivatePlans, setReactivatePlans] = useState({});

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    location: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileAttempted, setProfileAttempted] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState("");
  const [accountError, setAccountError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  // Must stay above the early returns below: React needs the same hooks on
  // every render, including the render right after signing out.
  const [notice, setNotice] = useState(null); // { type, text }

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
  const navigate = useNavigate();
  const { addToCart } = useSponsorshipCart();

  const { data: sponsorshipsData, isLoading: sponsorshipsLoading } =
    useSponsorships(user?.id);
  const { data: donationsData, isLoading: donationsLoading } =
    useDonorDonations(user?.id, user?.email);

  const sponsorships = sponsorshipsData?.data ?? [];
  const donations = donationsData?.data ?? [];
  const monthlyGift = monthlyGiftStatus(donations);
  const monthlySponsorship = monthlySponsorshipStatus(sponsorships);
  const formatMonthDate = (date) =>
    date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });

  const filteredSponsorships = sponsorships.filter((s) => {
    if (statusFilter === "All") return true;
    return s.status === statusFilter.toLowerCase();
  });

  const activeSponsorships = sponsorships.filter(
    (s) => s.status === "active",
  ).length;

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
    return <Navigate to="/login?redirect=%2Faccount" replace />;
  }

  const statusCounts = {
    All: sponsorships.length,
    Active: sponsorships.filter((s) => s.status === "active").length,
    Paused: sponsorships.filter((s) => s.status === "paused").length,
    Cancelled: sponsorships.filter((s) => s.status === "cancelled").length,
  };

  const handleCancelSponsorship = async (sponsorship) => {
    setNotice(null);
    try {
      await cancelSponsorship.mutateAsync(sponsorship.id);
      setNotice({
        type: "success",
        text: `${sponsorship.children?.first_name || "The"} sponsorship has been cancelled.`,
      });
      return true;
    } catch (err) {
      setNotice({
        type: "error",
        text:
          err?.message || "Could not cancel this sponsorship. Please try again.",
      });
      return false;
    }
  };

  // Reactivating a cancelled sponsorship always needs a new payment. The
  // child is added to the sponsorship cart with the chosen plan (one-time
  // Education fees $100, or $25/month) and the donor goes to the normal
  // secure checkout, where the plan/amount can still be changed. Checkout
  // re-checks the child's availability before taking payment, and the
  // sponsorship only becomes active once Paystack verifies the payment.
  const handleReactivateSponsorship = (sponsorship, plan) => {
    setNotice(null);
    const child = sponsorship.children;
    if (!child?.id) {
      setNotice({
        type: "error",
        text: "We couldn't find this child's profile. Please contact us.",
      });
      return;
    }
    if (child.sponsorship_status && child.sponsorship_status !== "available") {
      setNotice({
        type: "error",
        text: `${child.first_name || "This child"} is no longer available for sponsorship. Please choose another child.`,
      });
      return;
    }
    addToCart(child, plan === "monthly" ? "monthly" : "education");
    navigate(SPONSORSHIP_CHECKOUT);
  };

  // Monthly sponsorships are paid by hand each month: put every child that is
  // due into the cart at their monthly amount and open the secure checkout.
  const handlePayMonthlySponsorship = () => {
    if (!monthlySponsorship?.due) return;
    setNotice(null);
    monthlySponsorship.dueChildren.forEach(({ child, monthlyAmount }) => {
      if (child?.id) addToCart(child, "monthly", monthlyAmount);
    });
    navigate(SPONSORSHIP_CHECKOUT);
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setAccountError("");
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      setAccountError("We couldn't sign you out. Check your connection and try again.");
    } finally {
      setSigningOut(false);
    }
  };

  const profileCheck = validateProfile(form);
  const profileChanged = profileHasChanges(profileCheck.values, profile);
  const fieldError = (name) =>
    profileAttempted || form[name] !== (profile?.[name] || "")
      ? profileCheck.errors[name]
      : undefined;

  const resetProfileForm = () => {
    setForm({
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      phone: profile?.phone || "",
      location: profile?.location || "",
    });
    setProfileAttempted(false);
    setProfileSaveError("");
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileAttempted(true);
    setProfileSaveError("");
    if (!profileCheck.isValid) return;
    if (!profileChanged) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setSaved(false);
    setAccountError("");
    try {
      const { values } = profileCheck;
      await updateProfile({
        first_name: values.first_name,
        last_name: values.last_name,
        phone: values.phone || null,
        location: values.location || null,
      });
      setSaved(true);
      setEditing(false);
      setProfileAttempted(false);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setProfileSaveError(
        "Your profile wasn't saved. Please check your connection and try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition>
      {/* Hero */}
      <section className="relative overflow-hidden bg-deep-navy">
        <div className="absolute inset-0 bg-gradient-to-br from-deep-navy via-[#12366d] to-[#1e5bab]" />
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/[0.07]" />
        <div className="absolute -bottom-32 left-[10%] h-72 w-72 rounded-full bg-hope-orange/10 blur-3xl" />
        <Container className="relative z-10">
          <div className="flex flex-col gap-6 pb-20 pt-12 sm:flex-row sm:items-center sm:justify-between sm:pt-14">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/15 ring-1 ring-white/20 sm:h-20 sm:w-20">
                <span className="font-display text-2xl font-bold text-white sm:text-3xl">
                  {(profile?.first_name || user?.email || "D")
                    .charAt(0)
                    .toUpperCase()}
                </span>
                {user?.email && (
                  <img
                    src={getGravatarUrl(user.email, 160, "404")}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.hidden = true;
                    }}
                  />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-[#f0cd72]">
                  My account
                </p>
                <h1 className="mt-1 font-display text-3xl font-bold text-white sm:text-4xl">
                  Welcome back, {profile?.first_name || "friend"}
                </h1>
                <p className="mt-1 truncate font-body text-sm text-white/70">
                  {profile?.email || user?.email}
                  {profile?.created_at
                    ? ` · Member since ${formatDate(profile.created_at)}`
                    : ""}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/sponsor-a-child"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1e5bab] px-4 py-2.5 font-body text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#174a8d]"
              >
                <Heart className="h-4 w-4" aria-hidden="true" />
                Sponsor a child
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 font-body text-sm font-semibold text-white transition-colors hover:bg-white/20 disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </div>
        </Container>
      </section>

      <Section background="white" className="relative z-10 -mt-12 pb-20 pt-0">
        <Container>
          {(accountError || profileError) && (
            <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 font-body text-sm text-red-800">
              <p>{accountError || profileError}</p>
              {profileError && <button type="button" onClick={retryProfile} disabled={profileLoading} className="mt-2 font-semibold underline disabled:opacity-50">{profileLoading ? "Loading profile…" : "Retry loading profile"}</button>}
            </div>
          )}

          {/* Summary */}
          <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              {
                label: "Active",
                value: statusCounts.Active,
                icon: CheckCircle2,
                tone: "text-emerald-600 bg-emerald-50",
                tab: "Active",
              },
              {
                label: "Paused",
                value: statusCounts.Paused,
                icon: PauseCircle,
                tone: "text-amber-600 bg-amber-50",
                tab: "Paused",
              },
              {
                label: "Cancelled",
                value: statusCounts.Cancelled,
                icon: XCircle,
                tone: "text-slate-500 bg-slate-100",
                tab: "Cancelled",
              },
            ].map(({ label, value, icon: Icon, tone, tab }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setActiveTab("sponsorships");
                  setStatusFilter(tab);
                }}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-[0_16px_40px_-34px_rgba(15,38,82,0.6)] transition-colors hover:border-vibrant-blue/40 sm:p-5"
              >
                <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", tone)}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-display text-2xl font-bold leading-none text-deep-navy">
                    {value}
                  </span>
                  <span className="mt-1 block font-body text-xs font-medium text-on-surface-variant sm:text-sm">
                    {label} sponsorships
                  </span>
                </span>
              </button>
            ))}
          </div>

          {/* Monthly sponsorship reminder (paid by hand each month) */}
          {monthlySponsorship && (
            <div
              className={cn(
                "mb-6 flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between",
                monthlySponsorship.overdue
                  ? "border-red-200 bg-red-50"
                  : monthlySponsorship.due
                    ? "border-amber-200 bg-amber-50"
                    : "border-slate-200/80 bg-white",
              )}
            >
              <div className="flex items-start gap-3">
                <Heart
                  className={cn(
                    "mt-0.5 h-5 w-5 shrink-0",
                    monthlySponsorship.overdue
                      ? "text-red-700"
                      : monthlySponsorship.due
                        ? "text-amber-700"
                        : "text-vibrant-blue",
                  )}
                  aria-hidden="true"
                />
                <div>
                  <p className="font-body text-sm font-semibold text-deep-navy">
                    {monthlySponsorship.overdue
                      ? "Your monthly sponsorship payment is overdue"
                      : monthlySponsorship.due
                      ? "Your monthly sponsorship is due"
                      : "This month's sponsorship is paid — thank you"}
                  </p>
                  <p className="mt-1 font-body text-sm text-on-surface-variant">
                    {monthlySponsorship.due
                      ? `${monthlySponsorship.dueChildren
                          .map(
                            (c) =>
                              `${c.child?.first_name || "Your child"} ($${c.monthlyAmount}/month${
                                c.monthsBehind > 1
                                  ? `, ${c.monthsBehind} months unpaid`
                                  : ""
                              })`,
                          )
                          .join(", ")}. Monthly sponsorships are not charged automatically, so please pay this month's support.`
                      : `Your next monthly payment is due from ${formatMonthDate(monthlySponsorship.nextDue)}.`}
                  </p>
                </div>
              </div>
              {monthlySponsorship.due && (
                <Button
                  variant="primary"
                  onClick={handlePayMonthlySponsorship}
                  className="shrink-0"
                >
                  Pay ${monthlySponsorship.dueTotal.toLocaleString()} for this month
                </Button>
              )}
            </div>
          )}

          {/* Monthly gift reminder (monthly gifts are paid by hand each month) */}
          {monthlyGift && (
            <div
              className={cn(
                "mb-10 flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between",
                monthlyGift.due
                  ? "border-amber-200 bg-amber-50"
                  : "border-slate-200/80 bg-white",
              )}
            >
              <div className="flex items-start gap-3">
                <Calendar
                  className={cn(
                    "mt-0.5 h-5 w-5 shrink-0",
                    monthlyGift.due ? "text-amber-700" : "text-vibrant-blue",
                  )}
                />
                <div>
                  <p className="font-body text-sm font-semibold text-deep-navy">
                    {monthlyGift.due
                      ? "Your monthly gift is due"
                      : "This month's gift is complete — thank you"}
                  </p>
                  <p className="mt-1 font-body text-sm text-on-surface-variant">
                    Last monthly gift: $
                    {monthlyGift.lastAmount.toLocaleString()} on{" "}
                    {formatMonthDate(monthlyGift.lastDate)}.{" "}
                    {monthlyGift.due
                      ? "Monthly gifts are not charged automatically, so give again whenever you are ready."
                      : `Your next gift is due from ${formatMonthDate(monthlyGift.nextDue)}.`}
                  </p>
                </div>
              </div>
              {monthlyGift.due && (
                <Button
                  variant="primary"
                  as={Link}
                  to={`/donate?frequency=monthly&amount=${encodeURIComponent(monthlyGift.lastAmount)}`}
                  className="shrink-0"
                >
                  Give ${monthlyGift.lastAmount.toLocaleString()} this month
                </Button>
              )}
            </div>
          )}

          {/* Main navigation */}
          <div
            role="tablist"
            aria-label="Account sections"
            className="mb-8 flex max-w-xl rounded-2xl border border-slate-200 bg-slate-50 p-1.5"
          >
            {[
              ["sponsorships", "Sponsorships", Heart],
              ["payments", "Payments", CreditCard],
              ["profile", "Profile", User],
            ].map(([tab, label, Icon]) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2 py-2.5 font-body text-[13px] font-semibold transition-all sm:gap-2 sm:px-3 sm:text-sm",
                  activeTab === tab
                    ? "bg-white text-deep-navy shadow-sm"
                    : "text-on-surface-variant hover:text-deep-navy",
                )}
              >
                <Icon className="hidden h-4 w-4 sm:block" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>

          {notice && (
            <div
              role={notice.type === "error" ? "alert" : "status"}
              className={cn(
                "mb-6 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 font-body text-sm",
                notice.type === "error"
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800",
              )}
            >
              <span className="flex items-start gap-2">
                {notice.type === "error" ? (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                )}
                {notice.text}
              </span>
              <button
                type="button"
                onClick={() => setNotice(null)}
                aria-label="Dismiss message"
                className="shrink-0 opacity-70 hover:opacity-100"
              >
                <XCircle className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}

          <AnnualFundingNotice />

          {/* Sponsorships Tab */}
          {activeTab === "sponsorships" && (
            <div>
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="font-display text-2xl font-bold text-deep-navy sm:text-3xl">
                    My sponsorships
                  </h2>
                  <p className="mt-1 font-body text-sm text-on-surface-variant">
                    Every child you support, with their status and payments.
                  </p>
                </div>
                <div
                  role="group"
                  aria-label="Filter by status"
                  className="flex w-full flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 sm:w-fit"
                >
                  {STATUS_TABS.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      aria-pressed={statusFilter === tab}
                      onClick={() => setStatusFilter(tab)}
                      className={cn(
                        "flex-1 rounded-lg px-3 py-2 font-body text-xs font-semibold transition-all sm:flex-none sm:text-sm",
                        statusFilter === tab
                          ? "bg-white text-deep-navy shadow-sm"
                          : "text-on-surface-variant hover:text-deep-navy",
                      )}
                    >
                      {tab}{" "}
                      <span className="text-on-surface-variant">
                        ({statusCounts[tab]})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {sponsorshipsLoading ? (
                <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/60 py-24">
                  <Loader2 className="h-7 w-7 animate-spin text-vibrant-blue" />
                </div>
              ) : filteredSponsorships.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-16 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                    <Heart className="h-7 w-7 text-[#1e5bab]" aria-hidden="true" />
                  </div>
                  <p className="font-display text-xl font-bold text-deep-navy">
                    {statusFilter === "All"
                      ? "You haven't sponsored a child yet"
                      : `No ${statusFilter.toLowerCase()} sponsorships`}
                  </p>
                  <p className="mx-auto mt-2 max-w-md font-body text-sm text-on-surface-variant">
                    {statusFilter === "All"
                      ? "Sponsor a child from $100, or $25 a month. After payment, they'll appear here."
                      : "Try another filter to see your other sponsorships."}
                  </p>
                  {statusFilter === "All" ? (
                    <Link
                      to="/sponsor-a-child"
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1e5bab] px-5 py-2.5 font-body text-sm font-semibold text-white hover:bg-[#174a8d]"
                    >
                      <Heart className="h-4 w-4" aria-hidden="true" />
                      Browse children
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setStatusFilter("All")}
                      className="mt-5 inline-flex items-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-body text-sm font-semibold text-deep-navy hover:bg-slate-50"
                    >
                      Show all sponsorships
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  {filteredSponsorships.map((sponsorship) => (
                    <SponsorshipCard
                      key={sponsorship.id}
                      sponsorship={sponsorship}
                      currentUserId={user?.id}
                      onCancel={handleCancelSponsorship}
                      cancelling={
                        cancelSponsorship.isPending &&
                        cancelSponsorship.variables === sponsorship.id
                      }
                      onReactivate={handleReactivateSponsorship}
                      reactivatePlan={
                        reactivatePlans[sponsorship.id] ??
                        (sponsorship.monthly_amount ? "monthly" : "one-time")
                      }
                      onReactivatePlanChange={(plan) =>
                        setReactivatePlans((prev) => ({
                          ...prev,
                          [sponsorship.id]: plan,
                        }))
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === "payments" && (
            <div>
              <div className="mb-6">
                <h2 className="font-display text-2xl font-bold text-deep-navy sm:text-3xl">
                  Payment history
                </h2>
                <p className="mt-1 break-words font-body text-sm text-on-surface-variant">
                  Donations and sponsorships made with {user?.email}.
                </p>
              </div>
              {donationsLoading ? (
                <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/60 py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-vibrant-blue" />
                </div>
              ) : donations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-16 text-center">
                  <Receipt className="mx-auto mb-3 h-10 w-10 text-slate-300" aria-hidden="true" />
                  <p className="font-display text-xl font-bold text-deep-navy">
                    No payments yet
                  </p>
                  <Link
                    to="/donate"
                    className="mt-5 inline-flex items-center rounded-xl bg-vibrant-blue px-5 py-2.5 font-body text-sm font-semibold text-white hover:bg-vibrant-blue/90"
                  >
                    Make a donation
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  {donations.map((donation) => {
                    const Icon = donation.is_sponsorship ? Heart : Gift;
                    return (
                      <li
                        key={donation.id}
                        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                              donation.is_sponsorship
                                ? "bg-blue-50 text-[#1e5bab]"
                                : "bg-blue-50 text-vibrant-blue",
                            )}
                          >
                            <Icon className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <div className="min-w-0">
                            <p className="font-body text-sm font-semibold text-deep-navy">
                              {donation.is_sponsorship ? "Child sponsorship" : "Donation"}
                              <span className="font-normal text-on-surface-variant">
                                {" · "}
                                {donation.frequency === "monthly" ? "Monthly" : "One-time"}
                              </span>
                            </p>
                            <p className="truncate font-body text-xs text-on-surface-variant">
                              {formatDate(donation.created_at)}
                              {donation.payment_reference
                                ? ` · Ref ${donation.payment_reference}`
                                : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-4 sm:justify-end">
                          <div className="text-left sm:text-right">
                            <p className="font-body text-base font-bold text-deep-navy">
                              ${Number(donation.amount).toLocaleString()}
                            </p>
                            <p className="font-body text-xs text-on-surface-variant">
                              Charged {chargedLabel(donation)}
                            </p>
                          </div>
                          <DonationStatusBadge status={donation.status} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="max-w-2xl"
            >
              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_20px_60px_-48px_rgba(15,38,82,0.45)]">
                {/* Header */}
                <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/70 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-deep-navy ring-4 ring-white shadow-sm">
                      <span className="font-display text-2xl font-bold text-white">
                        {(profile?.first_name || user?.email || "D")
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                      {user?.email && (
                        <img
                          src={getGravatarUrl(user.email, 128, "404")}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.hidden = true;
                          }}
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display text-2xl font-bold text-deep-navy">
                        Profile information
                      </h3>
                      <p className="truncate font-body text-sm text-on-surface-variant">
                        {[profile?.first_name, profile?.last_name]
                          .filter(Boolean)
                          .join(" ") || "Your details"}{" "}
                        · {profile?.email || user?.email}
                      </p>
                    </div>
                  </div>
                  {!editing && (
                    <button
                      type="button"
                      onClick={() => {
                        resetProfileForm();
                        setEditing(true);
                      }}
                      disabled={profileLoading || !profile}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-body text-sm font-semibold text-deep-navy transition-colors hover:border-vibrant-blue hover:text-vibrant-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vibrant-blue/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      Edit profile
                    </button>
                  )}
                </div>

                <div className="p-6 sm:p-7">
                  {saved && !editing && (
                    <p
                      role="status"
                      className="mb-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 font-body text-sm text-green-800"
                    >
                      <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                      Your profile has been updated.
                    </p>
                  )}

                  {editing ? (
                    <form
                      onSubmit={handleSaveProfile}
                      noValidate
                      className="space-y-5"
                    >
                      {profileSaveError && (
                        <p
                          role="alert"
                          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-body text-sm text-red-700"
                        >
                          <AlertCircle
                            className="mt-0.5 h-4 w-4 shrink-0"
                            aria-hidden="true"
                          />
                          {profileSaveError}
                        </p>
                      )}

                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <ProfileField
                          id="profile-first-name"
                          label="First name"
                          required
                          error={fieldError("first_name")}
                        >
                          <input
                            id="profile-first-name"
                            type="text"
                            autoComplete="given-name"
                            maxLength={50}
                            value={form.first_name}
                            onChange={(e) =>
                              setForm({ ...form, first_name: e.target.value })
                            }
                          />
                        </ProfileField>
                        <ProfileField
                          id="profile-last-name"
                          label="Last name"
                          required
                          error={fieldError("last_name")}
                        >
                          <input
                            id="profile-last-name"
                            type="text"
                            autoComplete="family-name"
                            maxLength={50}
                            value={form.last_name}
                            onChange={(e) =>
                              setForm({ ...form, last_name: e.target.value })
                            }
                          />
                        </ProfileField>
                      </div>

                      <ProfileField
                        id="profile-email"
                        label="Email"
                        hint="Your sign-in email can't be changed here."
                      >
                        <input
                          id="profile-email"
                          type="email"
                          value={profile?.email || user?.email || ""}
                          disabled
                        />
                      </ProfileField>

                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <ProfileField
                          id="profile-phone"
                          label="Phone"
                          optional
                          hint="Include your country code, e.g. +256."
                          error={fieldError("phone")}
                        >
                          <input
                            id="profile-phone"
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            maxLength={20}
                            placeholder="+256 700 123 456"
                            value={form.phone}
                            onChange={(e) =>
                              setForm({ ...form, phone: e.target.value })
                            }
                          />
                        </ProfileField>
                        <ProfileField
                          id="profile-location"
                          label="Location"
                          optional
                          error={fieldError("location")}
                        >
                          <input
                            id="profile-location"
                            type="text"
                            autoComplete="address-level2"
                            maxLength={100}
                            placeholder="City, Country"
                            value={form.location}
                            onChange={(e) =>
                              setForm({ ...form, location: e.target.value })
                            }
                          />
                        </ProfileField>
                      </div>

                      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            resetProfileForm();
                            setEditing(false);
                          }}
                          disabled={saving}
                          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-body text-sm font-semibold text-deep-navy transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={
                            saving ||
                            profileLoading ||
                            !profile ||
                            !profileChanged
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-vibrant-blue px-5 py-2.5 font-body text-sm font-semibold text-white shadow-sm transition-colors hover:bg-vibrant-blue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vibrant-blue/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {saving ? (
                            <Loader2
                              className="h-4 w-4 animate-spin"
                              aria-hidden="true"
                            />
                          ) : (
                            <Save className="h-4 w-4" aria-hidden="true" />
                          )}
                          {saving ? "Saving…" : "Save changes"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {[
                        {
                          icon: User,
                          label: "Name",
                          value: [profile?.first_name, profile?.last_name]
                            .filter(Boolean)
                            .join(" "),
                        },
                        {
                          icon: Mail,
                          label: "Email",
                          value: profile?.email || user?.email,
                        },
                        { icon: Phone, label: "Phone", value: profile?.phone },
                        {
                          icon: MapPin,
                          label: "Location",
                          value: profile?.location,
                        },
                        {
                          icon: Calendar,
                          label: "Member since",
                          value: profile?.created_at
                            ? formatDate(profile.created_at)
                            : "",
                        },
                      ].map(({ icon: Icon, label, value }) => (
                        <div
                          key={label}
                          className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5"
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-vibrant-blue/10">
                            <Icon
                              className="h-5 w-5 text-vibrant-blue"
                              aria-hidden="true"
                            />
                          </span>
                          <div className="min-w-0">
                            <dt className="font-body text-xs text-on-surface-variant">
                              {label}
                            </dt>
                            <dd
                              className={cn(
                                "truncate font-body text-sm font-medium",
                                value
                                  ? "text-deep-navy"
                                  : "text-on-surface-variant/70",
                              )}
                            >
                              {value || "Not added yet"}
                            </dd>
                          </div>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </Container>
      </Section>
    </PageTransition>
  );
}
