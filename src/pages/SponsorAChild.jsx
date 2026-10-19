import { Component, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Heart,
  Loader2,
  Lock,
  MapPin,
  Search,
  ShieldCheck,
  Utensils,
  Users,
  X,
  AlertTriangle,
} from "lucide-react";

import PageTransition from "@/animations/PageTransition";
import SEO from "@/components/ui/SEO";
import { staggerContainer, slideUp } from "@/animations/variants";
import Container from "@/components/ui/Container";
import OptimizedImage from "@/components/ui/OptimizedImage";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { useSponsorshipCart } from "@/context/SponsorshipCartContext";
import { useChildren } from "@/hooks/useChildren";
import { useDonorAuth } from "@/context/DonorAuthContext";
import { getCMSContent, useCMSReady } from "@/hooks/useCMS";
import { cn } from "@/lib/utils";
import { AnnualFundingNotice } from "@/components/cart/SponsorshipSelection";
import { useAnnualFunding } from "@/hooks/useAnnualFunding";
import {
  annualChildStatus,
  hasAnnualFundingAmount,
  SPONSORSHIP_CHECKOUT,
} from "@/lib/sponsorship";

const CHILDREN_PER_PAGE = 24;
const STATUS_FILTERS = ["All", "Available", "Sponsored", "Pending"];
const GENDER_FILTERS = ["All", "Male", "Female"];
const AGE_FILTERS = [
  { value: "all", label: "All ages" },
  { value: "0-5", label: "0–5 years" },
  { value: "6-10", label: "6–10 years" },
  { value: "11-15", label: "11–15 years" },
  { value: "16+", label: "16+ years" },
];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest profiles" },
  { value: "name", label: "Name A–Z" },
  { value: "youngest", label: "Age: youngest" },
  { value: "oldest", label: "Age: oldest" },
];

const PROVIDES = [
  {
    title: "Education",
    description: "Help children learn and build a brighter future.",
    icon: BookOpen,
  },
  {
    title: "School supplies",
    description: "Uniforms, books, and supplies for school.",
    icon: Users,
  },
  {
    title: "Meals",
    description: "Nutritious meals to help children grow and thrive.",
    icon: Utensils,
  },
];

const SPONSORSHIP_STEPS = [
  {
    number: "01",
    title: "Find a child",
    description:
      "Search and filter the child profiles to find the child you would like to support.",
  },
  {
    number: "02",
    title: "Start sponsorship",
    description: "Add one or more children to your sponsorship cart.",
  },
  {
    number: "03",
    title: "Complete your support",
    description:
      "Choose support options at checkout, complete your payment securely, and return to the child profile whenever you need it.",
  },
];

function normalizeStatus(status) {
  return String(status || "")
    .trim()
    .toLowerCase();
}

function cleanLocationDisplay(location) {
  return String(location || "")
    .normalize("NFKC")
    .trim()
    .replace(/\s*[,;]+\s*/g, ", ")
    .replace(/(?:,\s*){2,}/g, ", ")
    .replace(/\s+/g, " ")
    .replace(/^,\s*|\s*,\s*$/g, "")
    .trim();
}

function normalizeLocationKey(location) {
  return cleanLocationDisplay(location)
    .toLocaleLowerCase()
    .replace(/[.,;:/\\|()[\]{}'"`’‘“”_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function locationLabelScore(label) {
  const words = String(label || "")
    .split(/[\s,]+/)
    .filter(Boolean);
  const properlyCasedWords = words.filter((word) =>
    /^[A-Z][a-zÀ-öø-ÿ'’.-]*$/.test(word),
  ).length;
  const separatorScore = (label.match(/, /g) || []).length * 2;
  const lowerCasePenalty = words.filter((word) =>
    /^[a-zà-öø-ÿ]+$/.test(word),
  ).length;

  return properlyCasedWords * 3 + separatorScore - lowerCasePenalty;
}

function statusLabel(status) {
  const value = normalizeStatus(status);
  if (value === "available") return "Need a Sponsor";
  if (value === "sponsored") return "Sponsored";
  if (value === "pending") return "Pending";
  return status || "Unknown";
}

function StatusBadge({ status }) {
  const value = normalizeStatus(status);
  const styles = {
    available: "border-rose-200 bg-rose-50 text-rose-700",
    sponsored: "border-emerald-200 bg-emerald-50 text-emerald-700",
    pending: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 font-body text-[11px] font-bold leading-none shadow-sm",
        styles[value] || "border-gray-200 bg-gray-50 text-gray-600",
      )}
    >
      {statusLabel(status)}
    </span>
  );
}

class ChildCardBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error(
      "[SponsorAChild] A child card failed to render.\nRecord:",
      this.props.child,
      "\nError:",
      error,
      "\nComponent stack:",
      info?.componentStack,
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
          <AlertTriangle className="mb-2 h-6 w-6 text-red-400" />
          <p className="font-body text-sm text-red-600">
            This profile couldn&apos;t be displayed.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Signed-out visitors only see a child's photo. Every other detail (name, age,
// location, school, story) is shown only to signed-in donors.
function LockedChildCard({ child }) {
  const signInTo = `/login?redirect=${encodeURIComponent(`/sponsor-a-child/${child.id}`)}`;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#eadfc8] bg-white shadow-[0_12px_32px_rgba(55,43,20,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(55,43,20,0.13)]">
      <Link
        to={signInTo}
        aria-label="Sign in to view this child's profile"
        className="relative block aspect-[4/5] overflow-hidden bg-[#f4ead7]"
      >
        {child.photo_url ? (
          <OptimizedImage
            src={child.photo_url}
            alt="Child waiting for a sponsor"
            className="absolute inset-0 h-full w-full bg-[#f4ead7] object-contain object-center"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#f7e7bd] to-[#efe1c5]">
            <Users className="h-12 w-12 text-[#b2872f]/45" />
          </div>
        )}
        <div className="absolute right-2.5 top-2.5 sm:right-3 sm:top-3">
          <StatusBadge status={child.sponsorship_status} />
        </div>
      </Link>
      <div className="mt-auto p-3.5 sm:p-4">
        <Link
          to={signInTo}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e5bab] px-3 py-2.5 font-body text-xs font-bold text-white shadow-sm transition-all hover:bg-[#174a8d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e5bab]/40"
        >
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          Sign in to view profile
        </Link>
      </div>
    </article>
  );
}

function ChildCard({ child, locationLabel, onSponsored, funding }) {
  const { addToCart, isInCart } = useSponsorshipCart();
  const inCart = isInCart(child.id);
  const isAvailable = normalizeStatus(child.sponsorship_status) === "available";

  const handleSponsor = () => {
    if (!isAvailable) return;
    addToCart(child);
    onSponsored?.(child);
  };

  const tags = [
    child.class_grade ? child.class_grade : null,
    child.gender
      ? String(child.gender).replace(/^./, (letter) => letter.toUpperCase())
      : null,
  ].filter(Boolean);

  return (
    <article className="group grid h-full grid-cols-[112px_minmax(0,1fr)] overflow-hidden rounded-2xl border border-[#eadfc8] bg-white shadow-[0_12px_32px_rgba(55,43,20,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(55,43,20,0.13)] sm:block">
      <Link
        to={`/sponsor-a-child/${child.id}`}
        aria-label={`View ${child.first_name || "child"}'s profile`}
        className="relative block min-h-[182px] overflow-hidden bg-[#f4ead7] sm:aspect-[2/3] sm:min-h-0"
      >
        {child.photo_url ? (
          <OptimizedImage
            src={child.photo_url}
            alt={child.first_name || "Child"}
            className="absolute inset-0 h-full w-full bg-[#f4ead7] object-contain object-center"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#f7e7bd] to-[#efe1c5]">
            <span className="font-display text-5xl font-bold text-[#b2872f]/45">
              {(child.first_name || "?").charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute right-2.5 top-2.5 sm:right-3 sm:top-3">
          <StatusBadge status={child.sponsorship_status} />
        </div>
      </Link>

      <div className="flex min-w-0 flex-col p-3.5 sm:p-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="truncate font-display text-xl font-bold text-deep-navy sm:text-[1.35rem]">
            <Link
              to={`/sponsor-a-child/${child.id}`}
              className="hover:text-[#1e5bab]"
            >
              {child.first_name || "Unnamed"}
            </Link>
          </h3>
          <span className="shrink-0 font-body text-xs font-semibold text-[#6f6554]">
            Age {child.age ?? "—"}
          </span>
        </div>

        <div className="mb-3 flex min-w-0 items-center gap-1.5 font-body text-xs text-[#6f6554]">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#1e5bab]" />
          <span className="truncate">
            {locationLabel ||
              cleanLocationDisplay(child.location) ||
              "Location not listed"}
          </span>
        </div>

        {tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="max-w-full truncate rounded-full border border-[#eee6d8] bg-[#faf7f0] px-2.5 py-1 font-body text-[11px] font-medium text-[#625a4c]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {hasAnnualFundingAmount(funding) && !funding.legacy_reserved && (
          <p className="mb-3 text-xs text-slate-600">
            ${Number(funding.funded_amount).toLocaleString()} of $300 annual
            support received
          </p>
        )}
        <div className="mt-auto pt-1">
          {isAvailable ? (
            <button
              type="button"
              onClick={handleSponsor}
              disabled={inCart}
              className={cn(
                "inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 font-body text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e5bab]/40",
                inCart
                  ? "cursor-default border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "bg-[#1e5bab] text-white shadow-sm hover:bg-[#174a8d]",
              )}
            >
              {inCart ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  In your sponsorship cart
                </>
              ) : (
                <>
                  Add {child.first_name || "child"} to cart
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </>
              )}
            </button>
          ) : (
            <Link
              to={`/sponsor-a-child/${child.id}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#dfd3bc] bg-[#fffdf8] px-3 py-2.5 font-body text-xs font-bold text-deep-navy transition-all hover:border-[#1e5bab] hover:text-[#1e5bab]"
            >
              View Profile
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}

          {isAvailable && (
            <Link
              to={`/sponsor-a-child/${child.id}`}
              className="mt-2 block py-1 text-center font-body text-xs font-semibold text-[#6f6554] underline-offset-2 transition-colors hover:text-[#1e5bab] hover:underline"
            >
              View full profile
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

function FilterSelect({ label, value, onChange, children }) {
  return (
    <label className="block min-w-0">
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-[#ded5c5] bg-white px-3.5 py-3 font-body text-sm font-semibold text-deep-navy shadow-sm outline-none transition focus:border-[#1e5bab] focus:ring-2 focus:ring-[#1e5bab]/15"
      >
        {children}
      </select>
    </label>
  );
}

function getPaginationItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) return [1, 2, 3, 4, 5, "end-ellipsis", totalPages];
  if (currentPage >= totalPages - 3) {
    return [
      1,
      "start-ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "start-ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "end-ellipsis",
    totalPages,
  ];
}

export default function SponsorAChild() {
  useCMSReady();

  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("All");
  const [ageFilter, setAgeFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [prioritizeAvailable, setPrioritizeAvailable] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [cartAlert, setCartAlert] = useState(null);

  const { user, loading: authLoading } = useDonorAuth();
  const locked = !user;
  const { data: childrenData, isLoading: childrenLoading } = useChildren({
    publicOnly: locked,
    enabled: !authLoading,
  });
  const isLoading = authLoading || childrenLoading;
  const funding = useAnnualFunding();
  const { cartCount, subtotal, frequency } = useSponsorshipCart();
  const children = useMemo(
    () =>
      (childrenData?.data || []).map((child) => ({
        ...child,
        sponsorship_status: annualChildStatus(child, funding.data?.[child.id]),
      })),
    [childrenData, funding.data],
  );

  const availableCount = useMemo(
    () =>
      children.filter(
        (child) => normalizeStatus(child.sponsorship_status) === "available",
      ).length,
    [children],
  );

  const locationOptions = useMemo(() => {
    const groups = new Map();

    children.forEach((child) => {
      const cleaned = cleanLocationDisplay(child.location);
      const key = normalizeLocationKey(cleaned);
      if (!key || !cleaned) return;

      if (!groups.has(key)) {
        groups.set(key, new Map());
      }

      const variants = groups.get(key);
      variants.set(cleaned, (variants.get(cleaned) || 0) + 1);
    });

    return Array.from(groups.entries())
      .map(([key, variants]) => {
        const rankedVariants = Array.from(variants.entries()).sort(
          ([labelA, countA], [labelB, countB]) => {
            const scoreDifference =
              locationLabelScore(labelB) - locationLabelScore(labelA);
            if (scoreDifference !== 0) return scoreDifference;
            if (countB !== countA) return countB - countA;
            return labelA.localeCompare(labelB);
          },
        );

        return {
          key,
          label: rankedVariants[0]?.[0] || key,
          count: Array.from(variants.values()).reduce(
            (total, count) => total + count,
            0,
          ),
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [children]);

  const locationLabelByKey = useMemo(
    () =>
      new Map(
        locationOptions.map((location) => [location.key, location.label]),
      ),
    [locationOptions],
  );

  const statusCounts = useMemo(() => {
    const counts = {
      All: children.length,
      Available: 0,
      Sponsored: 0,
      Pending: 0,
    };
    children.forEach((child) => {
      const status = normalizeStatus(child.sponsorship_status);
      if (status === "available") counts.Available += 1;
      if (status === "sponsored") counts.Sponsored += 1;
      if (status === "pending") counts.Pending += 1;
    });
    return counts;
  }, [children]);

  const filteredChildren = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const matchesAge = (child) => {
      if (ageFilter === "all") return true;
      const age = Number(child.age);
      if (Number.isNaN(age)) return false;
      if (ageFilter === "0-5") return age >= 0 && age <= 5;
      if (ageFilter === "6-10") return age >= 6 && age <= 10;
      if (ageFilter === "11-15") return age >= 11 && age <= 15;
      if (ageFilter === "16+") return age >= 16;
      return true;
    };

    const result = children.filter((child) => {
      const name = String(child.first_name || "").toLowerCase();
      const location = String(child.location || "").toLowerCase();
      const school = String(child.school_name || "").toLowerCase();
      const grade = String(child.class_grade || "").toLowerCase();
      const status = normalizeStatus(child.sponsorship_status);
      const gender = String(child.gender || "").toLowerCase();

      const matchesSearch =
        !query ||
        [name, location, school, grade].some((value) => value.includes(query));
      const matchesLocation =
        locationFilter === "All" ||
        normalizeLocationKey(child.location) === locationFilter;
      const matchesGender =
        genderFilter === "All" || gender === genderFilter.toLowerCase();
      const matchesStatus =
        statusFilter === "All" || status === statusFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesLocation &&
        matchesGender &&
        matchesStatus &&
        matchesAge(child)
      );
    });

    return [...result].sort((a, b) => {
      if (prioritizeAvailable) {
        const aAvailable =
          normalizeStatus(a.sponsorship_status) === "available" ? 0 : 1;
        const bAvailable =
          normalizeStatus(b.sponsorship_status) === "available" ? 0 : 1;
        if (aAvailable !== bAvailable) return aAvailable - bAvailable;
      }

      if (sortBy === "name") {
        return String(a.first_name || "").localeCompare(
          String(b.first_name || ""),
        );
      }
      if (sortBy === "youngest")
        return Number(a.age ?? 999) - Number(b.age ?? 999);
      if (sortBy === "oldest") return Number(b.age ?? -1) - Number(a.age ?? -1);

      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });
  }, [
    children,
    searchQuery,
    locationFilter,
    ageFilter,
    genderFilter,
    statusFilter,
    sortBy,
    prioritizeAvailable,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    locationFilter,
    ageFilter,
    genderFilter,
    statusFilter,
    sortBy,
    prioritizeAvailable,
  ]);

  useEffect(() => {
    if (!cartAlert) return undefined;

    const timer = window.setTimeout(() => {
      setCartAlert(null);
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [cartAlert]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredChildren.length / CHILDREN_PER_PAGE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * CHILDREN_PER_PAGE;
  const paginatedChildren = filteredChildren.slice(
    pageStart,
    pageStart + CHILDREN_PER_PAGE,
  );
  const paginationItems = getPaginationItems(safeCurrentPage, totalPages);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    locationFilter !== "All" ||
    ageFilter !== "all" ||
    genderFilter !== "All" ||
    statusFilter !== "All" ||
    sortBy !== "newest" ||
    !prioritizeAvailable;

  const clearFilters = () => {
    setSearchQuery("");
    setLocationFilter("All");
    setAgeFilter("all");
    setGenderFilter("All");
    setStatusFilter("All");
    setSortBy("newest");
    setPrioritizeAvailable(true);
    setCurrentPage(1);
  };

  const goToPage = (page) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(nextPage);
    window.requestAnimationFrame(() => {
      document.getElementById("children-directory")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  return (
    <PageTransition>
      <SEO title="Sponsor a Child" description="Help a child learn, grow, and thrive. Sponsor a child with Kadesh Hope Mission for education fees, school supplies, and meals." />
      <main className="overflow-hidden bg-[#fffdf8]">
        {cartAlert && (
          <div
            role="status"
            aria-live="polite"
            className="fixed left-1/2 top-20 z-[9999] w-[calc(100%-2rem)] max-w-md -translate-x-1/2"
          >
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3.5 shadow-[0_18px_50px_rgba(15,23,42,0.20)]">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-body text-sm font-bold text-deep-navy">
                  Added to sponsorship cart
                </p>
                <p className="mt-0.5 font-body text-xs leading-5 text-[#6c6458] sm:text-sm">
                  {cartAlert.first_name || "This child"} has been added to your
                  cart.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCartAlert(null)}
                className="rounded-full p-1 text-[#827a6d] transition hover:bg-[#f7f3ea] hover:text-deep-navy"
                aria-label="Close cart notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Hero */}
        <section className="border-b border-[#eadfc8] bg-[linear-gradient(115deg,#fff8e8_0%,#fffdf7_46%,#f7ead0_100%)]">
          <Container className="px-0 md:px-16">
            <div className="grid min-h-[430px] grid-cols-1 overflow-hidden md:min-h-[500px] md:grid-cols-[1.02fr_0.98fr] md:rounded-b-[2rem]">
              <div className="relative z-10 flex items-center px-5 py-14 sm:px-8 md:px-0 md:pr-12 lg:pr-16">
                <div className="max-w-xl">
                  <ScrollReveal>
                    <span className="mb-5 inline-flex rounded-full border border-[#e8d7ad] bg-white/75 px-4 py-1.5 font-body text-xs font-bold uppercase tracking-[0.18em] text-[#9a710e] shadow-sm backdrop-blur">
                      {getCMSContent("sponsor", "heroBadge", "Sponsor a Child")}
                    </span>
                  </ScrollReveal>

                  <ScrollReveal delay={0.08}>
                    <h1 className="max-w-[620px] text-balance font-display text-[2.65rem] font-bold leading-[1.02] tracking-[-0.03em] text-deep-navy sm:text-5xl lg:text-[4.15rem]">
                      {getCMSContent(
                        "sponsor",
                        "heroTitle",
                        "Change a Child's Future",
                      )}
                    </h1>
                  </ScrollReveal>

                  <ScrollReveal delay={0.14}>
                    <p className="mt-5 max-w-[560px] font-body text-base leading-7 text-[#5f584b] sm:text-lg">
                      {getCMSContent(
                        "sponsor",
                        "heroSubtitle",
                        "Help a child learn, grow, and thrive with education fees, school supplies, and meals. Give $100 toward education fees, school supplies or meals, $300 for a full year, or $25–$50 a month.",
                      )}
                    </p>
                  </ScrollReveal>

                  <ScrollReveal delay={0.2}>
                    <a
                      href="#children-directory"
                      className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#1e5bab] px-6 py-3.5 font-body text-sm font-bold text-white shadow-[0_10px_24px_rgba(30,91,171,0.25)] transition hover:-translate-y-0.5 hover:bg-[#174a8d]"
                    >
                      Find a child to sponsor
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </ScrollReveal>
                </div>
              </div>

              <div className="relative min-h-[300px] overflow-hidden md:min-h-full md:rounded-bl-[5rem]">
                <OptimizedImage
                  src="/images/hero-children.jpg"
                  alt="Children supported by Kadesh Hope Mission"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#fffaf0]/55 via-transparent to-transparent md:from-[#fffaf0]/20" />
                <div className="absolute bottom-6 right-6 max-w-[210px] rounded-[1.35rem] border border-white/45 bg-white/80 p-4 shadow-lg backdrop-blur-md sm:bottom-8 sm:right-8">
                  <p className="font-display text-xl font-bold leading-tight text-deep-navy">
                    A brighter tomorrow starts with one act of care.
                  </p>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* What sponsorship provides */}
        <section className="relative z-20 -mt-1 pb-12 pt-8 sm:pb-16 sm:pt-10">
          <Container>
            <div className="rounded-[1.6rem] border border-[#eadfc8] bg-white p-5 shadow-[0_14px_42px_rgba(58,45,20,0.08)] sm:p-7">
              <div className="mb-5 text-center sm:mb-6">
                <p className="font-body text-xs font-bold uppercase tracking-[0.18em] text-[#a47a17]">
                  {getCMSContent(
                    "sponsor",
                    "benefitsTitle",
                    "What Your Sponsorship Provides",
                  )}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-0">
                {PROVIDES.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className={cn(
                        "flex items-start gap-3 rounded-2xl bg-[#fffaf0] p-4 lg:rounded-none lg:bg-transparent lg:px-6 lg:py-2",
                        index > 0 && "lg:border-l lg:border-[#eee3cd]",
                      )}
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f6e7bd] text-[#9a710e]">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <h2 className="font-display text-base font-bold text-deep-navy sm:text-lg">
                          {item.title}
                        </h2>
                        <p className="mt-1 font-body text-xs leading-5 text-[#6c6458] sm:text-sm">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Container>
        </section>

        <Container>
          <AnnualFundingNotice />
        </Container>
        {cartCount > 0 && (
          <div className="fixed inset-x-4 bottom-4 z-30 mx-auto max-w-3xl rounded-2xl border border-blue-200 bg-white p-4 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold text-deep-navy">
                {cartCount} {cartCount === 1 ? "child" : "children"} selected ·
                ${subtotal}
                {frequency === "monthly" ? " / month" : ""}
              </p>
              <Link
                to={SPONSORSHIP_CHECKOUT}
                className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800"
              >
                Continue sponsorship
              </Link>
            </div>
          </div>
        )}
        {/* How it works */}
        <section className="pb-14 sm:pb-20">
          <Container>
            <ScrollReveal>
              <div className="mx-auto mb-8 max-w-2xl text-center">
                <span className="font-body text-xs font-bold uppercase tracking-[0.18em] text-[#a47a17]">
                  Simple &amp; meaningful
                </span>
                <h2 className="mt-2 font-display text-3xl font-bold text-deep-navy sm:text-4xl">
                  {getCMSContent(
                    "sponsor",
                    "howItWorksTitle",
                    "How Sponsorship Works",
                  )}
                </h2>
                <p className="mt-3 font-body text-sm leading-6 text-[#6c6458] sm:text-base">
                  Choose a child, start the sponsorship, and support their
                  journey through Kadesh Hope Mission.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {SPONSORSHIP_STEPS.map((step, index) => (
                <ScrollReveal key={step.number} delay={index * 0.07}>
                  <div className="relative h-full rounded-[1.5rem] border border-[#eadfc8] bg-white p-6 shadow-[0_10px_28px_rgba(55,43,20,0.06)]">
                    <span className="font-display text-5xl font-bold text-[#e9d7a7]">
                      {step.number}
                    </span>
                    <h3 className="mt-4 font-display text-2xl font-bold text-deep-navy">
                      {step.title}
                    </h3>
                    <p className="mt-2 font-body text-sm leading-6 text-[#6c6458]">
                      {step.description}
                    </p>
                    {index < SPONSORSHIP_STEPS.length - 1 && (
                      <ArrowRight className="absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 rounded-full bg-[#fffdf8] p-1 text-[#1e5bab] md:block" />
                    )}
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </section>

        {/* Search + children */}
        <section
          id="children-directory"
          className="scroll-mt-24 border-t border-[#efe5d1] bg-[#fffaf0] py-12 sm:py-16"
        >
          <Container>
            <div className="mb-7 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="font-body text-xs font-bold uppercase tracking-[0.18em] text-[#a47a17]">
                  Meet the children
                </p>
                <h2 className="mt-2 font-display text-3xl font-bold text-deep-navy sm:text-4xl">
                  Find a child to sponsor
                </h2>
                <p className="mt-2 max-w-2xl font-body text-sm leading-6 text-[#6c6458] sm:text-base">
                  {locked
                    ? "Every photo is a child waiting for someone to stand with them. Sign in to read their stories and sponsor."
                    : "Browse child profiles. Search by name or location, then narrow the list with the filters below."}
                </p>
              </div>
              {!isLoading && (
                <p className="font-body text-sm font-semibold text-[#6c6458]">
                  <span className="text-deep-navy">{children.length}</span>{" "}
                  child profiles
                </p>
              )}
            </div>

            {locked ? (
              <div className="flex flex-col gap-4 rounded-[1.5rem] border border-[#eadfc8] bg-white p-5 shadow-[0_12px_36px_rgba(55,43,20,0.07)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0b2d47] text-[#f0cd72]">
                    <Lock className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-display text-xl font-bold text-deep-navy">
                      Child profiles are private
                    </p>
                    <p className="mt-1 max-w-xl font-body text-sm leading-6 text-[#6c6458]">
                      To protect the children in our care, names, ages,
                      locations and stories are only visible to signed-in
                      donors. Sign in or create a free account to view full
                      profiles and sponsor a child.
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link
                    to={`/login?redirect=${encodeURIComponent("/sponsor-a-child")}`}
                    className="inline-flex items-center gap-2 rounded-full bg-[#1e5bab] px-5 py-2.5 font-body text-sm font-bold text-white transition hover:bg-[#174a8d]"
                  >
                    Sign in
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to={`/signup?redirect=${encodeURIComponent("/sponsor-a-child")}`}
                    className="inline-flex items-center rounded-full border border-[#dfd3bc] bg-[#fffdf8] px-5 py-2.5 font-body text-sm font-bold text-deep-navy transition hover:border-[#1e5bab] hover:text-[#1e5bab]"
                  >
                    Create account
                  </Link>
                </div>
              </div>
            ) : (
            <div className="rounded-[1.5rem] border border-[#eadfc8] bg-white p-4 shadow-[0_12px_36px_rgba(55,43,20,0.07)] sm:p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
                <label className="relative block min-w-0 sm:col-span-2 lg:col-span-3 xl:col-span-2">
                  <span className="sr-only">Search child profiles</span>
                  <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#837967]" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={getCMSContent(
                      "sponsor",
                      "searchPlaceholder",
                      "Search by name or location...",
                    )}
                    className="w-full rounded-xl border border-[#ded5c5] bg-white py-3 pl-11 pr-4 font-body text-sm text-deep-navy shadow-sm outline-none transition placeholder:text-[#9a9183] focus:border-[#1e5bab] focus:ring-2 focus:ring-[#1e5bab]/15"
                  />
                </label>

                <FilterSelect
                  label="Age"
                  value={ageFilter}
                  onChange={(event) => setAgeFilter(event.target.value)}
                >
                  {AGE_FILTERS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </FilterSelect>

                <FilterSelect
                  label="Gender"
                  value={genderFilter}
                  onChange={(event) => setGenderFilter(event.target.value)}
                >
                  {GENDER_FILTERS.map((gender) => (
                    <option key={gender} value={gender}>
                      {gender === "All" ? "All genders" : gender}
                    </option>
                  ))}
                </FilterSelect>

                <FilterSelect
                  label="Sponsorship status"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  {STATUS_FILTERS.map((status) => (
                    <option key={status} value={status}>
                      {status === "Available" ? "Need a Sponsor" : status} (
                      {statusCounts[status] ?? 0})
                    </option>
                  ))}
                </FilterSelect>

                <FilterSelect
                  label="Sort children"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </FilterSelect>

                <FilterSelect
                  label="Location"
                  value={locationFilter}
                  onChange={(event) => setLocationFilter(event.target.value)}
                >
                  <option value="All">All locations</option>
                  {locationOptions.map((location) => (
                    <option key={location.key} value={location.key}>
                      {location.label} ({location.count})
                    </option>
                  ))}
                </FilterSelect>
              </div>

              <div className="mt-4 flex flex-col gap-3 border-t border-[#eee6d9] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <label className="inline-flex cursor-pointer items-center gap-3 font-body text-sm font-semibold text-[#5f584b]">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={prioritizeAvailable}
                    onClick={() => setPrioritizeAvailable((value) => !value)}
                    className={cn(
                      "relative h-6 w-11 shrink-0 rounded-full transition",
                      prioritizeAvailable ? "bg-deep-navy" : "bg-[#d8d1c6]",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all",
                        prioritizeAvailable ? "left-6" : "left-1",
                      )}
                    />
                  </button>
                  Show children needing sponsorship first
                </label>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1.5 font-body text-xs font-bold text-[#8a6a1f] transition hover:bg-[#fff5d9] sm:self-auto"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear filters
                  </button>
                )}
              </div>
            </div>
            )}

            {!isLoading && availableCount > 0 && (
              <div className="mt-5 flex flex-col gap-4 overflow-hidden rounded-[1.35rem] border border-[#efdca7] bg-[linear-gradient(90deg,#fff6dc,#fffaf0)] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#1e5bab] shadow-sm">
                    <Heart className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-display text-xl font-bold text-deep-navy">
                      {availableCount}{" "}
                      {availableCount === 1 ? "child is" : "children are"}{" "}
                      waiting for a sponsor
                    </p>
                    <p className="font-body text-xs leading-5 text-[#6c6458] sm:text-sm">
                      Choose a child and begin sponsorship directly from the
                      profile card.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStatusFilter("Available")}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#1e5bab] px-5 py-2.5 font-body text-xs font-bold text-white transition hover:bg-[#174a8d]"
                >
                  View children needing sponsors
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-body text-sm text-[#6c6458]">
                Showing{" "}
                <span className="font-bold text-deep-navy">
                  {filteredChildren.length === 0 ? 0 : pageStart + 1}–
                  {Math.min(
                    pageStart + CHILDREN_PER_PAGE,
                    filteredChildren.length,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-bold text-deep-navy">
                  {filteredChildren.length}
                </span>{" "}
                matching children
              </p>
              {filteredChildren.length !== children.length && (
                <p className="font-body text-xs text-[#8a8275]">
                  {children.length} total profiles in the directory
                </p>
              )}
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="mb-4 h-9 w-9 animate-spin text-[#1e5bab]" />
                <p className="font-body text-sm text-[#6c6458]">
                  Loading children...
                </p>
              </div>
            ) : filteredChildren.length === 0 ? (
              <div className="mt-6 rounded-[1.5rem] border border-dashed border-[#d9cdb6] bg-white px-5 py-16 text-center">
                <Search className="mx-auto mb-3 h-10 w-10 text-[#c4b799]" />
                <h3 className="font-display text-2xl font-bold text-deep-navy">
                  No children match these filters
                </h3>
                <p className="mx-auto mt-2 max-w-md font-body text-sm leading-6 text-[#6c6458]">
                  Try changing the location, age, gender, status, or search
                  term.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#d8c99f] bg-[#fffaf0] px-5 py-2.5 font-body text-sm font-bold text-[#8b6811]"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <motion.div
                key={`${safeCurrentPage}-${statusFilter}-${genderFilter}-${ageFilter}-${locationFilter}-${sortBy}-${prioritizeAvailable}-${searchQuery}`}
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {paginatedChildren.map((child) => (
                  <motion.div
                    key={child.id}
                    variants={slideUp}
                  >
                    <ChildCardBoundary child={child}>
                      {locked ? (
                        <LockedChildCard child={child} />
                      ) : (
                      <ChildCard
                        funding={funding.data?.[child.id]}
                        child={child}
                        locationLabel={
                          locationLabelByKey.get(
                            normalizeLocationKey(child.location),
                          ) || cleanLocationDisplay(child.location)
                        }
                        onSponsored={setCartAlert}
                      />
                      )}
                    </ChildCardBoundary>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {!isLoading && filteredChildren.length > 0 && totalPages > 1 && (
              <nav
                className="mt-9 flex flex-wrap items-center justify-center gap-2"
                aria-label="Children pagination"
              >
                <button
                  type="button"
                  onClick={() => goToPage(safeCurrentPage - 1)}
                  disabled={safeCurrentPage === 1}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dcd2c0] bg-white text-deep-navy transition hover:border-[#1e5bab] disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {paginationItems.map((item, index) =>
                  typeof item === "number" ? (
                    <button
                      key={item}
                      type="button"
                      onClick={() => goToPage(item)}
                      aria-current={
                        safeCurrentPage === item ? "page" : undefined
                      }
                      className={cn(
                        "inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 font-body text-sm font-bold transition",
                        safeCurrentPage === item
                          ? "bg-[#1e5bab] text-white shadow-md"
                          : "border border-[#dcd2c0] bg-white text-deep-navy hover:border-[#1e5bab]",
                      )}
                    >
                      {item}
                    </button>
                  ) : (
                    <span
                      key={`${item}-${index}`}
                      className="px-1 font-body text-sm text-[#8f877b]"
                    >
                      …
                    </span>
                  ),
                )}

                <button
                  type="button"
                  onClick={() => goToPage(safeCurrentPage + 1)}
                  disabled={safeCurrentPage === totalPages}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dcd2c0] bg-white text-deep-navy transition hover:border-[#1e5bab] disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            )}
          </Container>
        </section>

        {/* Closing reassurance */}
        <section className="bg-white py-12 sm:py-16">
          <Container>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                {
                  icon: CheckCircle2,
                  title: "Choose with care",
                  text: "Open any child's profile to read their story and needs before you decide.",
                },
                {
                  icon: ShieldCheck,
                  title: "Simple, secure checkout",
                  text: "Add one or more children to your cart and pay securely by card, M-Pesa, Airtel Money or bank.",
                },
                {
                  icon: Heart,
                  title: "Stay connected",
                  text: "Sign in to your account to see the children you sponsor and when your next gift is due.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex gap-3 rounded-2xl border border-[#eee5d4] bg-[#fffdf8] p-5"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f7e7bd] text-[#9a710e]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-bold text-deep-navy">
                        {item.title}
                      </h3>
                      <p className="mt-1 font-body text-sm leading-6 text-[#6c6458]">
                        {item.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Container>
        </section>
      </main>
    </PageTransition>
  );
}
