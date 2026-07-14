import { useRef, Fragment } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useScroll, useTransform, useReducedMotion } from "framer-motion";
import {
  School,
  Heart,
  UtensilsCrossed,
  Rocket,
  Users,
  ArrowRight,
  CheckCircle,
  Quote,
  ChevronRight,
  ArrowUpRight,
  ChevronDown,
} from "lucide-react";

import PageTransition from "@/animations/PageTransition";
import {
  staggerContainer,
  slideUp,
  slideLeft,
  slideRight,
  smoothTransition,
} from "@/animations/variants";
import {
  PROGRAM_PILLARS,
  PROJECTS,
  IMPACT_STATS,
  MINISTRY_AREAS,
  TESTIMONIALS,
} from "@/constants";

import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import OptimizedImage from "@/components/ui/OptimizedImage";
import GlareHover from "@/components/ui/GlareHover";
import SplitText from "@/components/ui/SplitText";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import ScrollReveal from "@/components/ui/ScrollReveal";
import SectionHeading from "@/components/ui/SectionHeading";
import LogoLoop from "@/components/LogoLoop";

const pillarIcons = {
  School,
  Heart,
  UtensilsCrossed,
  Rocket,
  Users,
};

const galleryImages = [
  { src: "/images/others/a-group-of-african-children-laughing-and-playing-with-water-in-rural-area-black-kids.webp", alt: "Community outreach program" },
  { src: "/images/kadesh images_02.jpg", alt: "Clean water project" },
  { src: "/images/kadesh images_03.jpg", alt: "Education initiative" },
  { src: "/images/kadesh images_04.jpg", alt: "Food distribution" },
  { src: "/images/kadesh images_05.jpg", alt: "Youth mentorship" },
  { src: "/images/kadesh images_06.jpg", alt: "Healthcare services" },
];

const partnerLogos = [
  { src: "/images/logos/image1-removebg-preview.png", alt: "Partner 1" },
  { src: "/images/logos/image2-removebg-preview.png", alt: "Partner 2" },
  { src: "/images/logos/image3-removebg-preview.png", alt: "Partner 3" },
  { src: "/images/logos/image4-removebg-preview.png", alt: "Partner 4" },
  { src: "/images/logos/image5-removebg-preview.png", alt: "Partner 5" },
];

const pillarColors = {
  "vibrant-blue": "bg-vibrant-blue/10 text-vibrant-blue",
  "hope-orange": "bg-hope-orange/10 text-hope-orange",
};

export default function Home() {
  return (
    <PageTransition>
      <HeroSection />
      <PillarsSection />
      <WhoWeAreSection />
      <ImpactSection />
      <ProjectsSection />
      <GallerySection />
      <TestimonialsSection />
      <DonationCTASection />
      <PartnersSection />
    </PageTransition>
  );
}

function HeroSection() {
  const heroRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? ["0%", "0%"] : ["0%", "30%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      ref={heroRef}
      className="relative min-h-[92vh] md:min-h-screen flex items-center justify-center overflow-hidden bg-deep-navy"
    >
      <motion.div style={{ y: bgY }} className="absolute inset-0">
        <div className="absolute inset-0 scale-110 overflow-hidden">
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: prefersReducedMotion ? 1 : 1.12 }}
            transition={{ duration: 24, ease: "linear" }}
            className="w-full h-full"
          >
            <OptimizedImage
              src="/images/hero-children.jpg"
              alt="Kadesh Hope Mission community"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>

        {/* Your existing hero-gradient class — matches deep-navy exactly */}
        <div className="hero-gradient absolute inset-0" />
        {/* Extra bottom vignette so the stat strip + scroll cue stay legible */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </motion.div>

      <motion.div style={{ opacity: contentOpacity }} className="relative z-10 w-full">
        <Container>
          <div className="flex flex-col items-center text-center text-white py-24 md:py-32">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mb-6 flex items-center gap-3"
            >
              <span className="h-px w-10 bg-hope-orange" />
              <span className="font-body text-label-bold uppercase tracking-[0.3em] text-white/70">
                Since 2009 &middot; DR Congo, Uganda &amp; Kenya
              </span>
              <span className="h-px w-10 bg-hope-orange" />
            </motion.div>

            <div className="max-w-3xl mb-8">
              <SplitText
                text="Hope, restored."
                className="font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] block"
                delay={0.6}
                duration={0.8}
                stagger={0.03}
              />
            </div>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.3 }}
              className="font-body text-body-lg md:text-xl max-w-xl text-white/70 mb-10 text-balance"
            >
              Education, healthcare, and food security for communities across Africa.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.6 }}
              className="flex flex-col sm:flex-row items-center gap-6"
            >
              <Button
                variant="orange"
                size="lg"
                as={Link}
                to="/donate"
                className="shadow-[0_0_30px_-5px_rgba(243,112,33,0.6)]"
              >
                Donate Now
                <Heart className="ml-2 h-5 w-5" />
              </Button>
              <Link
                to="/about"
                className="group inline-flex items-center gap-2 font-body text-label-bold text-white/90 hover:text-white transition-colors"
              >
                Learn our story
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 2 }}
              className="mt-16 flex items-center"
            >
              {IMPACT_STATS.slice(0, 3).map((stat, i) => (
                <Fragment key={stat.label}>
                  {i > 0 && (
                    <span className="hidden md:block w-px h-8 bg-white/20 mx-8 md:mx-10" />
                  )}
                  <div className="text-center px-4 md:px-0">
                    <p className="font-display text-2xl md:text-3xl font-bold text-white">
                      <AnimatedCounter end={stat.value} suffix={stat.suffix} duration={1800} />
                    </p>
                    <p className="font-body text-caption uppercase tracking-wider text-white/50 mt-1">
                      {stat.label}
                    </p>
                  </div>
                </Fragment>
              ))}
            </motion.div>
          </div>
        </Container>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 2.4 }}
        className="absolute bottom-24 md:bottom-28 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/50"
      >
        <span className="font-body text-caption uppercase tracking-widest">Scroll</span>
        <motion.div
          animate={prefersReducedMotion ? {} : { y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="h-5 w-5" />
        </motion.div>
      </motion.div>

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

function PillarsSection() {
  return (
    <Section background="white" className="section-padding">
      <Container>
        <SectionHeading
          title="Our Foundation"
          subtitle="Five pillars driving lasting change across Africa"
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6"
        >
          {PROGRAM_PILLARS.map((pillar, index) => {
            const Icon = pillarIcons[pillar.icon];
            const colorClass =
              pillarColors[pillar.color] || pillarColors["vibrant-blue"];

            return (
              <motion.div key={pillar.title} variants={slideUp}>
                <GlareHover
                  glareColor={pillar.color === "hope-orange" ? "#F37021" : "#2563EB"}
                  className="h-full"
                >
                  <div className="flex flex-col items-center text-center p-6 rounded-xl bg-white border border-soft-accent/50 h-full transition-shadow duration-300 hover:shadow-card">
                    <div
                      className={`flex items-center justify-center w-14 h-14 rounded-xl mb-5 ${colorClass}`}
                    >
                      {Icon && <Icon className="h-7 w-7" />}
                    </div>
                    <h3 className={`font-display text-deep-navy mb-3 ${pillar.title.length > 15 ? "text-lg" : "text-headline-md"}`}>
                      {pillar.title}
                    </h3>
                    <p className="font-body text-body-md text-on-surface-variant leading-relaxed">
                      {pillar.description}
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

function WhoWeAreSection() {
  return (
    <Section background="navy" className="section-padding overflow-hidden">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <ScrollReveal direction="left" className="lg:col-span-7">
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-card">
                <OptimizedImage
                  src="/images/kadesh images_03.jpg"
                  alt="Kadesh Hope Mission classroom"
                  className="w-full aspect-[4/3] object-cover"
                />
              </div>

              <div className="absolute -bottom-6 -right-4 md:right-6 lg:-right-8 z-10 w-[85%] md:w-auto">
                <div className="glass-card rounded-xl p-5 md:p-6 shadow-glass">
                  <Quote className="h-8 w-8 text-vibrant-blue mb-3 opacity-60" />
                  <p className="font-display text-body-lg text-deep-navy italic leading-relaxed">
                    &ldquo;Education is the most powerful weapon which you can
                    use to change the world.&rdquo;
                  </p>
                  <p className="font-body text-caption text-on-surface-variant mt-3">
                    &mdash; Nelson Mandela
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right" className="lg:col-span-5">
            <div className="mt-8 lg:mt-0">
              <SplitText
                text="Who We Are"
                className="font-display text-display-lg-mobile lg:text-display-lg text-white block mb-6"
                delay={0.2}
              />

              <p className="font-body text-body-lg text-white/70 mb-8 leading-relaxed">
                Founded in 2009, Kadesh Hope Mission began with a bold vision —
                a group of young people migrated from India to the Democratic
                Republic of Congo with a mission to uplift impoverished
                communities. Today, we continue transforming lives across
                multiple African nations through holistic development programs.
              </p>

              <div className="space-y-4 mb-10">
                {[
                  "Quality education access for every child",
                  "Healthcare for underserved communities",
                  "Social development and economic empowerment",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-hope-orange shrink-0 mt-0.5" />
                    <span className="font-body text-body-md text-white/80">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <Button variant="orange" size="lg" as={Link} to="/about">
                Learn More
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </Container>
    </Section>
  );
}

function ImpactSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <Section id="impact" background="gray" className="section-padding">
      <Container>
        <SectionHeading
          title="Our Impact in Numbers"
          subtitle="The difference we've made together across communities in Africa"
        />

        <motion.div
          ref={sectionRef}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {IMPACT_STATS.map((stat) => (
            <motion.div key={stat.label} variants={slideUp}>
              <div className="text-center p-8 rounded-2xl bg-white border border-soft-accent/50 shadow-card">
                <div className="font-display text-4xl md:text-5xl font-bold text-vibrant-blue mb-3">
                  {isInView && (
                    <AnimatedCounter
                      end={stat.value}
                      suffix={stat.suffix}
                      duration={2000}
                    />
                  )}
                </div>
                <p className="font-body text-body-lg text-on-surface-variant">
                  {stat.label}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <ScrollReveal delay={0.3} className="mt-12 text-center">
          <Button variant="primary" size="lg" as={Link} to="/about#impact">
            See Our Full Impact
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </ScrollReveal>
      </Container>
    </Section>
  );
}

function ProjectsSection() {
  const previewProjects = PROJECTS.slice(0, 3);

  return (
    <Section background="white" className="section-padding">
      <Container>
        <SectionHeading
          title="Our Projects"
          highlight="Projects"
          subtitle="Transforming communities across Africa"
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {previewProjects.map((project) => (
            <motion.div key={project.slug} variants={slideUp}>
              <GlareHover className="h-full">
                <Link
                  to={`/projects/${project.slug}`}
                  className="group flex flex-col h-full rounded-xl overflow-hidden bg-white border border-soft-accent/50 shadow-card hover:shadow-card-hover transition-shadow duration-300"
                >
                  <div className="relative overflow-hidden aspect-[16/10]">
                    <OptimizedImage
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute top-4 left-4 inline-block rounded-full bg-vibrant-blue px-4 py-1.5 font-body text-caption font-medium text-white">
                      {project.category}
                    </span>
                  </div>

                  <div className="flex flex-col flex-1 p-6">
                    <h3 className="font-display text-headline-md text-deep-navy mb-2 group-hover:text-vibrant-blue transition-colors">
                      {project.title}
                    </h3>
                    <p className="font-body text-body-md text-on-surface-variant flex-1 mb-4">
                      {project.shortDescription}
                    </p>
                    <span className="inline-flex items-center gap-1.5 font-body text-label-bold text-vibrant-blue">
                      Learn More
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>
                </Link>
              </GlareHover>
            </motion.div>
          ))}
        </motion.div>

        <ScrollReveal delay={0.3} className="mt-12 text-center">
          <Button variant="primary" size="lg" as={Link} to="/projects">
            View All Projects
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </ScrollReveal>
      </Container>
    </Section>
  );
}

function GallerySection() {
  return (
    <Section background="gray" className="section-padding">
      <Container>
        <SectionHeading
          title="Moments of Impact"
          subtitle="A glimpse into the work we do every day"
        />

        <div className="mt-16 columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {galleryImages.map((image, index) => (
            <ScrollReveal
              key={index}
              delay={index * 0.1}
              className="break-inside-avoid"
            >
              <GlareHover
                glareColor="#2563EB"
                className="rounded-xl overflow-hidden group"
              >
                <div className="relative overflow-hidden rounded-xl">
                  <OptimizedImage
                    src={image.src}
                    alt={image.alt}
                    className={`w-full object-cover transition-transform duration-500 group-hover:scale-110 ${
                      index % 3 === 0
                        ? "aspect-[4/5]"
                        : index % 3 === 1
                          ? "aspect-[3/2]"
                          : "aspect-square"
                    }`}
                  />
                </div>
              </GlareHover>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.3} className="mt-12 text-center">
          <Button variant="primary" size="lg" as={Link} to="/gallery">
            View Full Gallery
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </ScrollReveal>
      </Container>
    </Section>
  );
}

function TestimonialsSection() {
  return (
    <Section background="white" className="section-padding">
      <Container>
        <SectionHeading
          title="Voices of Hope"
          subtitle="Hear from the people whose lives have been transformed"
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {TESTIMONIALS.map((testimonial, index) => (
            <motion.div key={index} variants={slideUp}>
              <div className="glass-card rounded-2xl p-8 h-full flex flex-col relative">
                <Quote className="absolute top-6 right-6 h-10 w-10 text-vibrant-blue/10" />

                <p className="font-body text-body-lg text-on-surface leading-relaxed flex-1 mb-6 italic">
                  &ldquo;{testimonial.content}&rdquo;
                </p>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-vibrant-blue/10 flex items-center justify-center">
                    <span className="font-display text-body-lg font-semibold text-vibrant-blue">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-body text-label-bold text-deep-navy">
                      {testimonial.name}
                    </p>
                    <p className="font-body text-caption text-on-surface-variant">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  );
}

function DonationCTASection() {
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden bg-deep-navy">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-vibrant-blue/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-hope-orange/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-vibrant-blue/5 blur-3xl" />
      </div>

      <Container className="relative z-10">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="font-display text-3xl md:text-5xl lg:text-display-lg-mobile text-white mb-6">
              Make a Difference Today
            </h2>
            <p className="font-body text-body-lg text-white/70 mb-10 leading-relaxed">
              Every donation helps us provide education, healthcare, food
              security, and hope to communities across Africa. Your generosity
              transforms lives and builds futures.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="orange" size="lg" as={Link} to="/donate">
                Donate Now
                <Heart className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="secondary"
                size="lg"
                as={Link}
                to="/partners"
                className="border-white text-white hover:bg-white/10"
              >
                Become a Partner
                <Users className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}

function PartnersSection() {
  return (
    <Section background="white" className="section-padding">
      <Container>
        <SectionHeading
          title="Trusted Partners"
          subtitle="Organizations that share our vision for a better Africa"
        />

        <div className="mt-12">
          <LogoLoop
            logos={partnerLogos}
            speed={80}
            direction="left"
            logoHeight={80}
            gap={48}
            pauseOnHover
            fadeOut
            fadeOutColor="#ffffff"
            scaleOnHover
            ariaLabel="Partner logos"
          />
        </div>
      </Container>
    </Section>
  );
}
