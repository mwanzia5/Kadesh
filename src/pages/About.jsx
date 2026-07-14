import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  Target,
  Eye,
  School,
  Heart,
  UtensilsCrossed,
  Rocket,
  Users,
  ArrowRight,
  Quote,
} from "lucide-react";

import PageTransition from "@/animations/PageTransition";
import {
  staggerContainer,
  slideUp,
  slideLeft,
  slideRight,
} from "@/animations/variants";
import { TIMELINE, MINISTRY_AREAS } from "@/constants";

import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import OptimizedImage from "@/components/ui/OptimizedImage";
import GlareHover from "@/components/ui/GlareHover";
import SplitText from "@/components/ui/SplitText";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import ScrollReveal from "@/components/ui/ScrollReveal";
import SectionHeading from "@/components/ui/SectionHeading";

const ministryIcons = {
  School,
  Heart,
  UtensilsCrossed,
  Rocket,
  Users,
};

export default function About() {
  return (
    <PageTransition>
      <HeroSection />
      <StorySection />
      <MissionVisionSection />
      <MinistryAreasSection />
      <TimelineSection />
      <CTASection />
    </PageTransition>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <OptimizedImage
          src="/images/kadesh images_03.png"
          alt="Kadesh Hope Mission community"
          className="w-full h-full object-cover"
        />
        <div className="hero-gradient absolute inset-0" />
      </div>

      <div className="relative z-10 w-full">
        <Container>
          <div className="flex flex-col items-center text-center text-white py-32">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8"
            >
              <span className="inline-block rounded-full bg-hope-orange px-5 py-2 font-body text-label-bold uppercase tracking-widest text-white">
                EST. 2009
              </span>
            </motion.div>

            <div className="max-w-4xl mb-8">
              <SplitText
                text="Wisdom guided by empathy"
                className="font-display text-4xl md:text-6xl lg:text-7xl font-bold leading-tight block"
                delay={0.5}
                duration={0.8}
                stagger={0.02}
              />
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="font-body text-body-lg md:text-xl max-w-2xl text-white/80 mb-10"
            >
              In 2009, a group of young people migrated from India to the
              Democratic Republic of Congo with a bold vision &mdash; to uplift
              impoverished communities through compassion, education, and
              holistic development. That journey marked the beginning of Kadesh
              Hope Mission.
            </motion.p>
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
  );
}

function StorySection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <Section background="white" className="section-padding overflow-hidden">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div ref={sectionRef} className="lg:col-span-7">
            <ScrollReveal direction="left">
              <div className="flex flex-col sm:flex-row gap-8 mb-10">
                <div>
                  <div className="font-display text-4xl md:text-5xl font-bold text-vibrant-blue mb-2">
                    {isInView && (
                      <AnimatedCounter end={15} suffix="+" duration={2000} />
                    )}
                  </div>
                  <p className="font-body text-body-lg text-on-surface-variant">
                    Years of Service
                  </p>
                </div>
                <div>
                  <div className="font-display text-4xl md:text-5xl font-bold text-hope-orange mb-2">
                    {isInView && (
                      <AnimatedCounter end={10} suffix="k+" duration={2000} />
                    )}
                  </div>
                  <p className="font-body text-body-lg text-on-surface-variant">
                    Lives Impacted
                  </p>
                </div>
              </div>

              <p className="font-body text-body-lg text-on-surface leading-relaxed mb-6">
                Kadesh Hope Mission was born from a simple yet radical idea &mdash;
                that young people, driven by faith and empathy, could cross
                continents to serve communities in need. In 2009, our founders
                left India for the Democratic Republic of Congo, carrying nothing
                but a vision for holistic transformation.
              </p>
              <p className="font-body text-body-lg text-on-surface leading-relaxed">
                Today, that vision has grown into a multi-national movement
                spanning Uganda, Kenya, and the DRC. Through education,
                healthcare, food security, and community empowerment, we continue
                to honor the founding spirit &mdash; meeting people where they are
                and walking alongside them toward a brighter future.
              </p>
            </ScrollReveal>
          </div>

          <div className="lg:col-span-5">
            <ScrollReveal direction="right">
              <div className="relative">
                <div className="rounded-2xl overflow-hidden shadow-card">
                  <OptimizedImage
                    src="/images/kadesh images_03.jpg"
                    alt="Kadesh Hope Mission story"
                    className="w-full aspect-[4/3] object-cover"
                  />
                </div>

                <div className="absolute -bottom-6 -left-4 md:left-6 lg:-left-8 z-10 w-[85%] md:w-auto">
                  <div className="glass-card rounded-xl p-5 md:p-6 shadow-glass">
                    <Quote className="h-8 w-8 text-hope-orange mb-3 opacity-60" />
                    <p className="font-display text-body-lg text-deep-navy italic leading-relaxed">
                      &ldquo;Hope is not a sentiment; it is a strategy for
                      survival and progress.&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function MissionVisionSection() {
  return (
    <Section background="gray" className="section-padding">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ScrollReveal direction="left">
            <div className="relative h-full rounded-2xl bg-white border border-soft-accent/50 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-vibrant-blue to-vibrant-blue/40" />
              <div className="p-8 md:p-10">
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-vibrant-blue/10 text-vibrant-blue mb-6">
                  <Target className="h-7 w-7" />
                </div>
                <h3 className="font-display text-headline-md text-deep-navy mb-4">
                  Mission Statement
                </h3>
                <p className="font-body text-body-lg text-on-surface-variant leading-relaxed">
                  Our mission is to transform lives and uplift communities in
                  Uganda and Kenya through holistic gospel outreach.
                </p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right">
            <div className="relative h-full rounded-2xl bg-white border border-soft-accent/50 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-hope-orange to-hope-orange/40" />
              <div className="p-8 md:p-10">
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-hope-orange/10 text-hope-orange mb-6">
                  <Eye className="h-7 w-7" />
                </div>
                <h3 className="font-display text-headline-md text-deep-navy mb-4">
                  Vision Statement
                </h3>
                <p className="font-body text-body-lg text-on-surface-variant leading-relaxed">
                  To create thriving, self-sustaining communities in Africa where
                  every individual has access to spiritual as well as physical
                  needs.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </Container>
    </Section>
  );
}

function MinistryAreasSection() {
  return (
    <Section background="white" className="section-padding">
      <Container>
        <SectionHeading
          title="How We Serve"
          subtitle="Our ministry areas address the most critical needs"
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {MINISTRY_AREAS.map((area) => {
            const Icon = ministryIcons[area.icon];

            return (
              <motion.div key={area.title} variants={slideUp}>
                <GlareHover
                  glareColor={
                    area.icon === "Heart" || area.icon === "Rocket"
                      ? "#F37021"
                      : "#2563EB"
                  }
                  className="h-full"
                >
                  <div className="flex flex-col p-6 rounded-xl bg-white border border-soft-accent/50 h-full transition-shadow duration-300 hover:shadow-card">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-vibrant-blue/10 text-vibrant-blue mb-5">
                      {Icon && <Icon className="h-6 w-6" />}
                    </div>
                    <h3 className="font-display text-headline-sm text-deep-navy mb-3">
                      {area.title}
                    </h3>
                    <p className="font-body text-body-md text-on-surface-variant leading-relaxed">
                      {area.description}
                    </p>
                  </div>
                </GlareHover>
              </motion.div>
            );
          })}
        </motion.div>
      </Container>
    </Section>
  );
}

function TimelineSection() {
  return (
    <Section background="navy" className="section-padding overflow-hidden">
      <Container>
        <SectionHeading
          title="A Legacy of Persistence"
          subtitle="Key milestones in our journey of transformation"
          light
        />

        <div className="relative mt-16">
          <div className="absolute left-5 md:left-1/2 top-0 bottom-0 w-px bg-white/20 md:-translate-x-px" />

          {TIMELINE.map((entry, index) => {
            const isLeft = index % 2 === 0;

            return (
              <ScrollReveal
                key={entry.year}
                direction={isLeft ? "left" : "right"}
                delay={index * 0.15}
                className="relative mb-12 last:mb-0"
              >
                <div
                  className={`flex items-start gap-6 md:gap-0 ${
                    isLeft
                      ? "md:flex-row"
                      : "md:flex-row-reverse"
                  }`}
                >
                  <div className="md:w-1/2 md:px-12">
                    <div
                      className={`inline-block rounded-full bg-hope-orange px-4 py-1.5 font-body text-label-bold text-white mb-3`}
                    >
                      {entry.year}
                    </div>
                    <h3 className="font-display text-headline-md text-white mb-2">
                      {entry.title}
                    </h3>
                    <p className="font-body text-body-md text-white/70 leading-relaxed">
                      {entry.description}
                    </p>
                  </div>

                  <div className="hidden md:flex md:w-1/2 items-start justify-center relative">
                    <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-hope-orange border-4 border-deep-navy z-10" />
                  </div>
                </div>

                <div className="md:hidden absolute left-5 top-1 w-4 h-4 rounded-full bg-hope-orange border-4 border-deep-navy z-10 -translate-x-1/2" />
              </ScrollReveal>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

function CTASection() {
  return (
    <section className="bg-deep-navy rounded-2xl mx-5 my-5 overflow-hidden">
      <div className="relative py-20 lg:py-28">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-vibrant-blue/10 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-hope-orange/10 blur-3xl" />
        </div>

        <Container className="relative z-10">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="font-display text-3xl md:text-5xl text-white mb-6">
                Ready to make a difference?
              </h2>
              <p className="font-body text-body-lg text-white/70 mb-10 leading-relaxed">
                Join us in transforming lives across Africa. Whether through your
                time, skills, or generosity, every contribution builds a brighter
                future.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="secondary" size="lg" as={Link} to="/contact">
                  Get Involved
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button variant="orange" size="lg" as={Link} to="/donate">
                  Donate
                  <Heart className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </div>
    </section>
  );
}
