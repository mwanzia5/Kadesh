import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, MapPin, Calendar, Search, Loader2 } from "lucide-react";

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

export default function SponsorAChild() {
  const [statusFilter, setStatusFilter] = useState("All");
  const [genderFilter, setGenderFilter] = useState("All");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { data: childrenData, isLoading } = useChildren();

  const children = childrenData?.data ?? [];

  const filteredChildren = useMemo(() => {
    return children.filter((child) => {
      const matchesStatus =
        statusFilter === "All" ||
        child.sponsorship_status === statusFilter.toLowerCase();

      const matchesGender =
        genderFilter === "All" ||
        child.gender === genderFilter.toLowerCase();

      const age = Number(child.age);
      const matchesAgeMin = ageMin === "" || age >= Number(ageMin);
      const matchesAgeMax = ageMax === "" || age <= Number(ageMax);

      const matchesSearch =
        searchQuery === "" ||
        child.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        child.location.toLowerCase().includes(searchQuery.toLowerCase());

      return (
        matchesStatus &&
        matchesGender &&
        matchesAgeMin &&
        matchesAgeMax &&
        matchesSearch
      );
    });
  }, [children, statusFilter, genderFilter, ageMin, ageMax, searchQuery]);

  const highlight =
    statusFilter === "All" ? null : statusFilter;

  return (
    <PageTransition>
      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-deep-navy via-vibrant-blue/90 to-deep-navy">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-[10%] w-64 h-64 rounded-full bg-hope-orange/30 blur-3xl" />
            <div className="absolute bottom-10 right-[15%] w-80 h-80 rounded-full bg-vibrant-blue/30 blur-3xl" />
          </div>
        </div>

        <div className="relative z-10 w-full">
          <Container>
            <div className="flex flex-col items-center text-center text-white py-24">
              <ScrollReveal>
                <span className="inline-block rounded-full bg-hope-orange/90 px-5 py-2 font-body text-label-bold uppercase tracking-widest text-white mb-8">
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
            className="relative block w-[calc(100%+1.3px)] h-[60px] md:h-[100px]"
          >
            <path
              d="M0 60L48 55C96 50 192 40 288 35C384 30 480 30 576 33.3C672 36.7 768 43.3 864 48.3C960 53.3 1056 56.7 1152 55C1248 53.3 1344 46.7 1392 43.3L1440 40V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0V60Z"
              className="fill-white"
            />
          </svg>
        </div>
      </section>

      {/* Filters + Grid */}
      <Section background="white" className="pt-16 pb-10">
        <Container>
          {/* Search */}
          <div className="max-w-xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or location..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-soft-accent/60 bg-surface font-body text-body-md text-deep-navy placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-vibrant-blue/40 focus:border-vibrant-blue transition-all"
              />
            </div>
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap justify-center gap-3 mb-4">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-5 py-2 rounded-full font-body text-label-bold transition-all duration-300",
                  statusFilter === status
                    ? "bg-vibrant-blue text-white shadow-md"
                    : "bg-surface-variant/40 text-on-surface-variant hover:bg-surface-variant hover:text-deep-navy"
                )}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap justify-center items-center gap-4 mb-12">
            <div className="flex items-center gap-2">
              <span className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Gender:
              </span>
              {GENDER_FILTERS.map((g) => (
                <button
                  key={g}
                  onClick={() => setGenderFilter(g)}
                  className={cn(
                    "px-3 py-1 rounded-full font-body text-xs font-medium transition-all duration-300",
                    genderFilter === g
                      ? "bg-deep-navy text-white"
                      : "bg-surface-variant/40 text-on-surface-variant hover:bg-surface-variant hover:text-deep-navy"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Age:
              </span>
              <input
                type="number"
                min="0"
                max="18"
                placeholder="Min"
                value={ageMin}
                onChange={(e) => setAgeMin(e.target.value)}
                className="w-16 px-3 py-1 rounded-full border border-soft-accent/60 bg-surface font-body text-xs text-deep-navy placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-vibrant-blue/40 focus:border-vibrant-blue transition-all text-center"
              />
              <span className="font-body text-xs text-on-surface-variant">to</span>
              <input
                type="number"
                min="0"
                max="18"
                placeholder="Max"
                value={ageMax}
                onChange={(e) => setAgeMax(e.target.value)}
                className="w-16 px-3 py-1 rounded-full border border-soft-accent/60 bg-surface font-body text-xs text-deep-navy placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-vibrant-blue/40 focus:border-vibrant-blue transition-all text-center"
              />
            </div>
          </div>

          {/* Children grid */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-vibrant-blue mb-4" />
              <p className="font-body text-body-md text-on-surface-variant">
                Loading children...
              </p>
            </div>
          ) : filteredChildren.length === 0 ? (
            <div className="text-center py-20">
              <Heart className="h-16 w-16 mx-auto text-on-surface-variant/30 mb-4" />
              <p className="font-body text-body-lg text-on-surface-variant">
                No children found matching your filters.
              </p>
              <p className="font-body text-body-md text-on-surface-variant/60 mt-2">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            >
              {filteredChildren.map((child) => (
                <motion.div key={child.id} variants={slideUp}>
                  <GlareHover className="h-full">
                    <Link
                      to={`/sponsor-a-child/${child.id}`}
                      className="group flex flex-col h-full rounded-xl overflow-hidden bg-white border border-soft-accent/50 shadow-card hover:shadow-card-hover transition-shadow duration-300"
                    >
                      <div className="relative overflow-hidden aspect-[3/4]">
                        {child.photo_url ? (
                          <OptimizedImage
                            src={child.photo_url}
                            alt={child.first_name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-vibrant-blue/20 to-hope-orange/20 flex items-center justify-center">
                            <span className="font-display text-5xl font-bold text-vibrant-blue/30">
                              {child.first_name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="absolute top-4 right-4">
                          <StatusBadge status={child.sponsorship_status} />
                        </div>
                      </div>

                      <div className="flex flex-col flex-1 p-5">
                        <h3 className="font-display text-headline-md text-deep-navy mb-2 group-hover:text-vibrant-blue transition-colors">
                          {child.first_name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <span className="inline-flex items-center gap-1 font-body text-xs text-on-surface-variant">
                            <Calendar className="h-3.5 w-3.5" />
                            Age {child.age}
                          </span>
                          <span className="inline-flex items-center gap-1 font-body text-xs text-on-surface-variant">
                            <MapPin className="h-3.5 w-3.5" />
                            {child.location}
                          </span>
                        </div>
                        {child.bio && (
                          <p className="font-body text-body-sm text-on-surface-variant line-clamp-2 mb-3">
                            {child.bio}
                          </p>
                        )}
                        <span className="mt-auto inline-flex items-center gap-1.5 font-body text-label-bold text-vibrant-blue">
                          View Profile
                          <Heart className="h-4 w-4" />
                        </span>
                      </div>
                    </Link>
                  </GlareHover>
                </motion.div>
              ))}
            </motion.div>
          )}
        </Container>
      </Section>

      {/* CTA */}
      <section className="relative py-20 lg:py-28 overflow-hidden bg-deep-navy">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-vibrant-blue/10 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-hope-orange/10 blur-3xl" />
        </div>

        <Container className="relative z-10">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="font-display text-3xl md:text-5xl lg:text-display-lg-mobile text-white mb-6">
                Every Child Deserves a Chance
              </h2>
              <p className="font-body text-body-lg text-white/70 mb-10 leading-relaxed">
                Your sponsorship provides education, healthcare, nutrition, and
                a future filled with hope. Choose a child today and transform a
                life forever.
              </p>
              <Button variant="lightblue" size="lg" as={Link} to="/donate">
                Donate Now
                <Heart className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </ScrollReveal>
        </Container>
      </section>
    </PageTransition>
  );
}
