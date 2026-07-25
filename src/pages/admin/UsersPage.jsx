import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Heart,
  Search,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getDonorProfiles } from "@/services/users";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedUser, setExpandedUser] = useState(null);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["donor-profiles"],
    queryFn: getDonorProfiles,
    staleTime: 2 * 60 * 1000,
  });

  const users = profiles ?? [];

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      user.first_name?.toLowerCase().includes(q) ||
      user.last_name?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q) ||
      user.location?.toLowerCase().includes(q) ||
      user.phone?.toLowerCase().includes(q)
    );
  });

  const sponsoredCount = users.filter(
    (u) => u.sponsorships && u.sponsorships.length > 0
  ).length;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.h2
        variants={itemVariants}
        className="font-display text-2xl font-semibold text-deep-navy mb-2"
      >
        Users
      </motion.h2>
      <motion.p
        variants={itemVariants}
        className="font-body text-sm text-on-surface-variant mb-6"
      >
        Manage donor accounts and view sponsorship activity
      </motion.p>

      {/* Summary cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
      >
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-vibrant-blue/10">
              <Users className="h-5 w-5 text-vibrant-blue" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-deep-navy">
                {users.length}
              </p>
              <p className="font-body text-xs text-on-surface-variant">
                Total Users
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-hope-orange/10">
              <Heart className="h-5 w-5 text-hope-orange" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-deep-navy">
                {sponsoredCount}
              </p>
              <p className="font-body text-xs text-on-surface-variant">
                Users Who Sponsored
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10">
              <Calendar className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-deep-navy">
                {users.length - sponsoredCount}
              </p>
              <p className="font-body text-xs text-on-surface-variant">
                Without Sponsorship
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search by name, email, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-vibrant-blue/40 focus:border-vibrant-blue transition-all"
          />
        </div>
      </motion.div>

      {/* Users list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-vibrant-blue" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <motion.div
          variants={itemVariants}
          className="text-center py-20 bg-white rounded-xl border border-gray-200"
        >
          <Users className="h-12 w-12 mx-auto text-on-surface-variant/30 mb-3" />
          <p className="font-body text-on-surface-variant">
            {searchQuery
              ? "No users match your search."
              : "No users have signed up yet."}
          </p>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="space-y-3">
          {filteredUsers.map((user) => {
            const hasSponsored =
              user.sponsorships && user.sponsorships.length > 0;
            const isExpanded = expandedUser === user.id;

            return (
              <motion.div
                key={user.id}
                variants={itemVariants}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedUser(isExpanded ? null : user.id)
                  }
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-vibrant-blue/10 flex items-center justify-center shrink-0">
                      <span className="font-display font-bold text-sm text-vibrant-blue">
                        {user.first_name?.charAt(0) || "?"}
                        {user.last_name?.charAt(0) || ""}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="font-body font-medium text-deep-navy">
                        {[user.first_name, user.last_name]
                          .filter(Boolean)
                          .join(" ") || "Unknown"}
                      </p>
                      <p className="font-body text-xs text-on-surface-variant">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {hasSponsored && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-hope-orange/10 text-hope-orange">
                        <Heart className="h-3 w-3" />
                        Sponsor
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-on-surface-variant" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-on-surface-variant" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      {user.phone && (
                        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                          <Phone className="h-3.5 w-3.5" />
                          {user.phone}
                        </div>
                      )}
                      {user.location && (
                        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                          <MapPin className="h-3.5 w-3.5" />
                          {user.location}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                        <Calendar className="h-3.5 w-3.5" />
                        Joined {formatDate(user.created_at)}
                      </div>
                    </div>

                    {hasSponsored ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Heart className="h-4 w-4 text-hope-orange" />
                        <span className="font-body text-deep-navy font-medium">
                          Has sponsored {user.sponsorships.length} child
                          {user.sponsorships.length > 1 ? "ren" : ""}
                        </span>
                      </div>
                    ) : (
                      <p className="font-body text-sm text-on-surface-variant">
                        Has not sponsored any children yet.
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
