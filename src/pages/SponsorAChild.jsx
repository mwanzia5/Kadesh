import { useState, useMemo, Component } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MapPin,
  Calendar,
  Search,
  Loader2,
  X,
  AlertTriangle,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";

import PageTransition from "@/animations/PageTransition";
import { staggerContainer, slideUp } from "@/animations/variants";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import OptimizedImage from "@/components/ui/OptimizedImage";
import GlareHover from "@/components/ui/GlareHover";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { useChildren } from "@/hooks/useChildren";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = ["All", "Available", "Sponsored", "Pending"];
const GENDER_FILTERS = ["All", "Male", "Female"];
const AGE_PRESETS = [
  { id: "all", label: "All Ages", min: "", max: "" },
  { id: "0-5", label: "0\u20135", min: 0, max: 5 },
  { id: "6-10", label: "6\u201310", min: 6, max: 10 },
  { id: "11-15", label: "11\u201315", min: 11, max: 15 },
  { id: "16", label: "16+", min: 16, max: "" },
];

function StatusBadge({ status }) {
  const styles = {
    available: "bg-green-100 text-green-700",
    sponsored: "bg-vibrant-blue/10 text-vibrant-blue",
    pending: "bg-hope-orange/10 text-hope-orange",
  };
  return (
    <span
      className={cn(
        "inline-block px-3 py-1 rounded-full font-body text-xs font-semibold capitalize",
        styles[status] || "bg-gray-100 text-gray-600"
      )}
    >
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Per-card error boundary: if one child's data is malformed and its card
// throws while rendering, ONLY that card fails — the rest of the grid still
// renders. The full error + the offending record are logged to the console
// so the bad row can be found and fixed at the source (Supabase).
// ---------------------------------------------------------------------------
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
      info?.componentStack
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[240px] sm:min-h-[280px] rounded-xl border border-red-200 bg-red-50 p-4 sm:p-6 text-center">
          <AlertTriangle className="h-6 w-6 text-red-400 mb-2" />
          <p className="font-body text-sm text-red-600">
            This profile couldn't be displayed.
          </p>
          <p className="font-body text-xs text-red-400 mt-1">
            Check the browser console for details.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

function ChildCard({ child }) {
  return (
    <div className="group flex flex-col h-full rounded-xl overflow-hidden bg-white border border-soft-accent/50 shadow-card hover:shadow-card-hover transition-shadow duration-300">
      <div className="relative overflow-hidden">
        {child.photo_url ? (
          <OptimizedImage
            src={child.photo_url}
            alt={child.first_name || "Child"}
            className="w-full h-auto transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-vibrant-blue/20 to-hope-orange/20 flex items-center justify-center">
            <span className="font-display text-4xl sm:text-5xl font-bold text-vibrant-blue/30">
              {(child.first_name || "?").charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
          <StatusBadge status={child.sponsorship_status} />
        </div>
      </div>

      <div className="flex flex-col flex-1 p-4 sm:p-5">
        <h3 className="font-display text-lg sm:text-headline-md text-deep-navy mb-2 group-hover:text-vibrant-blue transition-colors">
          {child.first_name || "Unnamed"}
        </h3>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
          <span className="inline-flex items-center gap-1 font-body text-xs text-on-surface-variant">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            Age {child.age ?? "—"}
          </span>
          <span className="inline-flex items-center gap-1 font-body text-xs text-on-surface-variant min-w-0">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{child.location || "Location unknown"}</span>
          </span>
        </div>
        <div className="min-h-[2.5rem] mb-3">
          {child.bio ? (
            <p className="font-body text-body-sm text-on-surface-variant line-clamp-2">
              {child.bio}
            </p>
          ) : (
            <p className="font-body text-body-sm text-on-surface-variant/40 italic">
              No description yet
            </p>
          )}
        </div>
        <Link to={`/sponsor-a-child/${child.id}`} className="mt-auto">
          <Button variant="lightblue" size="sm" className="w-full">
            Sponsor
            <Heart className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reusable pill group — used by both the desktop inline bar and the
// mobile collapsible panel so the two stay in sync automatically.
// ---------------------------------------------------------------------------
function PillGroup({ label, options, activeValue, counts, onSelect, activeClass, wrap = true }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      {label && (
        <span className="shrink-0 font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
          {label}
        </span>
      )}
      <div className={cn("flex gap-2", wrap ? "flex-wrap" : "flex-nowrap")}>
        {options.map((opt) => {
          const value = typeof opt === "string" ? opt : opt.id;
          const text = typeof opt === "string" ? opt : opt.label;
          const isActive = activeValue === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onSelect(opt)}
              className={cn(
                "shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body text-xs font-medium transition-all duration-300",
                isActive
                  ? activeClass
                  : "bg-surface-variant/40 text-on-surface-variant hover:bg-surface-variant hover:text-deep-navy"
              )}
            >
              {text}
              {counts && (
                <span
                  className={cn(
                    "inline-flex items-center justify-center min-w-[1.1rem] h-4 px-1 rounded-full text-[0.65rem] font-semibold",
                    isActive ? "bg-white/25 text-white" : "bg-white text-on-surface-variant"
                  )}
                >
                  {counts[value] ?? 0}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SponsorAChild() {
  const [statusFilter, setStatusFilter] = useState("All");
  const [genderFilter, setGenderFilter] = useState("All");
  const [agePreset, setAgePreset] = useState("all");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const { data: childrenData, isLoading } = useChildren();

  const children = childrenData?.data ?? [];

  const statusCounts = useMemo(() => {
    const counts = { All: children.length };
    for (const s of STATUS_FILTERS.slice(1)) {
      counts[s] = children.filter(
        (c) => (c.sponsorship_status || "").toLowerCase() === s.toLowerCase()
      ).length;
    }
    return counts;
  }, [children]);

  const genderCounts = useMemo(() => {
    const counts = { All: children.length };
    for (const g of GENDER_FILTERS.slice(1)) {
      counts[g] = children.filter(
        (c) => (c.gender || "").toLowerCase() === g.toLowerCase()
      ).length;
    }
    return counts;
  }, [children]);

  const applyAgePreset = (preset) => {
    setAgePreset(preset.id);
    setAgeMin(String(preset.min));
    setAgeMax(String(preset.max));
  };

  const handleAgeMinChange = (value) => {
    setAgeMin(value);
    setAgePreset("custom");
  };

  const handleAgeMaxChange = (value) => {
    setAgeMax(value);
    setAgePreset("custom");
  };

  const hasActiveFilters =
    statusFilter !== "All" ||
    genderFilter !== "All" ||
    agePreset !== "all" ||
    ageMin !== "" ||
    ageMax !== "" ||
    searchQuery !== "";

  const activeFilterCount = [
    statusFilter !== "All",
    genderFilter !== "All",
    agePreset !== "all" || ageMin !== "" || ageMax !== "",
    searchQuery !== "",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setStatusFilter("All");
    setGenderFilter("All");
    setAgePreset("all");
    setAgeMin("");
    setAgeMax("");
    setSearchQuery("");
  };

  const handleStatusSelect = (status) =>
    status === "All" ? clearFilters() : setStatusFilter(status);

  const filteredChildren = useMemo(() => {
    return children.filter((child) => {
      const status = (child.sponsorship_status || "").toLowerCase();
      const matchesStatus =
        statusFilter === "All" || status === statusFilter.toLowerCase();

      const gender = (child.gender || "").toLowerCase();
      const matchesGender =
        genderFilter === "All" || gender === genderFilter.toLowerCase();

      const age = Number(child.age);
      const ageValid = !Number.isNaN(age);
      const ageFilterActive = ageMin !== "" || ageMax !== "";
      const matchesAgeMin = ageMin === "" || (ageValid && age >= Number(ageMin));
      const matchesAgeMax = ageMax === "" || (ageValid && age <= Number(ageMax));
      const matchesAge = !ageFilterActive || (ageValid && matchesAgeMin && matchesAgeMax);

      const name = (child.first_name || "").toLowerCase();
      const location = (child.location || "").toLowerCase();
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        name.includes(query) ||
        location.includes(query);

      return matchesStatus && matchesGender && matchesAge && matchesSearch;
    });
  }, [children, statusFilter, genderFilter, ageMin, ageMax, searchQuery]);

  return (
    <PageTransition>
      {/* Hero */}
      <section className="relative min-h-[40vh] sm:min-h-[50vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <OptimizedImage
            src="/images/kadesh images_05.jpg"
            alt="Sponsor a Child"
            className="w-full h-full object-cover"
          />
          <div className="hero-gradient absolute inset-0" />
        </div>

        <div className="relative z-10 w-full">
          <Container>
            <div className="flex flex-col items-center text-center text-white py-14 sm:py-20 md:py-24">
              <ScrollReveal>
                <span className="inline-block rounded-full bg-hope-orange/90 px-4 sm:px-5 py-1.5 sm:py-2 font-body text-xs sm:text-label-bold uppercase tracking-widest text-white mb-6 sm:mb-8">
                  Sponsor a Child
                </span>
              </ScrollReveal>
              <SectionHeading
                title="Change a Child's Future"
                subtitle="Your sponsorship provides education, nutrition, healthcare, and hope to a child in need"
                light
              />
            </div>
          </Container>
        </div>

        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            className="relative block w-[calc(100%+1.3px)] h-[40px] sm:h-[60px] md:h-[100px]"
          >
            <path
              d="M0 60L48 55C96 50 192 40 288 35C384 30 480 30 576 33.3C672 36.7 768 43.3 864 48.3C960 53.3 1056 56.7 1152 55C1248 53.3 1344 46.7 1392 43.3L1440 40V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0V60Z"
              className="fill-white"
            />
          </svg>
        </div>
      </section>

      {/* Filters + Grid */}
      <Section background="white" className="pt-10 sm:pt-16 pb-10">
        <Container>
          {/* Search */}
          <div className="max-w-xl mx-auto mb-4 sm:mb-8 px-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or location..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-soft-accent/60 bg-surface font-body text-sm sm:text-body-md text-deep-navy placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-vibrant-blue/40 focus:border-vibrant-blue transition-all"
              />
            </div>
          </div>

          {/* ---------------- MOBILE: collapsible filter trigger ---------------- */}
          <div className="sm:hidden flex items-center justify-between gap-3 mb-3">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen((v) => !v)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-soft-accent/60 bg-surface font-body text-sm font-semibold text-deep-navy active:scale-[0.98] transition-transform"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-vibrant-blue text-white text-[0.7rem] font-semibold">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-on-surface-variant transition-transform duration-300",
                  mobileFiltersOpen && "rotate-180"
                )}
              />
            </button>
            <p className="font-body text-xs text-on-surface-variant text-right">
              <span className="font-semibold text-deep-navy">{filteredChildren.length}</span> of{" "}
              <span className="font-semibold text-deep-navy">{children.length}</span> children
            </p>
          </div>

          <AnimatePresence initial={false}>
            {mobileFiltersOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="sm:hidden overflow-hidden mb-4"
              >
                <div className="rounded-2xl border border-soft-accent/60 bg-surface/60 p-4 space-y-5">
                  <div className="space-y-2">
                    <p className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                      Status
                    </p>
                    <PillGroup
                      options={STATUS_FILTERS}
                      activeValue={statusFilter}
                      counts={statusCounts}
                      onSelect={handleStatusSelect}
                      activeClass="bg-vibrant-blue text-white shadow-md"
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                      Gender
                    </p>
                    <PillGroup
                      options={GENDER_FILTERS}
                      activeValue={genderFilter}
                      counts={genderCounts}
                      onSelect={setGenderFilter}
                      activeClass="bg-deep-navy text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                      Age
                    </p>
                    <PillGroup
                      options={AGE_PRESETS}
                      activeValue={agePreset}
                      onSelect={applyAgePreset}
                      activeClass="bg-hope-orange text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                      Custom Age Range
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="18"
                        placeholder="Min"
                        value={ageMin}
                        onChange={(e) => handleAgeMinChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-soft-accent/60 bg-white font-body text-sm text-deep-navy placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-vibrant-blue/40 focus:border-vibrant-blue transition-all text-center"
                      />
                      <span className="font-body text-xs text-on-surface-variant shrink-0">to</span>
                      <input
                        type="number"
                        min="0"
                        max="18"
                        placeholder="Max"
                        value={ageMax}
                        onChange={(e) => handleAgeMaxChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-soft-accent/60 bg-white font-body text-sm text-deep-navy placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-vibrant-blue/40 focus:border-vibrant-blue transition-all text-center"
                      />
                    </div>
                  </div>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-hope-orange/40 text-hope-orange font-body text-sm font-semibold hover:bg-hope-orange/10 transition-all duration-300"
                    >
                      <X className="h-4 w-4" />
                      Clear All Filters
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ---------------- DESKTOP: inline filter bar ---------------- */}
          <div className="hidden sm:flex flex-col items-center gap-4 mb-2">
            <PillGroup
              options={STATUS_FILTERS}
              activeValue={statusFilter}
              counts={statusCounts}
              onSelect={handleStatusSelect}
              activeClass="bg-vibrant-blue text-white shadow-md"
            />

            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3">
              <PillGroup
                label="Gender:"
                options={GENDER_FILTERS}
                activeValue={genderFilter}
                counts={genderCounts}
                onSelect={setGenderFilter}
                activeClass="bg-deep-navy text-white"
              />

              <PillGroup
                label="Age:"
                options={AGE_PRESETS}
                activeValue={agePreset}
                onSelect={applyAgePreset}
                activeClass="bg-hope-orange text-white"
              />

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="18"
                  placeholder="Min"
                  value={ageMin}
                  onChange={(e) => handleAgeMinChange(e.target.value)}
                  className="w-16 px-3 py-1 rounded-full border border-soft-accent/60 bg-surface font-body text-xs text-deep-navy placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-vibrant-blue/40 focus:border-vibrant-blue transition-all text-center"
                />
                <span className="font-body text-xs text-on-surface-variant">to</span>
                <input
                  type="number"
                  min="0"
                  max="18"
                  placeholder="Max"
                  value={ageMax}
                  onChange={(e) => handleAgeMaxChange(e.target.value)}
                  className="w-16 px-3 py-1 rounded-full border border-soft-accent/60 bg-surface font-body text-xs text-deep-navy placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-vibrant-blue/40 focus:border-vibrant-blue transition-all text-center"
                />
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-hope-orange/40 text-hope-orange font-body text-xs font-semibold hover:bg-hope-orange/10 transition-all duration-300"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear Filters
                </button>
              )}
            </div>

            <p className="font-body text-sm text-on-surface-variant">
              Showing <span className="font-semibold text-deep-navy">{filteredChildren.length}</span>{" "}
              of <span className="font-semibold text-deep-navy">{children.length}</span> children
            </p>
          </div>

          {/* Children grid */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-20">
              <Loader2 className="h-10 w-10 animate-spin text-vibrant-blue mb-4" />
              <p className="font-body text-body-md text-on-surface-variant">
                Loading children...
              </p>
            </div>
          ) : filteredChildren.length === 0 ? (
            <div className="text-center py-16 sm:py-20 px-4">
              <Heart className="h-14 w-14 sm:h-16 sm:w-16 mx-auto text-on-surface-variant/30 mb-4" />
              <p className="font-body text-body-lg text-on-surface-variant">
                No children found matching your filters.
              </p>
              <p className="font-body text-body-md text-on-surface-variant/60 mt-2">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <motion.div
              key={`${statusFilter}-${genderFilter}-${agePreset}-${ageMin}-${ageMax}-${searchQuery}`}
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 lg:gap-8"
            >
              {filteredChildren.map((child) => (
                <motion.div key={child.id ?? `${child.first_name}-${child.age}`} variants={slideUp}>
                  <GlareHover className="h-full">
                    <ChildCardBoundary child={child}>
                      <ChildCard child={child} />
                    </ChildCardBoundary>
                  </GlareHover>
                </motion.div>
              ))}
            </motion.div>
          )}
        </Container>
      </Section>
    </PageTransition>
  );
}