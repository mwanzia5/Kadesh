import { useParams, Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Heart,
  MapPin,
  Calendar,
  ArrowLeft,
  Loader2,
} from "lucide-react";

import PageTransition from "@/animations/PageTransition";
import { slideUp } from "@/animations/variants";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import OptimizedImage from "@/components/ui/OptimizedImage";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { useChild } from "@/hooks/useChildren";
import { cn } from "@/lib/utils";

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
        styles[status] || "bg-gray-100 text-gray-600"
      )}
    >
      {status}
    </span>
  );
}

export default function ChildProfile() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { data, isLoading, error } = useChild(id);

  const child = data?.data;

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

  const sponsorLink = `/donate?child_id=${child.id}&child_name=${encodeURIComponent(child.first_name)}&purpose=sponsorship`;

  return (
    <PageTransition>
      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-end overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-deep-navy via-vibrant-blue/90 to-deep-navy">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-[10%] w-64 h-64 rounded-full bg-hope-orange/30 blur-3xl" />
            <div className="absolute bottom-10 right-[15%] w-80 h-80 rounded-full bg-vibrant-blue/30 blur-3xl" />
          </div>
        </div>

        <div className="relative z-10 w-full">
          <Container>
            <div className="pt-32 pb-16">
              <Link
                to="/sponsor-a-child"
                className="inline-flex items-center gap-2 font-body text-sm font-medium text-white/60 hover:text-white transition-colors mb-8"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sponsor a Child
              </Link>
            </div>
          </Container>
        </div>
      </section>

      {/* Profile */}
      <Section background="white" className="pt-0 pb-16 -mt-16 relative z-10">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Photo + quick info */}
            <ScrollReveal direction="left" className="lg:col-span-5">
              <div className="bg-white rounded-2xl overflow-hidden shadow-card border border-soft-accent/50">
                <div className="aspect-[3/4] overflow-hidden">
                  {child.photo_url ? (
                    <OptimizedImage
                      src={child.photo_url}
                      alt={child.first_name}
                      className="w-full h-full object-cover"
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
                    <Button
                      variant="orange"
                      size="lg"
                      as={Link}
                      to={sponsorLink}
                      className="w-full"
                    >
                      Sponsor This Child
                      <Heart className="ml-2 h-5 w-5" />
                    </Button>
                  ) : (
                    <div className="w-full py-3 text-center rounded-xl bg-gray-100 font-body text-sm font-medium text-on-surface-variant">
                      {child.sponsorship_status === "sponsored"
                        ? "This child is already sponsored"
                        : "Sponsorship pending"}
                    </div>
                  )}
                </div>
              </div>
            </ScrollReveal>

            {/* Story / Bio */}
            <ScrollReveal direction="right" className="lg:col-span-7">
              <div className="lg:sticky lg:top-8">
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
                    This child&rsquo;s story is being prepared. Check back soon
                    to learn more about {child.first_name}.
                  </p>
                )}

                <div className="mt-10 p-6 rounded-xl bg-surface border border-soft-accent/50">
                  <h3 className="font-display text-headline-md text-deep-navy mb-3">
                    What Your Sponsorship Provides
                  </h3>
                  <ul className="space-y-3">
                    {[
                      "Quality education and school supplies",
                      "Nutritious meals and clean water",
                      "Healthcare and medical checkups",
                      "Mentorship and emotional support",
                      "A safe and nurturing environment",
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

                {child.sponsorship_status === "available" && (
                  <motion.div
                    variants={slideUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="mt-8"
                  >
                    <Button
                      variant="orange"
                      size="lg"
                      as={Link}
                      to={sponsorLink}
                      className="w-full"
                    >
                      Sponsor {child.first_name} Today
                      <Heart className="ml-2 h-5 w-5" />
                    </Button>
                  </motion.div>
                )}
              </div>
            </ScrollReveal>
          </div>
        </Container>
      </Section>
    </PageTransition>
  );
}
