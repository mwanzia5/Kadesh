import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Heart,
  ArrowRight,
  ArrowUpRight,
  Droplets,
  MapPin,
  Users,
  CheckCircle,
  Shield,
  Zap,
} from "lucide-react";

import PageTransition from "@/animations/PageTransition";
import {
  staggerContainer,
  slideUp,
  smoothTransition,
} from "@/animations/variants";

import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import OptimizedImage from "@/components/ui/OptimizedImage";
import GlareHover from "@/components/ui/GlareHover";
import SplitText from "@/components/ui/SplitText";
import ScrollReveal from "@/components/ui/ScrollReveal";
import SectionHeading from "@/components/ui/SectionHeading";

const relatedProjects = [
  {
    slug: "community",
    title: "Community Projects",
    image: "/images/others/african-children-playing-football-in-the-village-near-mount-kilimanjaro-east-africa.webp",
    category: "Social Development",
  },
  {
    slug: "women-projects",
    title: "Women Projects",
    image: "/images/womensproject_1.jpeg",
    category: "Social Development",
  },
  {
    slug: "bethlehem-bread",
    title: "Bethlehem Bread",
    image: "/images/Breadproject/Breadproject_1.png",
    category: "Food Security",
  },
];

const galleryImages = [
  { src: "/Eldoret/IMG-20250624-WA0026.jpg", alt: "Eldoret outreach" },
  { src: "/images/borewell project/borewell project_2.jpg", alt: "Clean water access" },
  { src: "/images/borewell project/borewell project_3.jpg", alt: "Community water point" },
  { src: "/images/borewell project/borewell project_4.jpg", alt: "Water purification system" },
  { src: "/images/borewell project/borewell project_5.jpg", alt: "Borewell community impact" },
];

const keyFacts = [
  { icon: Droplets, value: "25+", label: "Borewells Installed" },
  { icon: Users, value: "10,000+", label: "People Served" },
  { icon: MapPin, value: "3", label: "Regions Covered" },
];

export default function Borewell() {
  return (
    <PageTransition>
      <HeroSection />
      <StorySection />
      <GallerySection />
      <ImpactSection />
      <DonationCTA />
      <RelatedProjects />
    </PageTransition>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <OptimizedImage
          src="/images/borewell project/borewell project_1.jpg"
          alt="Borewell Project"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-deep-navy/80 via-deep-navy/60 to-deep-navy/90" />
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
                Social Development
              </span>
            </motion.div>

            <div className="max-w-4xl mb-8">
              <SplitText
                text="Borewell Project"
                className="font-display text-4xl md:text-6xl lg:text-7xl font-bold leading-tight block"
                delay={0.5}
                duration={0.8}
                stagger={0.02}
              />
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              className="font-body text-body-lg md:text-xl max-w-2xl text-white/80 mb-10"
            >
              Water is life, and our Borewell Project ensures communities can access clean and safe drinking water
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              <Button variant="lightblue" size="lg" as={Link} to="/donate">
                Support This Project
                <Heart className="ml-2 h-5 w-5" />
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

function StorySection() {
  return (
    <Section background="white" className="section-padding">
      <Container>
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-vibrant-blue/10 flex items-center justify-center">
                <Droplets className="h-6 w-6 text-vibrant-blue" />
              </div>
              <span className="font-body text-label-bold text-vibrant-blue uppercase tracking-wider">
                About The Project
              </span>
            </div>

            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-deep-navy mb-8">
              Borewell Project
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className="space-y-6 font-body text-body-lg text-on-surface leading-relaxed">
              <p>
                Water is life, and our Borewell Project ensures communities can access clean and safe drinking water.
              </p>
              <p>
                This initiative focuses on drilling borewells, installing hand pumps, and implementing water conservation techniques in areas where water scarcity is a critical issue.
              </p>
              <p>
                The project involves engaging local communities in maintaining and managing water resources, fostering a sense of ownership and responsibility. By providing access to clean water, we help reduce waterborne diseases and improve overall health and productivity.
              </p>
              <p>
                Our Borewell Project is not just about access to water; it's about transforming lives by ensuring that families no longer have to spend hours fetching water, allowing them more time to pursue education and economic activities.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.3} className="mt-10">
            <div className="flex flex-wrap gap-4">
              {["Clean Water Access", "Water Conservation", "Community Management", "Health & Productivity"].map(
                (tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2 rounded-full bg-vibrant-blue/10 px-4 py-2 font-body text-label text-vibrant-blue"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {tag}
                  </span>
                )
              )}
            </div>
          </ScrollReveal>
        </div>
      </Container>
    </Section>
  );
}

function GallerySection() {
  return (
    <Section background="gray" className="section-padding">
      <Container>
        <SectionHeading
          title="Project Gallery"
          subtitle="Moments from our Borewell Project"
        />

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-[180px] sm:auto-rows-[160px] lg:auto-rows-[180px] gap-4">
          {galleryImages.map((image, index) => (
            <ScrollReveal
              key={index}
              delay={index * 0.1}
              className={`h-full ${index === 0 ? "sm:col-span-2 sm:row-span-2" : ""}`}
            >
              <GlareHover glareColor="#2563EB" className="h-full rounded-xl overflow-hidden group">
                <div className="relative h-full w-full overflow-hidden rounded-xl">
                  <OptimizedImage
                    src={image.src}
                    alt={image.alt}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
              </GlareHover>
            </ScrollReveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

function ImpactSection() {
  return (
    <Section background="white" className="section-padding">
      <Container>
        <SectionHeading
          title="Project Impact"
          subtitle="Key facts about our Borewell Project"
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {keyFacts.map((fact) => (
            <motion.div key={fact.label} variants={slideUp}>
              <GlareHover className="h-full">
                <div className="text-center p-8 rounded-2xl bg-white border border-soft-accent/50 shadow-card h-full">
                  <div className="w-16 h-16 rounded-xl bg-vibrant-blue/10 flex items-center justify-center mx-auto mb-5">
                    <fact.icon className="h-8 w-8 text-vibrant-blue" />
                  </div>
                  <div className="font-display text-4xl md:text-5xl font-bold text-vibrant-blue mb-3">
                    {fact.value}
                  </div>
                  <p className="font-body text-body-lg text-on-surface-variant">
                    {fact.label}
                  </p>
                </div>
              </GlareHover>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  );
}

function DonationCTA() {
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden bg-deep-navy">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-vibrant-blue/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-hope-orange/10 blur-3xl" />
      </div>

      <Container className="relative z-10">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="font-display text-3xl md:text-5xl text-white mb-6">
              Bring Clean Water to a Community
            </h2>
            <p className="font-body text-body-lg text-white/70 mb-10 leading-relaxed">
              Your donation helps us drill borewells and install water purification systems in communities that need them most. Together, we can ensure every family has access to clean, safe drinking water.
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
                Contact Us
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}

function RelatedProjects() {
  return (
    <Section background="white" className="section-padding">
      <Container>
        <SectionHeading
          title="Related Projects"
          subtitle="Explore more of our initiatives"
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {relatedProjects.map((project) => (
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
                    <span className="inline-flex items-center gap-1.5 font-body text-label-bold text-vibrant-blue mt-auto">
                      Learn More
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>
                </Link>
              </GlareHover>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  );
}
