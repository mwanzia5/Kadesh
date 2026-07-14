import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Handshake,
  Building2,
  Church,
  UserCheck,
  GraduationCap,
  HeartPulse,
  Droplets,
  ArrowRight,
  Quote,
} from "lucide-react";

import PageTransition from "@/animations/PageTransition";
import {
  staggerContainer,
  slideUp,
} from "@/animations/variants";

import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import GlareHover from "@/components/ui/GlareHover";
import SplitText from "@/components/ui/SplitText";
import ScrollReveal from "@/components/ui/ScrollReveal";
import SectionHeading from "@/components/ui/SectionHeading";
import OptimizedImage from "@/components/ui/OptimizedImage";

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

const SPONSORSHIP_OPPORTUNITIES = [
  {
    icon: HeartPulse,
    title: "Sponsor a Child",
    amount: "$35/month",
    description:
      "Cover a child's education, meals, and healthcare — transforming one life at a time.",
    link: "/donate",
  },
  {
    icon: GraduationCap,
    title: "Fund a School",
    amount: "$500",
    description:
      "Provide learning materials, furniture, and resources for an entire classroom of students.",
    link: "/donate",
  },
  {
    icon: HeartPulse,
    title: "Health Initiative",
    amount: "$250",
    description:
      "Support mobile clinics and community health outreach serving rural populations.",
    link: "/donate",
  },
  {
    icon: Droplets,
    title: "Clean Water Project",
    amount: "$100",
    description:
      "Install water purification systems that provide safe drinking water to entire villages.",
    link: "/donate",
  },
];

export default function Partners() {
  return (
    <PageTransition>
      <HeroSection />
      <AboutPartnershipSection />
      <PartnershipCardsSection />
      <BecomePartnerCTA />
      <SponsorSection />
      <DonationCTA />
    </PageTransition>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-deep-navy">
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
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
                GET INVOLVED
              </span>
            </motion.div>

            <div className="max-w-4xl mb-8">
              <SplitText
                text="Partner With Us"
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
              Together, we can build stronger communities and restore hope
              across Africa through collaboration, compassion, and shared vision.
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

function AboutPartnershipSection() {
  return (
    <Section background="white" className="section-padding overflow-hidden">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
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
              <div className="relative">
                <div className="rounded-2xl overflow-hidden shadow-card">
                  <OptimizedImage
                    src="/images/partners.png"
                    alt="Kadesh Hope Mission partnership"
                    className="w-full aspect-[4/3] object-cover"
                  />
                </div>

                <div className="absolute -bottom-6 -left-4 md:left-6 lg:-left-8 z-10 w-[85%] md:w-auto">
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function PartnershipCardsSection() {
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
                <GlareHover
                  glareColor="#2563EB"
                  className="h-full"
                >
                  <div className="flex flex-col p-6 rounded-xl bg-white border border-soft-accent/50 h-full transition-shadow duration-300 hover:shadow-card">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-vibrant-blue/10 text-vibrant-blue mb-5">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-display text-headline-sm text-deep-navy mb-3">
                      {partnership.title}
                    </h3>
                    <p className="font-body text-body-md text-on-surface-variant leading-relaxed">
                      {partnership.description}
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

function BecomePartnerCTA() {
  return (
    <section className="relative overflow-hidden bg-deep-navy">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-vibrant-blue/20 to-hope-orange/20" />
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-vibrant-blue/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-hope-orange/10 blur-3xl" />
      </div>

      <Container className="relative z-10">
        <div className="py-20 lg:py-28 text-center max-w-3xl mx-auto">
          <ScrollReveal>
            <h2 className="font-display text-3xl md:text-5xl text-white mb-6">
              Become a Partner Today
            </h2>
            <p className="font-body text-body-lg text-white/70 mb-10 leading-relaxed">
              Partnering with Kadesh Hope Mission means joining a movement
              that transforms communities across Africa. Gain meaningful
              impact, build lasting relationships, and be part of a mission
              driven by faith and compassion.
            </p>
            <Button variant="orange" size="lg" as={Link} to="/contact">
              Apply Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </ScrollReveal>
        </div>
      </Container>
    </section>
  );
}

function SponsorSection() {
  return (
    <Section background="white" className="section-padding">
      <Container>
        <SectionHeading
          title="Sponsorship Opportunities"
          subtitle="Directly fund programs that change lives — every dollar counts"
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {SPONSORSHIP_OPPORTUNITIES.map((item) => {
            const Icon = item.icon;

            return (
              <motion.div key={item.title} variants={slideUp}>
                <GlareHover
                  glareColor="#F37021"
                  className="h-full"
                >
                  <div className="flex flex-col p-6 rounded-xl bg-white border border-soft-accent/50 h-full transition-shadow duration-300 hover:shadow-card">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-hope-orange/10 text-hope-orange mb-5">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-display text-headline-sm text-deep-navy mb-2">
                      {item.title}
                    </h3>
                    <span className="inline-block font-display text-headline-sm text-hope-orange mb-3">
                      {item.amount}
                    </span>
                    <p className="font-body text-body-md text-on-surface-variant leading-relaxed mb-6 flex-grow">
                      {item.description}
                    </p>
                    <Button
                      variant="orange"
                      size="sm"
                      as={Link}
                      to={item.link}
                      className="self-start"
                    >
                      Sponsor Now
                    </Button>
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

function DonationCTA() {
  return (
    <section className="mx-5 my-5 rounded-2xl overflow-hidden bg-gradient-to-r from-hope-orange to-amber-500">
      <div className="py-20 lg:py-24">
        <Container>
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="font-display text-3xl md:text-5xl text-white mb-6">
                Every contribution makes a difference
              </h2>
              <p className="font-body text-body-lg text-white/90 mb-10 leading-relaxed">
                Your generosity funds education, healthcare, clean water,
                and food security for communities across Africa. No gift is
                too small — every amount moves us closer to our mission.
              </p>
              <Button variant="secondary" size="lg" as={Link} to="/donate">
                Donate Now
                <HeartPulse className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </ScrollReveal>
        </Container>
      </div>
    </section>
  );
}
