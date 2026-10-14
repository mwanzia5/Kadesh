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
  CheckCircle,
  Target,
  Eye,
  School,
  Handshake,
  Building2,
  Church,
  UserCheck,
  Quote,
  Sparkles,
  Globe2,
} from "lucide-react";

import PageTransition from "@/animations/PageTransition";
import { staggerContainer, slideUp } from "@/animations/variants";
import { TIMELINE } from "@/constants";

import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import OptimizedImage from "@/components/ui/OptimizedImage";
import GlareHover from "@/components/ui/GlareHover";
import SEO from "@/components/ui/SEO";
import { getCMSContent, useCMSReady } from "@/hooks/useCMS";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import ScrollReveal from "@/components/ui/ScrollReveal";
import SectionHeading from "@/components/ui/SectionHeading";

const ministryIcons = { School, Heart, UtensilsCrossed, Rocket, Users };

const ABOUT_MINISTRY_AREAS = [
  {
    title: "Education",
    icon: "School",
    description:
      "We expand access to learning by supporting schools, students, and education-focused initiatives that help children remain in school, develop confidence, and build pathways toward a more secure future.",
    emphasis: "Access • Learning • Opportunity",
  },
  {
    title: "Health & Home Care",
    icon: "Heart",
    description:
      "We respond to health needs through compassionate community and home-based support, helping vulnerable individuals and families receive practical care, ongoing assistance, and greater continuity of support.",
    emphasis: "Care • Dignity • Continuity",
  },
  {
    title: "Social Development",
    icon: "UtensilsCrossed",
    description:
      "We strengthen families facing food insecurity through nutrition and practical support, addressing immediate needs while helping communities move toward greater stability, resilience, and wellbeing.",
    emphasis: "Nutrition • Stability • Community Wellbeing",
  },
];

const APPROACH_PILLARS = [
  {
    number: "01",
    title: "Compassion with purpose",
    description:
      "We respond to urgent needs with dignity while keeping long-term wellbeing at the center of every program and partnership.",
  },
  {
    number: "02",
    title: "Holistic transformation",
    description:
      "Our work connects education, health, nutrition, faith, and community support because lasting change rarely comes from addressing one need in isolation.",
  },
  {
    number: "03",
    title: "Partnership that multiplies impact",
    description:
      "We work through collaboration, shared responsibility, and sustained relationships so that support can extend beyond individuals and strengthen entire communities.",
  },
];

const IMPACT_ITEMS = [
  {
    icon: "Rocket",
    title: "Empowering Youth & Entrepreneurs",
    stat: 10000,
    suffix: "+",
    color: "vibrant-blue",
    description:
      "Over 10,000 students were directly and indirectly inspired through motivational workshops and entrepreneurial training programs, fostering innovation and leadership across colleges and institutes.",
    progress: 85,
  },
  {
    icon: "GraduationCap",
    title: "Eradicating Educational Barriers",
    stat: 300,
    suffix: "+",
    color: "hope-orange",
    description:
      "The Child School Program ensured 300 children from marginalized communities stayed in school, eliminating financial barriers and reducing dropout rates through sustained scholarships and support.",
    progress: 72,
  },
  {
    icon: "UtensilsCrossed",
    title: "Food Security & Malnutrition",
    stat: 500,
    suffix: "+",
    color: "vibrant-blue",
    description:
      "The Bethlehem Bread Project provided 300–500 families weekly with daily nutritional meals, significantly improving food security and health outcomes in vulnerable households.",
    progress: 90,
  },
  {
    icon: "Stethoscope",
    title: "Healthcare Access for Vulnerable Families",
    stat: 100,
    suffix: "+",
    color: "hope-orange",
    description:
      "The Home Care Program delivered critical medical support to 100+ families managing chronic illnesses or disabilities, ensuring consistent care for those with underlying health conditions.",
    progress: 65,
  },
];

const TEAM_MEMBERS = [
  { name: "Mr. Titus", role: "Executive Director", image: "/images/Team/Team_2.jpeg", imagePosition: "50% 16%" },
  { name: "Mr. Obula Puli", role: "Deputy Director, Missions", image: "/images/Team/Team_3.jpeg", imagePosition: "50% 14%" },
  {
    name: "Mr. Balaji Doddapanni",
    role: "Director, Social Development Programs — Heading Livelihood and Home Care Infrastructure Projects",
    image: "/images/Team/Team_4.jpeg",
    imagePosition: "50% 12%",
  },
  { name: "Miss Sirisha Govindu", role: "Administration, Mission", image: "/images/Team/Team_5.jpeg", imagePosition: "50% 10%" },
  {
    name: "Dr. Lydia",
    role: "Director, Health Programs Development — Community, Health and Wellness Department",
    image: "/images/Team/Team_6.jpg",
    imagePosition: "50% 8%",
  },
  {
    name: "Bhargavi Induri",
    role: "Director, Education and Welfare — Child and Women Empowerment Department",
    image: "/images/Team/Team_1.jpeg",
    imagePosition: "50% 8%",
  },
];

const PARTNERSHIP_TYPES = [
  {
    icon: Building2,
    title: "Corporate Partnership",
    description:
      "Align your brand with meaningful impact. Corporate partners gain purpose-driven visibility while funding sustainable community programs.",
  },
  {
    icon: Handshake,
    title: "NGO Collaboration",
    description:
      "Pool resources and expertise with fellow organizations to amplify reach and deliver measurable outcomes across communities.",
  },
  {
    icon: Church,
    title: "Faith-Based Partnership",
    description:
      "Unite in mission and ministry. Faith-based partners support gospel outreach and holistic development across Africa.",
  },
  {
    icon: UserCheck,
    title: "Individual Sponsorship",
    description:
      "Make a personal difference. Individual sponsors directly fund children, schools, and health programs in underserved regions.",
  },
];

export default function AboutUs() {
  useCMSReady();

  return (
    <PageTransition>
      <SEO
        title="About Us"
        description="Learn about Kadesh Hope Mission - founded in 2009, transforming lives across DR Congo, Uganda and Kenya through education, healthcare, and food security."
      />
      <main className="overflow-hidden bg-[#fffdf8]">
        <HeroSection />
        <StorySection />
        <MissionVisionSection />
        <ApproachSection />
        <MinistryAreasSection />
        <ImpactStatsSection />
        <TeamSection />
        <LegacyTimelineSection />
        <AboutPartnershipSection />
        <PartnersSection />
        <FinalCTASection />
      </main>
    </PageTransition>
  );
}

function HeroSection() {
  return (
    <section className="relative isolate min-h-[78vh] overflow-hidden bg-[#0b2340]">
      <div className="absolute inset-0">
        <OptimizedImage
          src="/images/child to school/child project_3.png"
          alt="Kadesh Hope Mission community"
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(5,22,42,.94)_0%,rgba(5,22,42,.82)_42%,rgba(5,22,42,.26)_75%,rgba(5,22,42,.38)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(205,153,30,.22),transparent_36%)]" />
      </div>

      <div className="absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-[#0b2340]/70 to-transparent" />
      <div className="absolute -right-16 -top-12 h-64 w-64 rounded-full border border-white/20" />
      <div className="absolute -right-4 top-16 h-44 w-44 rounded-full border border-[#d0a338]/20" />

      <Container className="relative z-10">
        <div className="flex min-h-[78vh] items-center py-28 lg:py-32">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f2d486] backdrop-blur-sm"
            >
              <Sparkles className="h-4 w-4" />
              EST. 2009
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.2 }}
              className="max-w-3xl text-balance font-display text-[2.8rem] font-bold leading-[1.03] tracking-[-0.035em] text-white sm:text-6xl lg:text-[4.55rem]"
            >
              Wisdom Guided by <span className="whitespace-nowrap">Empathy</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.75 }}
              className="mt-6 max-w-2xl font-body text-base leading-8 text-white/[0.82] sm:text-lg"
            >
              {getCMSContent(
                "about",
                "heroSubtitle",
                "In 2009, a group of young people migrated from India to the Democratic Republic of Congo with a bold vision — to uplift impoverished communities through compassion, education, and holistic development. That journey marked the beginning of Kadesh Hope Mission."
              )}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.95 }}
              className="mt-9 flex flex-wrap gap-3"
            >
              <a
                href="#our-story"
                className="inline-flex items-center gap-2 rounded-full bg-[#c38a00] px-6 py-3.5 font-body text-sm font-bold text-white shadow-[0_14px_30px_rgba(195,138,0,.28)] transition hover:-translate-y-0.5 hover:bg-[#a97600]"
              >
                Discover our story
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3.5 font-body text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/15"
              >
                Connect with us
              </Link>
            </motion.div>
          </div>

        </div>
      </Container>

      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
        <svg viewBox="0 0 1440 100" preserveAspectRatio="none" className="block h-[56px] w-[calc(100%+1.3px)] sm:h-[76px]">
          <path d="M0 50C220 86 422 10 650 36C875 62 1056 88 1440 28V100H0Z" fill="#fffdf8" />
        </svg>
      </div>
    </section>
  );
}

function StorySection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px 0px" });

  return (
    <section id="our-story" className="relative py-16 sm:py-20 lg:py-24">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
          <div ref={sectionRef}>
            <ScrollReveal direction="left">
              <p className="font-body text-xs font-bold uppercase tracking-[0.2em] text-[#a7770c]">Our beginning</p>
              <h2 className="mt-3 max-w-2xl font-display text-4xl font-bold leading-tight tracking-[-0.02em] text-deep-navy sm:text-5xl">
                A Mission That Began with One Courageous Step
              </h2>

              <div className="mt-7 space-y-5 font-body text-base leading-8 text-[#625a4d] sm:text-lg">
                <p>
                  Kadesh Hope Mission began in 2009 when a group of young people traveled from India to the Democratic Republic of Congo with a conviction that compassion must become practical action. What started as a step of faith grew into a long-term commitment to serve people facing barriers in education, health, nutrition, and everyday opportunity.
                </p>
                <p>
                  Today, the mission continues across the Democratic Republic of Congo, Uganda, and Kenya. Our work is rooted in holistic development: responding to immediate needs while also strengthening the conditions that allow children, families, and communities to move forward with greater dignity, stability, and hope.
                </p>
                <p>
                  We believe meaningful transformation is built through presence, consistency, and partnership. For that reason, our programs are designed not as isolated acts of assistance, but as connected efforts that support education, healthcare, food security, community wellbeing, and faith-driven service over time.
                </p>
              </div>

              <div className="mt-9 grid max-w-xl grid-cols-2 overflow-hidden rounded-[1.4rem] border border-[#eadfc8] bg-white shadow-[0_14px_38px_rgba(60,46,20,.06)]">
                <div className="p-5 sm:p-6">
                  <div className="font-display text-4xl font-bold text-deep-navy sm:text-5xl">
                    {isInView && <AnimatedCounter end={15} suffix="+" duration={1800} />}
                  </div>
                  <p className="mt-1 font-body text-sm text-[#766d5f]">Years of Service</p>
                </div>
                <div className="border-l border-[#eadfc8] p-5 sm:p-6">
                  <div className="font-display text-4xl font-bold text-[#b47d00] sm:text-5xl">
                    {isInView && <AnimatedCounter end={10} suffix="k+" duration={1800} />}
                  </div>
                  <p className="mt-1 font-body text-sm text-[#766d5f]">Lives Impacted</p>
                </div>
              </div>
            </ScrollReveal>
          </div>

          <ScrollReveal direction="right">
            <div className="relative mx-auto max-w-[570px]">
              <div className="overflow-hidden rounded-[2rem] border border-[#eadfc8] bg-white p-2 shadow-[0_22px_54px_rgba(31,39,51,.12)]">
                <OptimizedImage
                  src="/Egypt/IMG-20250628-WA0072.jpg"
                  alt="Kadesh Hope Mission story"
                  className="h-auto w-full rounded-[1.55rem] object-contain"
                />
              </div>
              <div className="relative -mt-10 ml-auto mr-4 w-[88%] rounded-[1.4rem] border border-[#eadfc8] bg-[#fffaf0] p-5 shadow-[0_12px_34px_rgba(68,51,19,.12)] sm:mr-8 sm:w-[82%] sm:p-6">
                <Quote className="mb-3 h-7 w-7 text-[#c38a00]" />
                <p className="font-display text-lg italic leading-7 text-deep-navy sm:text-xl">
                  “Hope is not a sentiment; it is a strategy for survival and progress.”
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </Container>
    </section>
  );
}

function MissionVisionSection() {
  return (
    <section className="relative border-y border-[#eee4d2] bg-[#fff9ed] py-16 sm:py-20 lg:py-24">
      <div className="pointer-events-none absolute left-[-80px] top-[-90px] h-64 w-64 rounded-full border border-[#d9bd7c]/25" />
      <div className="pointer-events-none absolute right-[-90px] bottom-[-110px] h-72 w-72 rounded-full border border-[#d9bd7c]/20" />
      <Container className="relative">
        <SectionHeading
          title="Our Mission & Vision"
          subtitle="Faith-led purpose, practical compassion, and long-term transformation"
        />

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <ScrollReveal direction="left">
            <div className="relative h-full overflow-hidden rounded-[1.8rem] border border-[#eadfc8] bg-white p-7 shadow-[0_16px_40px_rgba(64,48,18,.06)] sm:p-9">
              <span className="absolute right-6 top-4 font-display text-[5.6rem] font-bold leading-none text-[#f2e6cc]">01</span>
              <div className="relative">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0c3350] text-white shadow-sm">
                  <Target className="h-6 w-6" />
                </span>
                <p className="mt-6 font-body text-xs font-bold uppercase tracking-[0.18em] text-[#a7770c]">What drives us</p>
                <h3 className="mt-2 font-display text-3xl font-bold text-deep-navy">Mission Statement</h3>
                <p className="mt-4 max-w-xl font-body text-base leading-8 text-[#625a4d] sm:text-lg">
                  Our mission is to transform lives and strengthen communities across Africa through holistic, faith-driven outreach that combines practical compassion with sustained support in education, health, nutrition, and community development.
                </p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right">
            <div className="relative h-full overflow-hidden rounded-[1.8rem] border border-[#eadfc8] bg-[#1b5f7b] p-7 text-white shadow-[0_16px_40px_rgba(28,42,56,.14)] sm:p-9">
              <span className="absolute right-6 top-4 font-display text-[5.6rem] font-bold leading-none text-white/[0.06]">02</span>
              <div className="relative">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#c38a00] text-white shadow-sm">
                  <Eye className="h-6 w-6" />
                </span>
                <p className="mt-6 font-body text-xs font-bold uppercase tracking-[0.18em] text-[#f0ce73]">Where we are going</p>
                <h3 className="mt-2 font-display text-3xl font-bold text-white">Vision Statement</h3>
                <p className="mt-4 max-w-xl font-body text-base leading-8 text-white/[0.78] sm:text-lg">
                  Our vision is to see thriving and resilient communities across Africa where people are supported in both spiritual and practical needs, children can pursue education, families can access care, and hope is translated into lasting opportunity.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </Container>
    </section>
  );
}

function ApproachSection() {
  return (
    <section className="relative overflow-hidden bg-[#1b5f7b] py-16 sm:py-20 lg:py-24">
      <div className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full border border-white/20" />
      <div className="pointer-events-none absolute left-16 top-24 h-36 w-36 rounded-full border border-[#f0cc70]/28" />
      <div className="pointer-events-none absolute -right-20 bottom-[-120px] h-80 w-80 rounded-full border border-[#f0cc70]/32" />
      <div className="pointer-events-none absolute right-24 top-14 h-44 w-44 rounded-full border border-[#a9dce8]/28" />
      <Container className="relative">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <div>
            <p className="font-body text-xs font-bold uppercase tracking-[0.2em] text-[#e3bf5a]">How we work</p>
            <h2 className="mt-3 max-w-xl font-display text-4xl font-bold leading-tight tracking-[-0.02em] text-white sm:text-5xl">
              Service Built for Lasting Transformation
            </h2>
          </div>
          <p className="max-w-2xl font-body text-base leading-8 text-white/[0.88] sm:text-lg lg:justify-self-end">
            Kadesh Hope Mission brings together faith, practical service, and long-term commitment. We seek to meet people with dignity, understand the needs that shape everyday life, and respond through programs that strengthen both individuals and the communities around them.
          </p>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px 0px" }}
          className="mt-12 grid gap-5 md:grid-cols-3"
        >
          {APPROACH_PILLARS.map((pillar) => (
            <motion.div key={pillar.number} variants={slideUp}>
              <div className="h-full rounded-[1.55rem] border border-white/20 bg-white/[0.10] p-6 backdrop-blur-sm sm:p-7">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-display text-4xl font-bold text-[#e3bf5a]">{pillar.number}</span>
                  <span className="h-px flex-1 bg-gradient-to-r from-[#e3bf5a]/45 to-transparent" />
                </div>
                <h3 className="mt-6 font-display text-2xl font-bold text-white">{pillar.title}</h3>
                <p className="mt-3 font-body text-sm leading-7 text-white/[0.84] sm:text-base">{pillar.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}

function MinistryAreasSection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-body text-xs font-bold uppercase tracking-[0.2em] text-[#a7770c]">Our core areas</p>
          <h2 className="mt-3 font-display text-4xl font-bold text-deep-navy sm:text-5xl">How We Serve</h2>
          <p className="mx-auto mt-4 max-w-2xl font-body text-base leading-8 text-[#625a4d] sm:text-lg">
            Our work is focused through three connected areas that respond to immediate needs while helping children, families, and communities build stronger foundations for the future.
          </p>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px 0px" }}
          className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3"
        >
          {ABOUT_MINISTRY_AREAS.map((area, index) => {
            const Icon = ministryIcons[area.icon];

            return (
              <motion.div key={area.title} variants={slideUp}>
                <GlareHover className="h-full">
                  <div className="group relative flex h-full min-h-[330px] flex-col overflow-hidden rounded-[1.7rem] border border-[#eadfc8] bg-white p-7 shadow-[0_14px_36px_rgba(55,43,20,.06)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_50px_rgba(55,43,20,.11)] sm:p-8">
                    <div className="absolute -right-7 -top-7 h-36 w-36 rounded-full bg-[#fff3d6] transition-transform duration-500 group-hover:scale-110" />
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1b5f7b] text-white shadow-sm">
                        {Icon && <Icon className="h-6 w-6" />}
                      </span>
                      <span className="font-display text-5xl font-bold text-[#f0e4ca]">0{index + 1}</span>
                    </div>
                    <h3 className="relative z-10 mt-7 font-display text-2xl font-bold text-deep-navy sm:text-3xl">{area.title}</h3>
                    <p className="relative z-10 mt-4 font-body text-sm leading-7 text-[#625a4d] sm:text-base">{area.description}</p>
                    <div className="relative z-10 mt-auto pt-7">
                      <div className="h-px w-full bg-[#eee3cf]" />
                      <p className="mt-4 font-body text-[11px] font-bold uppercase tracking-[0.16em] text-[#a7770c]">{area.emphasis}</p>
                    </div>
                  </div>
                </GlareHover>
              </motion.div>
            );
          })}
        </motion.div>
      </Container>
    </section>
  );
}

function ImpactCounter({ target, suffix = "", duration = 2, className = "text-5xl sm:text-6xl" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px 0px" });

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
    <span ref={ref} className={`font-display font-bold tracking-tight ${className}`}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

function ImpactProgressBar({ progress, color }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px 0px" });

  return (
    <div ref={ref} className="h-2 w-full overflow-hidden rounded-full bg-white/20">
      <motion.div
        initial={{ width: 0 }}
        animate={isInView ? { width: `${progress}%` } : { width: 0 }}
        transition={{ duration: 1.4, ease: "easeOut", delay: 0.25 }}
        className={`h-full rounded-full ${color === "vibrant-blue" ? "bg-[#87d4e8]" : "bg-[#f0cd72]"}`}
      />
    </div>
  );
}

function ImpactStatsSection() {
  const impactIcons = { Rocket, GraduationCap, UtensilsCrossed, Stethoscope };

  return (
    <section className="relative overflow-hidden bg-[#1a5b77] py-16 sm:py-20 lg:py-24">
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full border border-white/18" />
      <div className="pointer-events-none absolute left-28 bottom-16 h-32 w-32 rounded-full border border-[#9fd7e4]/24" />
      <div className="pointer-events-none absolute -right-24 bottom-8 h-80 w-80 rounded-full border border-[#f0c965]/30" />
      <div className="pointer-events-none absolute right-28 top-14 h-40 w-40 rounded-full border border-white/16" />
      <Container className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-body text-xs font-bold uppercase tracking-[0.2em] text-[#e3bf5a]">Measured impact</p>
          <h2 className="mt-3 font-display text-4xl font-bold text-white sm:text-5xl">Our Impact</h2>
          <p className="mt-4 font-body text-base leading-7 text-white/[0.84] sm:text-lg">
            Every statistic represents a life transformed, a family strengthened, and a community empowered.
          </p>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px 0px" }}
          className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2"
        >
          {IMPACT_ITEMS.map((item) => {
            const Icon = impactIcons[item.icon] || Rocket;
            const isBlue = item.color === "vibrant-blue";

            return (
              <motion.div key={item.title} variants={slideUp}>
                <div className="h-full rounded-[1.6rem] border border-white/20 bg-white/[0.10] p-6 backdrop-blur-sm sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <span className={`flex h-12 w-12 items-center justify-center rounded-full ${isBlue ? "bg-[#2c829c]/20 text-[#7fd0e4]" : "bg-[#c38a00]/20 text-[#f0cd72]"}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.06] px-3 py-1 font-body text-[11px] font-semibold text-white/70">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Active Program
                    </span>
                  </div>

                  <div className={`mt-6 ${isBlue ? "text-[#87d4e8]" : "text-[#f0cd72]"}`}>
                    <ImpactCounter target={item.stat} suffix={item.suffix} />
                  </div>
                  <h3 className="mt-3 font-display text-2xl font-bold text-white">{item.title}</h3>
                  <p className="mt-3 font-body text-sm leading-7 text-white/[0.74]">{item.description}</p>

                  <div className="mt-6 space-y-2">
                    <div className="flex items-center justify-between font-body text-xs text-white/50">
                      <span>Impact Progress</span>
                      <span className={isBlue ? "text-[#87d4e8]" : "text-[#f0cd72]"}>{item.progress}%</span>
                    </div>
                    <ImpactProgressBar progress={item.progress} color={item.color} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </Container>
    </section>
  );
}

function splitRole(role) {
  const [title, department] = role.split(" — ");
  return { title: title.trim(), department: department?.trim() };
}

function TeamCard({ member, index }) {
  const { title, department } = splitRole(member.role);
  // Middle column sits lower on desktop, every 2nd card on tablet — a staggered "wall".
  const offset = index % 3 === 1 ? "lg:translate-y-14" : "";
  const tabletOffset = index % 2 === 1 ? "sm:max-lg:translate-y-10" : "";

  return (
    <motion.article variants={slideUp} className={`group ${offset} ${tabletOffset}`}>
      <div className="relative aspect-[3/4] overflow-hidden rounded-[1.75rem] bg-[#18546f] shadow-[0_20px_50px_rgba(24,84,111,.18)] ring-1 ring-[#dbe8ec] transition-shadow duration-500 group-hover:shadow-[0_28px_70px_rgba(24,84,111,.28)]">
        <OptimizedImage
          src={member.image}
          alt={member.name}
          style={{ objectPosition: member.imagePosition }}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0b2f40] via-[#0b2f40]/85 to-transparent px-5 pb-6 pt-24 sm:px-6">
          <div className="h-[3px] w-10 rounded-full bg-[#f0c965] transition-all duration-500 group-hover:w-20" />
          <h3 className="mt-3 font-display text-2xl font-bold leading-tight text-white">{member.name}</h3>
          <p className="mt-2 font-body text-sm font-semibold leading-6 text-white/95">{title}</p>
          {department && <p className="mt-1 font-body text-[13px] leading-5 text-[#bfe0e8]">{department}</p>}
        </div>
      </div>
    </motion.article>
  );
}

function TeamSection() {
  return (
    <section className="relative overflow-hidden bg-[#fffaf2] py-16 sm:py-20 lg:py-24 lg:pb-36">
      <div className="pointer-events-none absolute -left-28 top-10 h-72 w-72 rounded-full border border-[#5a9bb0]/15" />
      <div className="pointer-events-none absolute -right-28 bottom-10 h-80 w-80 rounded-full border border-[#d8ad48]/18" />

      <Container className="relative">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
          <div>
            <p className="font-body text-xs font-bold uppercase tracking-[0.2em] text-[#a7770c]">People behind the mission</p>
            <h2 className="mt-3 font-display text-4xl font-bold leading-tight text-deep-navy sm:text-5xl">Meet Our Team</h2>
          </div>
          <p className="max-w-3xl font-body text-base leading-8 text-[#625a4d] sm:text-lg lg:justify-self-end">
            Kadesh Hope Mission is guided by people who bring experience across ministry, administration, healthcare, education, welfare, and community development. Together, they turn the mission's values into responsible programs, trusted relationships, and consistent service across the communities we support.
          </p>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px 0px" }}
          className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:pb-10 lg:grid-cols-3 lg:gap-8 lg:pb-0"
        >
          {TEAM_MEMBERS.map((member, index) => (
            <TeamCard key={member.name} member={member} index={index} />
          ))}
        </motion.div>
      </Container>
    </section>
  );
}

function LegacyTimelineSection() {
  return (
    <section className="relative overflow-hidden border-y border-[#2d7188] bg-[#18546f] py-16 sm:py-20 lg:py-24">
      <div className="absolute left-1/2 top-0 h-full w-[900px] -translate-x-1/2 bg-[radial-gradient(circle_at_center,rgba(131,207,224,.18),transparent_68%)]" />
      <div className="pointer-events-none absolute -left-24 top-14 h-64 w-64 rounded-full border border-white/16" />
      <div className="pointer-events-none absolute -right-28 bottom-8 h-72 w-72 rounded-full border border-[#f0c965]/24" />
      <Container className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-body text-xs font-bold uppercase tracking-[0.2em] text-[#e3bf5a]">Our journey</p>
          <h2 className="mt-3 font-display text-4xl font-bold text-white sm:text-5xl">A Legacy of Persistence</h2>
          <p className="mt-4 font-body text-base leading-7 text-white/[0.75] sm:text-lg">
            Key milestones in our journey of transformation
          </p>
        </div>

        <div className="relative mx-auto mt-14 max-w-5xl">
          <div className="absolute bottom-0 left-5 top-0 w-px bg-gradient-to-b from-transparent via-white/25 to-transparent md:left-1/2 md:-translate-x-1/2" />

          <div className="space-y-7 md:space-y-8">
            {TIMELINE.map((entry, index) => {
              const isLeft = index % 2 === 0;
              const accent = isLeft ? "#d3a32b" : "#5db0c9";

              return (
                <ScrollReveal key={`${entry.year}-${entry.title}`} direction={isLeft ? "left" : "right"} delay={index * 0.05}>
                  <div className="relative md:grid md:grid-cols-2 md:gap-14">
                    <div className={isLeft ? "md:pr-4" : "md:col-start-2 md:pl-4"}>
                      <TimelineCard entry={entry} accent={accent} />
                    </div>

                    <div className="absolute left-5 top-7 z-10 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border-4 border-[#18546f] bg-white md:left-1/2 md:top-1/2 md:-translate-y-1/2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} />
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}

function TimelineCard({ entry, accent }) {
  return (
    <div className="ml-12 rounded-[1.35rem] border border-white/15 bg-white/[0.07] p-5 shadow-[0_14px_30px_rgba(0,0,0,.08)] backdrop-blur-sm transition hover:bg-white/[0.10] sm:p-6 md:ml-0">
      <span
        className="inline-flex rounded-full px-3.5 py-1 font-body text-xs font-bold text-[#174e67]"
        style={{ backgroundColor: accent }}
      >
        {entry.year}
      </span>
      <h3 className="mt-4 font-display text-2xl font-bold text-white">{entry.title}</h3>
      <p className="mt-2 font-body text-sm leading-7 text-white/[0.78] sm:text-base">{entry.description}</p>
    </div>
  );
}

function AboutPartnershipSection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[.95fr_1.05fr] lg:gap-16">
          <ScrollReveal direction="left">
            <div className="relative mx-auto max-w-[590px]">
              <div className="overflow-hidden rounded-[2rem] border border-[#eadfc8] bg-white p-2 shadow-[0_22px_54px_rgba(31,39,51,.10)]">
                <OptimizedImage
                  src="/images/partners.png"
                  alt="Kadesh Hope Mission partnership"
                  className="aspect-[4/3] w-full rounded-[1.55rem] object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-4 hidden rounded-[1.2rem] border border-[#eadfc8] bg-[#fff8e7] px-5 py-4 shadow-[0_12px_30px_rgba(60,45,18,.12)] sm:block">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1b5f7b] text-white">
                    <Globe2 className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-display text-lg font-bold text-deep-navy">Holistic transformation</p>
                    <p className="font-body text-xs text-[#766d5f]">Built through collaboration</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right">
            <div>
              <p className="font-body text-xs font-bold uppercase tracking-[0.2em] text-[#a7770c]">Why partner with us</p>
              <h2 className="mt-3 font-display text-4xl font-bold leading-tight text-deep-navy sm:text-5xl">
                A Holistic Approach to Community Transformation
              </h2>
              <div className="mt-6 space-y-4 font-body text-base leading-8 text-[#625a4d]">
                <p>
                  Kadesh Hope Mission approaches community challenges holistically, recognizing that education, health, nutrition, family wellbeing, and spiritual care are deeply connected. Our goal is not simply to respond to a moment of need, but to help create conditions in which people and communities can move forward with greater strength and confidence.
                </p>
                <p>
                  That is why our programs combine immediate assistance with sustained engagement. We seek to support children in school, strengthen access to care, reduce the pressure of food insecurity, and encourage community resilience through practical, relationship-based service.
                </p>
                <p>
                  The value of partnership is found in what it makes possible over time: more consistent programs, stronger local relationships, and broader support for families whose needs often overlap across multiple areas of life.
                </p>
                <p>
                  Through commitment, collaboration, and faith-driven action, we remain focused on a clear purpose — to restore hope, protect dignity, and contribute to lasting transformation across the communities we serve.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </Container>
    </section>
  );
}

function PartnersSection() {
  return (
    <section className="border-y border-[#eee4d2] bg-[#fff9ed] py-16 sm:py-20 lg:py-24">
      <Container>
        <SectionHeading
          title="Partnership Opportunities"
          subtitle="Choose the partnership model that aligns with your vision and values"
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px 0px" }}
          className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {PARTNERSHIP_TYPES.map((partnership, index) => {
            const Icon = partnership.icon;
            return (
              <motion.div key={partnership.title} variants={slideUp}>
                <div className="group h-full rounded-[1.5rem] border border-[#eadfc8] bg-white p-6 shadow-[0_12px_30px_rgba(55,43,20,.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(55,43,20,.10)]">
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1b5f7b] text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="font-display text-4xl font-bold text-[#efe3c9]">0{index + 1}</span>
                  </div>
                  <h3 className="mt-6 font-display text-2xl font-bold text-deep-navy">{partnership.title}</h3>
                  <p className="mt-3 font-body text-sm leading-7 text-[#6b6255]">{partnership.description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="mt-11 flex justify-center">
          <Link
            to="/contact"
            className="group inline-flex items-center gap-3 rounded-full bg-[#1b5f7b] px-7 py-3.5 font-body text-sm font-bold text-white shadow-[0_12px_28px_rgba(11,45,71,.18)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#24718e] hover:shadow-[0_16px_34px_rgba(11,45,71,.24)]"
          >
            Become a Partner
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-transform duration-300 group-hover:translate-x-1 group-hover:bg-white/15">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </Container>
    </section>
  );
}

function FinalCTASection() {
  return (
    <section className="px-4 py-10 sm:px-6 sm:py-14">
      <Container className="px-0">
        <div className="relative overflow-hidden rounded-[2rem] border border-[#4b8599] bg-[#1b607b] shadow-[0_24px_60px_rgba(13,35,54,.14)]">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full border border-white/18" />
          <div className="pointer-events-none absolute left-20 bottom-[-70px] h-44 w-44 rounded-full border border-[#9fd7e4]/25" />
          <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full border border-[#f0c965]/28" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#e0b74d]/70 to-transparent" />

          <ScrollReveal>
            <div className="relative grid items-center gap-10 px-7 py-12 sm:px-10 sm:py-14 lg:grid-cols-[1fr_auto] lg:gap-16 lg:px-14 lg:py-16">
              <div className="max-w-3xl text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#e0b74d]/25 bg-[#e0b74d]/10 px-4 py-2">
                  <Heart className="h-4 w-4 text-[#f0cd72]" />
                  <span className="font-body text-[11px] font-bold uppercase tracking-[0.2em] text-[#f0cd72]">
                    Be part of what comes next
                  </span>
                </div>

                <h2 className="mt-6 font-display text-4xl font-bold leading-tight tracking-[-0.02em] text-white sm:text-5xl lg:text-[3.4rem]">
                  Be Part of the Next Chapter
                </h2>

                <p className="mx-auto mt-5 max-w-2xl font-body text-base leading-8 text-white/[0.74] sm:text-lg lg:mx-0">
                  Stand with Kadesh Hope Mission as we expand opportunity, restore dignity, and help communities build stronger futures across Africa.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <Link
                  to="/donate"
                  className="group inline-flex min-w-[190px] items-center justify-center gap-3 rounded-full bg-[#e2b646] px-6 py-3.5 font-body text-sm font-bold text-[#174e67] shadow-[0_12px_28px_rgba(0,0,0,.14)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#efc65b]"
                >
                  Support the Mission
                  <Heart className="h-[18px] w-[18px] transition-transform duration-300 group-hover:scale-110" />
                </Link>

                <Link
                  to="/contact"
                  className="group inline-flex min-w-[190px] items-center justify-center gap-3 rounded-full border border-white/30 bg-white/[0.06] px-6 py-3.5 font-body text-sm font-bold text-white backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:border-white/55 hover:bg-white/[0.12]"
                >
                  Get Involved
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </Container>
    </section>
  );
}

