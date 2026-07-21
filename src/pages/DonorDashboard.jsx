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
  LogOut,
  Loader2,
  Pause,
  XCircle,
  ChevronRight,
  Save,
  Check,
} from "lucide-react";

import PageTransition from "@/animations/PageTransition";
import { staggerContainer, slideUp } from "@/animations/variants";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import OptimizedImage from "@/components/ui/OptimizedImage";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { useDonorAuth } from "@/context/DonorAuthContext";
import {
  useSponsorships,
  useCancelSponsorship,
  useDonorDonations,
} from "@/hooks/useSponsorships";
import { cn, getGravatarUrl } from "@/lib/utils";

const STATUS_TABS = ["All", "Active", "Paused", "Cancelled"];

function SponsorshipStatusBadge({ status }) {
  const styles = {
    active: "bg-green-100 text-green-700",
    paused: "bg-hope-orange/10 text-hope-orange",
    cancelled: "bg-gray-100 text-gray-500",
  };
  return (
    <span
      className={cn(
        "inline-block px-3 py-1 rounded-full font-body text-xs font-semibold capitalize",
        styles[status] || "bg-gray-100 text-gray-500"
      )}
    >
      {status}
    </span>
  );
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

  const { data: sponsorshipsData, isLoading: sponsorshipsLoading } =
    useSponsorships(user?.id);
  const { data: donationsData, isLoading: donationsLoading } =
    useDonorDonations(user?.id);

  const sponsorships = sponsorshipsData?.data ?? [];
  const donations = donationsData?.data ?? [];

  const filteredSponsorships = sponsorships.filter((s) => {
    if (statusFilter === "All") return true;
    return s.status === statusFilter.toLowerCase();
  });

  const activeSponsorships = sponsorships.filter(
    (s) => s.status === "active"
  ).length;
  const totalDonated = donations
    .filter((d) => d.status === "completed")
    .reduce((sum, d) => sum + Number(d.amount), 0);

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
                <CreditCard className="h-8 w-8 text-vibrant-blue mx-auto mb-3" />
                <p className="font-display text-3xl font-bold text-deep-navy">
                  ${totalDonated.toLocaleString()}
                </p>
                <p className="font-body text-sm text-on-surface-variant">
                  Total Donated
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
                  "flex-1 py-2.5 rounded-md font-body text-sm font-medium transition-all capitalize",
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
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 mb-6 max-w-md">
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
                        <div className="sm:w-40 h-48 sm:h-auto overflow-hidden">
                          {sponsorship.children?.photo_url ? (
                            <OptimizedImage
                              src={sponsorship.children.photo_url}
                              alt={sponsorship.children.first_name}
                              className="w-full h-full object-cover"
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
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-display text-headline-md text-deep-navy">
                                {sponsorship.children?.first_name || "Unknown Child"}
                              </h3>
                              <p className="font-body text-sm text-on-surface-variant">
                                {sponsorship.children?.age && `Age ${sponsorship.children.age}`}
                                {sponsorship.children?.age && sponsorship.children?.location && " · "}
                                {sponsorship.children?.location}
                              </p>
                            </div>
                            <SponsorshipStatusBadge status={sponsorship.status} />
                          </div>

                          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm font-body text-on-surface-variant">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4" />
                              Since {formatDate(sponsorship.start_date)}
                            </span>
                            {sponsorship.monthly_amount && (
                              <span className="flex items-center gap-1.5">
                                <CreditCard className="h-4 w-4" />
                                ${sponsorship.monthly_amount}/mo
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 mt-4">
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
                                  if (confirm("Pause this sponsorship?")) {
                                    cancelSponsorship.mutate(sponsorship.id);
                                  }
                                }}
                                className="inline-flex items-center gap-1 font-body text-sm font-medium text-on-surface-variant hover:text-hope-orange transition-colors"
                              >
                                <Pause className="h-3.5 w-3.5" />
                                Pause
                              </button>
                            )}
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
