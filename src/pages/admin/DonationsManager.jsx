import { useState } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Search,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  Download,
  Loader2,
} from "lucide-react";

import { staggerContainer, slideUp } from "@/animations/variants";
import { useDonations, useUpdateDonationStatus } from "@/hooks/useDonations";

const statusColors = {
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  refunded: "bg-gray-50 text-gray-700 border-gray-200",
};

const statusIcons = {
  completed: CheckCircle,
  pending: Clock,
  failed: XCircle,
  refunded: XCircle,
};

export default function DonationsManager() {
  const { data: donations = [], isLoading } = useDonations();
  const updateStatus = useUpdateDonationStatus();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = donations.filter((d) => {
    const matchesSearch =
      d.donor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.donor_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAmount = donations
    .filter((d) => d.status === "completed")
    .reduce((sum, d) => sum + Number(d.amount), 0);

  const completedCount = donations.filter((d) => d.status === "completed").length;
  const pendingCount = donations.filter((d) => d.status === "pending").length;

  const stats = [
    { label: "Total Raised", value: `$${totalAmount.toLocaleString()}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Total Donations", value: donations.length, icon: Heart, color: "text-vibrant-blue", bg: "bg-vibrant-blue/10" },
    { label: "Completed", value: completedCount, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Pending", value: pendingCount, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  const handleExport = () => {
    const headers = ["Donor Name", "Email", "Phone", "Location", "Amount", "Currency", "Frequency", "Status", "Reference", "Date"];
    const rows = filtered.map((d) => [
      d.donor_name,
      d.donor_email,
      d.phone || "",
      d.location || "",
      d.amount,
      d.currency || "USD",
      d.frequency || "one-time",
      d.status,
      d.payment_reference || "",
      new Date(d.created_at).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `donations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-deep-navy mb-2">Donations</h1>
        <p className="font-body text-on-surface-variant">
          View and manage all donor contributions
        </p>
      </div>

      {/* Stats */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={slideUp}>
            <div className="bg-white rounded-xl border border-soft-accent p-5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-on-surface-variant">{stat.label}</p>
                  <p className="font-display text-xl font-bold text-deep-navy">{stat.value}</p>
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
            placeholder="Search by name, email, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-soft-accent bg-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 focus:border-vibrant-blue"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-on-surface-variant" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-soft-accent bg-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-soft-accent bg-white font-body text-sm text-on-surface-variant hover:bg-surface transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Donations Table */}
      <div className="bg-white rounded-xl border border-soft-accent overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-display text-xl text-deep-navy mb-2">No donations found</h3>
            <p className="font-body text-on-surface-variant">
              {donations.length === 0
                ? "No donations have been recorded yet."
                : "Try adjusting your search or filter criteria."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-soft-accent bg-surface/50">
                  <th className="text-left px-6 py-4 font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Donor</th>
                  <th className="text-left px-6 py-4 font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Contact</th>
                  <th className="text-left px-6 py-4 font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Location</th>
                  <th className="text-right px-6 py-4 font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Amount</th>
                  <th className="text-center px-6 py-4 font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Frequency</th>
                  <th className="text-center px-6 py-4 font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Date</th>
                  <th className="text-center px-6 py-4 font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soft-accent">
                {filtered.map((donation) => {
                  const StatusIcon = statusIcons[donation.status] || Clock;
                  return (
                    <tr key={donation.id} className="hover:bg-surface/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-body text-sm font-medium text-deep-navy">{donation.donor_name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                            <Mail className="h-3 w-3" />
                            {donation.donor_email}
                          </span>
                          {donation.phone && (
                            <span className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                              <Phone className="h-3 w-3" />
                              {donation.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {donation.location && (
                          <span className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                            <MapPin className="h-3 w-3" />
                            {donation.location}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-display text-sm font-bold text-deep-navy">
                          ${Number(donation.amount).toLocaleString()}
                        </span>
                        <span className="text-xs text-on-surface-variant ml-1">{donation.currency || "USD"}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs font-medium text-on-surface-variant capitalize">
                          {donation.frequency || "one-time"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[donation.status] || statusColors.pending}`}>
                          <StatusIcon className="h-3 w-3" />
                          {donation.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                          <Calendar className="h-3 w-3" />
                          {new Date(donation.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <select
                          value={donation.status}
                          onChange={(e) => updateStatus.mutate({ id: donation.id, status: e.target.value })}
                          className="px-2 py-1 rounded border border-soft-accent bg-white text-xs font-body focus:outline-none focus:ring-1 focus:ring-vibrant-blue"
                        >
                          <option value="completed">Completed</option>
                          <option value="pending">Pending</option>
                          <option value="failed">Failed</option>
                          <option value="refunded">Refunded</option>
                        </select>
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
