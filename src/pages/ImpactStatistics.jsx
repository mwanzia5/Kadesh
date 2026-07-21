import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  Heart,
  ArrowRight,
  GraduationCap,
  UtensilsCrossed,
  Stethoscope,
  Rocket,
  Users,
  TrendingUp,
  CheckCircle,
  ArrowUpRight,
  Calendar,
  BookOpen,
  Activity,
  Apple,
  Briefcase,
} from "lucide-react";

import PageTransition from "@/animations/PageTransition";
import { staggerContainer, slideUp } from "@/animations/variants";

import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import ScrollReveal from "@/components/ui/ScrollReveal";
import GlareHover from "@/components/ui/GlareHover";

const STORAGE_KEY = "khm_cms_content";

function getCMSContent() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return data.impact || null;
  } catch {
    return null;
  }
}

const defaultData = {
  heroSubtitle: "These initiatives have not only transformed individual lives but also strengthened entire communities.",
  introTitle: "Our Numbers Speak for Themselves",
  introDescription: "Every statistic represents a life transformed, a family strengthened, and a community empowered. Our programs create lasting change across education, healthcare, food security, and economic development.",
  impactItems: [
    {
      icon: "Rocket",
      title: "Empowering Youth & Entrepreneurs",
      stat: 10000,
      suffix: "+",
      color: "vibrant-blue",
      description: "Over 10,000 students were directly and indirectly inspired through motivational workshops and entrepreneurial training programs, fostering innovation and leadership across colleges and institutes.",
      progress: 85,
    },
    {
      icon: "GraduationCap",
      title: "Eradicating Educational Barriers",
      stat: 300,
      suffix: "+",
      color: "hope-orange",
      description: "The Child School Program ensured 300 children from marginalized communities stayed in school, eliminating financial barriers and reducing dropout rates through sustained scholarships and support.",
      progress: 72,
    },
    {
      icon: "UtensilsCrossed",
      title: "Combating Hunger & Malnutrition",
      stat: 500,
      suffix: "+",
      color: "vibrant-blue",
      description: "The Bethlehem Bread Project provided 300–500 families weekly with daily nutritional meals, significantly improving food security and health outcomes in vulnerable households.",
      progress: 90,
    },
    {
      icon: "Stethoscope",
      title: "Healthcare Access for Vulnerable Families",
      stat: 100,
      suffix: "+",
      color: "hope-orange",
      description: "The Home Care Program delivered critical medical support to 100+ families managing chronic illnesses or disabilities, ensuring consistent care for those with underlying health conditions.",
      progress: 65,
    },
  ],
  timeline: {
    startYear: 2009,
    endYear: 2026,
    yearsLabel: "17 Years of Persistence",
    pillars: [
      { icon: "BookOpen", label: "Education", color: "vibrant-blue" },
      { icon: "Activity", label: "Health", color: "hope-orange" },
      { icon: "Apple", label: "Hunger", color: "vibrant-blue" },
      { icon: "Briefcase", label: "Empowerment", color: "hope-orange" },
    ],
  },
  summaryTitle: "Combined Impact",
  summaryDescription: "Together, our programs create a comprehensive approach to community transformation",
  summaryStats: [
    { value: "10,900+", label: "Lives Impacted" },
    { value: "4", label: "Active Programs" },
    { value: "78%", label: "Average Success Rate" },
  ],
  ctaTitle: "Help Us Reach More Communities",
  ctaDescription: "Your contribution directly impacts thousands of lives across Africa. Join us in creating lasting change through education, healthcare, and community development.",
};

const iconMap = { Rocket, GraduationCap, UtensilsCrossed, Stethoscope, BookOpen, Activity, Apple, Briefcase, Users, TrendingUp };

function AnimatedCounter({ target, suffix = "", duration = 2 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const increment = target / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [isInView, target, duration]);

  return (
    <span ref={ref} className="font-display text-5xl md:text-6xl lg:text-7xl font-bold">
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

function ProgressBar({ progress, color }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div ref={ref} className="w-full h-2 bg-surface rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={isInView ? { width: `${progress}%` } : { width: 0 }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
        className={`h-full rounded-full ${
          color === "vibrant-blue" ? "bg-vibrant-blue" : "bg-hope-orange"
        }`}
      />
    </div>
  );
}

export default function ImpactStatistics() {
  const [cms, setCms] = useState(null);

  useEffect(() => {
    setCms(getCMSContent());
  }, []);

  const data = cms || defaultData;
  const timeline = data.timeline || defaultData.timeline;
  const impactItems = data.impactItems || defaultData.impactItems;
  const summaryStats = data.summaryStats || defaultData.summaryStats;

  return (
    <PageTransition>
      <HeroSection subtitle={data.heroSubtitle} />
      <IntroSection title={data.introTitle} description={data.introDescription} />
      <TimelineSection timeline={timeline} />
      <StatsGrid items={impactItems} />
      <SummarySection title={data.summaryTitle} description={data.summaryDescription} stats={summaryStats} />
      <DonationCTA title={data.ctaTitle} description={data.ctaDescription} />
    </PageTransition>
  );
}

function HeroSection({ subtitle }) {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-deep-navy">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-vibrant-blue/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-hope-orange/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-white/5" />
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
              <span className="inline-block rounded-full bg-vibrant-blue px-5 py-2 font-body text-label-bold uppercase tracking-widest text-white">
                Our Impact
              </span>
            </motion.div>

            <div className="max-w-4xl mb-8">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="font-display text-4xl md:text-6xl lg:text-7xl font-bold leading-tight"
              >
                Impact{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-vibrant-blue to-hope-orange">
                  Statistics
                </span>
              </motion.h1>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="font-body text-body-lg md:text-xl max-w-2xl text-white/80 mb-12"
            >
              {subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button variant="lightblue" size="lg" as={Link} to="/donate">
                Support Our Mission
                <Heart className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="secondary"
                size="lg"
                as={Link}
                to="/about"
                className="border-white text-white hover:bg-white/10"
              >
                Learn More
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
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

function IntroSection({ title, description }) {
  return (
    <Section background="white" className="section-padding">
      <Container>
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-vibrant-blue/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-vibrant-blue" />
              </div>
              <span className="font-body text-label-bold text-vibrant-blue uppercase tracking-wider">
                Making a Difference
              </span>
            </div>

            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-deep-navy mb-8">
              {title}
            </h2>

            <p className="font-body text-body-lg text-on-surface leading-relaxed max-w-3xl mx-auto">
              {description}
            </p>
          </ScrollReveal>
        </div>
      </Container>
    </Section>
  );
}

function TimelineSection({ timeline }) {
  const { startYear, endYear, yearsLabel, pillars } = timeline;
  const years = [];
  for (let y = startYear; y <= endYear; y++) years.push(y);

  return (
    <Section background="white" className="py-16 lg:py-24">
      <Container>
        <ScrollReveal>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 rounded-full bg-hope-orange/10 px-5 py-2 mb-6">
              <Calendar className="h-5 w-5 text-hope-orange" />
              <span className="font-body text-label-bold text-hope-orange uppercase tracking-wider">
                {startYear} – {endYear}
              </span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-deep-navy mb-4">
              {yearsLabel}
            </h2>
            <p className="font-body text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              A journey of unwavering commitment to transforming communities across Africa
            </p>
          </div>
        </ScrollReveal>

        {/* Year ticks */}
        <ScrollReveal delay={0.2}>
          <div className="relative mb-16">
            <div className="h-1 bg-gradient-to-r from-vibrant-blue via-hope-orange to-vibrant-blue rounded-full" />
            <div className="flex justify-between mt-3">
              {years.filter((_, i) => i % 3 === 0 || years[i] === endYear).map((year) => (
                <div key={year} className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-vibrant-blue border-2 border-white shadow-md" />
                  <span className="font-body text-caption-bold text-on-surface-variant mt-2">
                    {year}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Four pillars */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {pillars.map((pillar, index) => {
            const Icon = iconMap[pillar.icon] || Rocket;
            return (
              <motion.div key={pillar.label} variants={slideUp}>
                <GlareHover className="h-full">
                  <div className={`text-center p-6 md:p-8 rounded-2xl border ${
                    pillar.color === "vibrant-blue"
                      ? "bg-vibrant-blue/5 border-vibrant-blue/20"
                      : "bg-hope-orange/5 border-hope-orange/20"
                  } h-full`}>
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                      pillar.color === "vibrant-blue"
                        ? "bg-vibrant-blue/10"
                        : "bg-hope-orange/10"
                    }`}>
                      <Icon className={`h-8 w-8 ${
                        pillar.color === "vibrant-blue"
                          ? "text-vibrant-blue"
                          : "text-hope-orange"
                      }`} />
                    </div>
                    <h3 className="font-display text-lg md:text-xl font-bold text-deep-navy mb-1">
                      {pillar.label}
                    </h3>
                    <span className="font-body text-caption text-on-surface-variant">
                      {startYear} – {endYear}
                    </span>
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

function StatsGrid({ items }) {
  const iconMapLocal = { Rocket, GraduationCap, UtensilsCrossed, Stethoscope };

  return (
    <Section background="gray" className="section-padding">
      <Container>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {items.map((item) => {
            const Icon = iconMapLocal[item.icon] || Rocket;
            return (
              <motion.div key={item.title} variants={slideUp}>
                <GlareHover className="h-full">
                  <div className="bg-white rounded-2xl p-8 border border-soft-accent/50 shadow-card hover:shadow-card-hover transition-shadow duration-300 h-full">
                    <div className="flex items-start justify-between mb-6">
                      <div
                        className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                          item.color === "vibrant-blue"
                            ? "bg-vibrant-blue/10"
                            : "bg-hope-orange/10"
                        }`}
                      >
                        <Icon
                          className={`h-7 w-7 ${
                            item.color === "vibrant-blue"
                              ? "text-vibrant-blue"
                              : "text-hope-orange"
                          }`}
                        />
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-body text-caption font-medium ${
                          item.color === "vibrant-blue"
                            ? "bg-vibrant-blue/10 text-vibrant-blue"
                            : "bg-hope-orange/10 text-hope-orange"
                        }`}
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Active Program
                      </span>
                    </div>

                    <h3 className="font-display text-xl md:text-2xl text-deep-navy mb-4">
                      {item.title}
                    </h3>

                    <div
                      className={`mb-4 ${
                        item.color === "vibrant-blue"
                          ? "text-vibrant-blue"
                          : "text-hope-orange"
                      }`}
                    >
                      <AnimatedCounter target={item.stat} suffix={item.suffix} />
                    </div>

                    <p className="font-body text-body-md text-on-surface-variant mb-6 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-body text-caption text-on-surface-variant">
                          Impact Progress
                        </span>
                        <span
                          className={`font-body text-caption-bold ${
                            item.color === "vibrant-blue"
                              ? "text-vibrant-blue"
                              : "text-hope-orange"
                          }`}
                        >
                          {item.progress}%
                        </span>
                      </div>
                      <ProgressBar progress={item.progress} color={item.color} />
                    </div>
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

function SummarySection({ title, description, stats }) {
  const summaryIcons = [Users, GraduationCap, TrendingUp];

  return (
    <Section background="white" className="section-padding">
      <Container>
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl text-deep-navy mb-4">
              {title}
            </h2>
            <p className="font-body text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              {description}
            </p>
          </div>
        </ScrollReveal>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {stats.map((stat, index) => (
            <motion.div key={stat.label} variants={slideUp}>
              <GlareHover className="h-full">
                <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-deep-navy to-vibrant-blue/90 text-white shadow-card h-full">
                  <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-5">
                    {(() => { const Ic = summaryIcons[index] || Users; return <Ic className="h-8 w-8 text-white" />; })()}
                  </div>
                  <div className="font-display text-4xl md:text-5xl font-bold mb-3">
                    {stat.value}
                  </div>
                  <p className="font-body text-body-lg text-white/80">{stat.label}</p>
                </div>
              </GlareHover>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  );
}

function DonationCTA({ title, description }) {
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden bg-deep-navy">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-hope-orange/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-vibrant-blue/10 blur-3xl" />
      </div>

      <Container className="relative z-10">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="font-display text-3xl md:text-5xl text-white mb-6">
              {title}
            </h2>
            <p className="font-body text-body-lg text-white/70 mb-10 leading-relaxed">
              {description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="lightblue" size="lg" as={Link} to="/donate">
                Donate Now
                <Heart className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="secondary"
                size="lg"
                as={Link}
                to="/contact"
                className="border-white text-white hover:bg-white/10"
              >
                Get Involved
                <ArrowUpRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}
