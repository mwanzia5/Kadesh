import { useState } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  User,
  Search,
  Calendar,
  DollarSign,
  RotateCcw,
  XCircle,
  CheckCircle,
  Users,
  Loader2,
} from "lucide-react";

import { staggerContainer, slideUp } from "@/animations/variants";
import { useSponsorshipOverview } from "@/hooks/useSponsorships";

const statusColors = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-gray-50 text-gray-700 border-gray-200",
};

const statusIcons = {
  active: CheckCircle,
  cancelled: XCircle,
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatAmount(sponsorship) {
  const amount =
    sponsorship.amount ??
    sponsorship.monthly_amount ??
    sponsorship.donation?.amount;
  if (!amount) return "—";
  return `$${Number(amount).toLocaleString()}${sponsorship.monthly_amount ? "/mo" : ""}`;
}

export default function SponsorshipsManager() {
  const { data, isLoading } = useSponsorshipOverview();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const sponsorships = data?.data ?? [];

  const activeCount = sponsorships.filter((s) => s.status === "active").length;
  const cancelledCount = sponsorships.filter(
    (s) => s.status === "cancelled"
  ).length;
  const reassignedCount = sponsorships.filter((s) => s.reassigned_at).length;
  const totalAmount = sponsorships.reduce(
    (sum, s) => sum + Number(s.amount ?? s.monthly_amount ?? 0),
    0
  );

  const stats = [
    { label: "Total Sponsorships", value: sponsorships.length, icon: Users, color: "text-vibrant-blue", bg: "bg-vibrant-blue/10" },
    { label: "Active", value: activeCount, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Cancelled", value: cancelledCount, icon: XCircle, color: "text-gray-600", bg: "bg-gray-50" },
    { label: "Re-sponsorships", value: reassignedCount, icon: RotateCcw, color: "text-vibrant-blue", bg: "bg-vibrant-blue/10" },
    { label: "Total Amount", value: `$${totalAmount.toLocaleString()}`, icon: DollarSign, color: "text-hope-orange", bg: "bg-hope-orange/10" },
  ];

  const filtered = sponsorships.filter((s) => {
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    const q = searchTerm.toLowerCase();
    const donorName = [s.donor?.first_name, s.donor?.last_name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchesSearch =
      searchTerm === "" ||
      donorName.includes(q) ||
      s.donor?.email?.toLowerCase().includes(q) ||
      s.children?.first_name?.toLowerCase().includes(q) ||
      `${s.donor?.first_name || ""}`.includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-deep-navy mb-2">
          Sponsorships
        </h1>
        <p className="font-body text-on-surface-variant">
          Monitor who is sponsoring which child, the amount they paid, and how
          cancelled sponsorships are re-used to re-sponsor children.
        </p>
      </div>

      {/* Stats */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8"
      >
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={slideUp}>
            <div className="bg-white rounded-xl border border-soft-accent p-5">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}
                >
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-on-surface-variant">{stat.label}</p>
                  <p className="font-display text-xl font-bold text-deep-navy">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-soft-accent p-4 mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by donor name, email, or child..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-soft-accent bg-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 focus:border-vibrant-blue"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {["all", "active", "cancelled"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-md font-body text-xs font-medium capitalize transition-all ${
                  statusFilter === status
                    ? "bg-white text-deep-navy shadow-sm"
                    : "text-on-surface-variant hover:text-deep-navy"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-soft-accent overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-vibrant-blue animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-display text-xl text-deep-navy mb-2">
              No sponsorships found
            </h3>
            <p className="font-body text-on-surface-variant">
              {sponsorships.length === 0
                ? "No sponsorships have been created yet."
                : "Try adjusting your search or filter criteria."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-soft-accent bg-surface/50">
                  <th className="text-left px-6 py-4 font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Donor
                  </th>
                  <th className="text-left px-6 py-4 font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Child
                  </th>
                  <th className="text-right px-6 py-4 font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="text-center px-6 py-4 font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Started
                  </th>
                  <th className="text-center px-6 py-4 font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Cancelled
                  </th>
                  <th className="text-left px-6 py-4 font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Re-sponsoring
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soft-accent">
                {filtered.map((sponsorship) => {
                  const StatusIcon =
                    statusIcons[sponsorship.status] || CheckCircle;
                  const donor = sponsorship.donor;
                  const child = sponsorship.children;
                  const previousChild = sponsorship.previous_child;
                  const reassigned = sponsorship.reassigned_at && previousChild;
                  return (
                    <tr
                      key={sponsorship.id}
                      className="hover:bg-surface/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-vibrant-blue/10 flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-vibrant-blue" />
                          </div>
                          <div>
                            <p className="font-body text-sm font-medium text-deep-navy">
                              {donor
                                ? [donor.first_name, donor.last_name]
                                    .filter(Boolean)
                                    .join(" ") || "Donor"
                                : "—"}
                            </p>
                            <p className="font-body text-xs text-on-surface-variant">
                              {donor?.email || `ID: ${sponsorship.donor_id || "—"}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-body text-sm font-medium text-deep-navy">
                          {child?.first_name || "—"}
                        </span>
                        {reassigned && (
                          <span className="block font-body text-xs text-on-surface-variant mt-0.5">
                            (was {previousChild.first_name})
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-body text-sm font-bold text-deep-navy">
                          {formatAmount(sponsorship)}
                        </span>
                        {sponsorship.donation?.payment_reference && (
                          <span className="block font-body text-xs text-on-surface-variant">
                            Ref: {sponsorship.donation.payment_reference}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                            statusColors[sponsorship.status] || statusColors.active
                          }`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {sponsorship.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                          <Calendar className="h-3 w-3" />
                          {formatDate(sponsorship.start_date)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {sponsorship.status === "cancelled" ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant">
                            <XCircle className="h-3 w-3" />
                            {formatDate(sponsorship.cancelled_at || sponsorship.updated_at)}
                          </span>
                        ) : (
                          <span className="text-xs text-on-surface-variant/50">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {reassigned ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-vibrant-blue">
                            <RotateCcw className="h-3 w-3" />
                            Re-sponsored from {previousChild.first_name} on{" "}
                            {formatDate(sponsorship.reassigned_at)}
                          </span>
                        ) : (
                          <span className="text-xs text-on-surface-variant/50">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}