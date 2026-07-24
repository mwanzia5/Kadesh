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
} from "lucide-react";

import PageTransition from "@/animations/PageTransition";
import { staggerContainer, slideUp } from "@/animations/variants";
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

const ministryIcons = { School, Heart, UtensilsCrossed, Rocket, Users };

// ---------------------------------------------------------------------------
// Static content — the standalone Impact Statistics page pulled this from a
// CMS/localStorage layer. Folded into a single static About page, these
// numbers now live here directly. Swap in a CMS fetch later if needed.
// ---------------------------------------------------------------------------
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
    title: "Combating Hunger & Malnutrition",
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
  { name: "Mr. Titus", role: "Executive Director", image: "/images/Team/Team_2.jpeg" },
  { name: "Mr. Obula Puli", role: "Deputy Director, Missions", image: "/images/Team/Team_3.jpeg" },
  {
    name: "Mr. Balaji Doddapanni",
    role: "Director, Social Development Programs — Heading Livelihood and Home Care Infrastructure Projects",
    image: "/images/Team/Team_4.jpeg",
  },
  { name: "Miss. Sirisha Govindu", role: "Administration, Mission", image: "/images/Team/Team_5.jpeg" },
  {
    name: "Dr. Lydia",
    role: "Director, Health Programs Development — Community, Health and Wellness Department",
    image: "/images/Team/Team_6.jpg",
  },
  {
    name: "Bhargavi Induri",
    role: "Director, Education and Welfare — Child and Women Empowerment Department",
    image: "/images/Team/Team_1.jpeg",
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
  return (
    <PageTransition>
      <HeroSection />
      <StorySection />
      <MissionVisionSection />
      <MinistryAreasSection />
      <ImpactStatsSection />
      <TeamSection />
      <LegacyTimelineSection />
      <AboutPartnershipSection />
      <PartnersSection />
      <FinalCTASection />
    </PageTransition>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Story (with founding counters)
// ---------------------------------------------------------------------------
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
                    {isInView && <AnimatedCounter end={15} suffix="+" duration={2000} />}
                  </div>
                  <p className="font-body text-body-lg text-on-surface-variant">Years of Service</p>
                </div>
                <div>
                  <div className="font-display text-4xl md:text-5xl font-bold text-hope-orange mb-2">
                    {isInView && <AnimatedCounter end={10} suffix="k+" duration={2000} />}
                  </div>
                  <p className="font-body text-body-lg text-on-surface-variant">Lives Impacted</p>
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
                    src="/Egypt/IMG-20250628-WA0072.jpg"
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

// ---------------------------------------------------------------------------
// Mission & Vision
// ---------------------------------------------------------------------------
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
                <h3 className="font-display text-headline-md text-deep-navy mb-4">Mission Statement</h3>
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
                <h3 className="font-display text-headline-md text-deep-navy mb-4">Vision Statement</h3>
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

// ---------------------------------------------------------------------------
// Ministry Areas
// ---------------------------------------------------------------------------
function MinistryAreasSection() {
  return (
    <Section background="white" className="section-padding">
      <Container>
        <SectionHeading title="How We Serve" subtitle="Our ministry areas address the most critical needs" />

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
                  glareColor={area.icon === "Heart" || area.icon === "Rocket" ? "#F37021" : "#2563EB"}
                  className="h-full"
                >
                  <div className="flex flex-col p-6 rounded-xl bg-white border border-soft-accent/50 h-full transition-shadow duration-300 hover:shadow-card">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-vibrant-blue/10 text-vibrant-blue mb-5">
                      {Icon && <Icon className="h-6 w-6" />}
                    </div>
                    <h3 className="font-display text-headline-sm text-deep-navy mb-3">{area.title}</h3>
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

// ---------------------------------------------------------------------------
// Impact Statistics (quantified program results)
// ---------------------------------------------------------------------------
function ImpactCounter({ target, suffix = "", duration = 2 }) {
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

function ImpactProgressBar({ progress, color }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div ref={ref} className="w-full h-2 bg-surface rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={isInView ? { width: `${progress}%` } : { width: 0 }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
        className={`h-full rounded-full ${color === "vibrant-blue" ? "bg-vibrant-blue" : "bg-hope-orange"}`}
      />
    </div>
  );
}

function ImpactStatsSection() {
  const impactIcons = { Rocket, GraduationCap, UtensilsCrossed, Stethoscope };

  return (
    <Section background="gray" className="section-padding">
      <Container>
        <SectionHeading
          title="Our Impact"
          subtitle="Every statistic represents a life transformed, a family strengthened, and a community empowered"
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {IMPACT_ITEMS.map((item) => {
            const Icon = impactIcons[item.icon] || Rocket;
            return (
              <motion.div key={item.title} variants={slideUp}>
                <GlareHover className="h-full">
                  <div className="bg-white rounded-2xl p-8 border border-soft-accent/50 shadow-card hover:shadow-card-hover transition-shadow duration-300 h-full">
                    <div className="flex items-start justify-between mb-6">
                      <div
                        className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                          item.color === "vibrant-blue" ? "bg-vibrant-blue/10" : "bg-hope-orange/10"
                        }`}
                      >
                        <Icon
                          className={`h-7 w-7 ${
                            item.color === "vibrant-blue" ? "text-vibrant-blue" : "text-hope-orange"
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

                    <h3 className="font-display text-xl md:text-2xl text-deep-navy mb-4">{item.title}</h3>

                    <div className={`mb-4 ${item.color === "vibrant-blue" ? "text-vibrant-blue" : "text-hope-orange"}`}>
                      <ImpactCounter target={item.stat} suffix={item.suffix} />
                    </div>

                    <p className="font-body text-body-md text-on-surface-variant mb-6 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-body text-caption text-on-surface-variant">Impact Progress</span>
                        <span
                          className={`font-body text-caption-bold ${
                            item.color === "vibrant-blue" ? "text-vibrant-blue" : "text-hope-orange"
                          }`}
                        >
                          {item.progress}%
                        </span>
                      </div>
                      <ImpactProgressBar progress={item.progress} color={item.color} />
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

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------
function TeamCard({ member }) {
  return (
    <motion.div variants={slideUp} className="team-card">
      <div className="team-card__front">
        <OptimizedImage src={member.image} alt={member.name} className="w-full h-full object-cover" />
      </div>
      <div className="team-card__overlay"></div>
      <div className="team-card__content">
        <h3 className="team-card__name">{member.name}</h3>
        <p className="team-card__role">{member.role}</p>
      </div>
    </motion.div>
  );
}

function TeamSection() {
  return (
    <Section background="white" className="section-padding">
      <Container>
        <SectionHeading
          title="Our Team"
          subtitle="Meet the dedicated leaders driving our mission to transform lives across Africa"
          highlight="Team"
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-12"
        >
          {TEAM_MEMBERS.map((member) => (
            <TeamCard key={member.name} member={member} />
          ))}
        </motion.div>
      </Container>

      <style>{`
        .team-card {
          position: relative;
          width: 100%;
          aspect-ratio: 3 / 4;
          background: linear-gradient(-45deg, #2563EB 0%, #F37021 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .team-card__front {
          position: absolute;
          inset: 0;
          z-index: 1;
        }

        .team-card__front img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .team-card__overlay {
          position: absolute;
          inset: 0;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(13, 27, 62, 0.3);
          transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .team-card:hover {
          transform: rotate(-5deg) scale(1.05);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .team-card:hover .team-card__overlay {
          background: rgba(13, 27, 62, 0.7);
        }

        .team-card__content {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 3;
          padding: 24px;
          background: linear-gradient(to top, rgba(13, 27, 62, 0.95), transparent);
          transform: translateY(60%);
          transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .team-card:hover .team-card__content {
          transform: translateY(0);
        }

        .team-card__name {
          margin: 0;
          font-family: "Source Serif 4", Georgia, serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: white;
        }

        .team-card__role {
          margin: 4px 0 0;
          font-family: "Hanken Grotesk", system-ui, sans-serif;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.8);
        }

        @media (max-width: 640px) {
          .team-card:hover {
            transform: none;
            box-shadow: none;
          }
          .team-card__content {
            transform: translateY(0);
            padding: 16px;
          }
          .team-card__overlay {
            background: rgba(13, 27, 62, 0.6);
          }
          .team-card__name {
            font-size: 1.1rem;
          }
          .team-card__role {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Legacy Timeline
// ---------------------------------------------------------------------------
function LegacyTimelineSection() {
  return (
    <Section background="navy" className="section-padding overflow-hidden">
      <Container>
        <SectionHeading
          title="A Legacy of Persistence"
          subtitle="Key milestones in our journey of transformation"
          light
        />

        <div className="relative mt-20">
          {/* Center spine */}
          <div className="absolute left-5 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/15 to-transparent md:-translate-x-1/2" />

          <div className="space-y-14 md:space-y-20">
            {TIMELINE.map((entry, index) => {
              const isLeft = index % 2 === 0;
              const accent = isLeft ? "hope-orange" : "vibrant-blue";

              return (
                <ScrollReveal key={entry.year} direction={isLeft ? "left" : "right"} delay={index * 0.1}>
                  <div className="relative flex items-center">
                    {/* Desktop left column */}
                    <div className="hidden md:flex md:w-1/2 md:pr-14 md:justify-end">
                      {isLeft && <TimelineCard entry={entry} accent={accent} />}
                    </div>

                    {/* Marker — centered on the spine, vertically centered to this entry's own card */}
                    <div className="absolute left-5 md:left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                      <div
                        className={`flex items-center justify-center w-9 h-9 rounded-full bg-deep-navy border-2 ${
                          accent === "hope-orange" ? "border-hope-orange" : "border-vibrant-blue"
                        }`}
                      >
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            accent === "hope-orange" ? "bg-hope-orange" : "bg-vibrant-blue"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Desktop right column */}
                    <div className="hidden md:flex md:w-1/2 md:pl-14">
                      {!isLeft && <TimelineCard entry={entry} accent={accent} />}
                    </div>

                    {/* Mobile: single column */}
                    <div className="md:hidden pl-14 w-full">
                      <TimelineCard entry={entry} accent={accent} />
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </Container>
    </Section>
  );
}

function TimelineCard({ entry, accent }) {
  const isOrange = accent === "hope-orange";

  return (
    <div
      className={`w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.06] ${
        isOrange ? "hover:border-hope-orange/40" : "hover:border-vibrant-blue/40"
      }`}
    >
      <span
        className={`inline-block rounded-full px-3.5 py-1 font-body text-caption-bold text-white mb-3 ${
          isOrange ? "bg-hope-orange" : "bg-vibrant-blue"
        }`}
      >
        {entry.year}
      </span>
      <h3 className="font-display text-headline-md text-white mb-2">{entry.title}</h3>
      <p className="font-body text-body-md text-white/70 leading-relaxed">{entry.description}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Why Partner With Us (holistic-approach intro + image)
// ---------------------------------------------------------------------------
function AboutPartnershipSection() {
  return (
    <Section background="white" className="section-padding overflow-hidden">
      <Container>
        <SectionHeading
          title="Why Partner With Us"
          subtitle="A holistic approach to community transformation"
        />

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-6">
            <ScrollReveal direction="left">
              <p className="font-body text-body-lg text-on-surface leading-relaxed mb-6">
                At Kadesh Hope Mission of Africa, we prefer a holistic
                approach to societal challenges as well as solutions. Our
                culture dictates that we continue to drive positive change
                across communities.
              </p>
              <p className="font-body text-body-lg text-on-surface leading-relaxed mb-6">
                By addressing both immediate needs and long-term challenges,
                the organization is building a foundation for a brighter,
                more sustainable future.
              </p>
              <p className="font-body text-body-lg text-on-surface leading-relaxed mb-6">
                The impact of these projects extends beyond individuals — it
                strengthens families, empowers communities, and uplifts
                entire societies.
              </p>
              <p className="font-body text-body-lg text-on-surface leading-relaxed">
                Through commitment, collaboration, and faith-driven action,
                we remain steadfast in our mission to transform lives and
                restore hope across Africa.
              </p>
            </ScrollReveal>
          </div>

          <div className="lg:col-span-6">
            <ScrollReveal direction="right">
              <div className="rounded-2xl overflow-hidden shadow-card">
                <OptimizedImage
                  src="/images/partners.png"
                  alt="Kadesh Hope Mission partnership"
                  className="w-full aspect-[4/3] object-cover"
                />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </Container>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Partners
// ---------------------------------------------------------------------------
function PartnersSection() {
  return (
    <Section background="gray" className="section-padding">
      <Container>
        <SectionHeading
          title="Partnership Opportunities"
          subtitle="Choose the partnership model that aligns with your vision and values"
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {PARTNERSHIP_TYPES.map((partnership) => {
            const Icon = partnership.icon;

            return (
              <motion.div key={partnership.title} variants={slideUp}>
                <GlareHover glareColor="#2563EB" className="h-full">
                  <div className="flex flex-col p-6 rounded-xl bg-white border border-soft-accent/50 h-full transition-shadow duration-300 hover:shadow-card">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-vibrant-blue/10 text-vibrant-blue mb-5">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-display text-headline-sm text-deep-navy mb-3">{partnership.title}</h3>
                    <p className="font-body text-body-md text-on-surface-variant leading-relaxed">
                      {partnership.description}
                    </p>
                  </div>
                </GlareHover>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="mt-12 text-center">
          <Button variant="primary" size="lg" as={Link} to="/contact">
            Become a Partner
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </Container>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Final CTA
// ---------------------------------------------------------------------------
function FinalCTASection() {
  return (
    <section className="relative bg-deep-navy rounded-2xl mx-5 my-5 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-vibrant-blue/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-hope-orange/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border border-white/5" />
      </div>

      <Container className="relative z-10">
        <div className="py-20 lg:py-28">
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 mb-8">
                <Heart className="h-7 w-7 text-hope-orange" />
              </div>

              <h2 className="font-display text-3xl md:text-5xl text-white mb-6">
                Ready to be part of the story?
              </h2>
              <p className="font-body text-body-lg text-white/70 mb-10 leading-relaxed">
                Join us in transforming lives across Africa. Whether through your
                time, skills, generosity, or partnership, every contribution
                builds a brighter future.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                  <Button
                    variant="lightblue"
                    size="lg"
                    as={Link}
                    to="/donate"
                    className="w-full sm:w-auto justify-center"
                  >
                    Donate Now
                    <Heart className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                  <Button
                    variant="secondary"
                    size="lg"
                    as={Link}
                    to="/contact"
                    className="w-full sm:w-auto justify-center border-2 border-white/40 text-white bg-transparent hover:bg-white/10 hover:border-white/70 transition-colors"
                  >
                    Get Involved
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </Container>
    </section>
  );
}