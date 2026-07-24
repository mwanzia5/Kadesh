import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ArrowRight, CheckCircle } from "lucide-react";

import { staggerContainer, slideUp } from "@/animations/variants";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import OptimizedImage from "@/components/ui/OptimizedImage";
import GlareHover from "@/components/ui/GlareHover";
import SplitText from "@/components/ui/SplitText";
import ScrollReveal from "@/components/ui/ScrollReveal";
import SectionHeading from "@/components/ui/SectionHeading";
import { getProjectIcon } from "@/lib/projectIcons";

export function ProjectHero({ title, hero = {} }) {
  const {
    badge,
    heroTitle,
    subtitle,
    image,
    buttonText = "Support This Project",
    buttonLink = "/donate",
    buttonVariant = "lightblue",
  } = hero;

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        {image ? (
          <OptimizedImage src={image} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-deep-navy" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-deep-navy/80 via-deep-navy/60 to-deep-navy/90" />
      </div>

      <div className="relative z-10 w-full">
        <Container>
          <div className="flex flex-col items-center text-center text-white py-32">
            {badge && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-8"
              >
                <span className="inline-block rounded-full bg-vibrant-blue px-5 py-2 font-body text-label-bold uppercase tracking-widest text-white">
                  {badge}
                </span>
              </motion.div>
            )}

            <div className="max-w-4xl mb-8">
              <SplitText
                text={heroTitle || title || "Project Title"}
                className="font-display text-4xl md:text-6xl lg:text-7xl font-bold leading-tight block"
                delay={0.5}
                duration={0.8}
                stagger={0.02}
              />
            </div>

            {subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.0 }}
                className="font-body text-body-lg md:text-xl max-w-2xl text-white/80 mb-10"
              >
                {subtitle}
              </motion.p>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              <Button variant={buttonVariant} size="lg" as={Link} to={buttonLink}>
                {buttonText}
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

export function ProjectStory({ story = {} }) {
  const { icon, eyebrow = "Our Mission", heading, paragraphs = [], tags = [] } = story;
  const Icon = getProjectIcon(icon);
  const visibleParagraphs = paragraphs.filter((p) => p && p.trim());

  if (!heading && visibleParagraphs.length === 0) return null;

  return (
    <Section background="white" className="section-padding">
      <Container>
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-vibrant-blue/10 flex items-center justify-center">
                <Icon className="h-6 w-6 text-vibrant-blue" />
              </div>
              <span className="font-body text-label-bold text-vibrant-blue uppercase tracking-wider">
                {eyebrow}
              </span>
            </div>

            {heading && (
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-deep-navy mb-8">
                {heading}
              </h2>
            )}
          </ScrollReveal>

          {visibleParagraphs.length > 0 && (
            <ScrollReveal delay={0.2}>
              <div className="space-y-6 font-body text-body-lg text-on-surface leading-relaxed">
                {visibleParagraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </ScrollReveal>
          )}

          {tags.length > 0 && (
            <ScrollReveal delay={0.3} className="mt-10">
              <div className="flex flex-wrap gap-4">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2 rounded-full bg-vibrant-blue/10 px-4 py-2 font-body text-label text-vibrant-blue"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {tag}
                  </span>
                ))}
              </div>
            </ScrollReveal>
          )}
        </div>
      </Container>
    </Section>
  );
}

export function ProjectGallery({ gallery = [] }) {
  const images = gallery.filter((img) => img && img.src);
  if (images.length === 0) return null;

  return (
    <Section background="gray" className="section-padding">
      <Container>
        <SectionHeading title="Project Gallery" subtitle="Moments captured from this project" />

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <ScrollReveal
              key={index}
              delay={index * 0.08}
              className={index === 0 ? "sm:col-span-2 sm:row-span-2" : ""}
            >
              <GlareHover glareColor="#2563EB" className="h-full rounded-xl overflow-hidden group">
                <div className="relative overflow-hidden rounded-xl h-full">
                  <OptimizedImage
                    src={image.src}
                    alt={image.alt || "Project image"}
                    className={`w-full object-cover transition-transform duration-500 group-hover:scale-110 ${
                      index === 0 ? "aspect-square" : "aspect-[4/3]"
                    }`}
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

export function ProjectImpact({ impact = [] }) {
  const stats = impact.filter((s) => s && (s.value || s.label));
  if (stats.length === 0) return null;

  return (
    <Section background="white" className="section-padding">
      <Container>
        <SectionHeading title="Project Impact" subtitle="Key facts about this project" />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {stats.map((fact, i) => {
            const Icon = getProjectIcon(fact.icon);
            return (
              <motion.div key={i} variants={slideUp}>
                <GlareHover className="h-full">
                  <div className="text-center p-8 rounded-2xl bg-white border border-soft-accent/50 shadow-card h-full">
                    <div className="w-16 h-16 rounded-xl bg-vibrant-blue/10 flex items-center justify-center mx-auto mb-5">
                      <Icon className="h-8 w-8 text-vibrant-blue" />
                    </div>
                    <div className="font-display text-4xl md:text-5xl font-bold text-vibrant-blue mb-3">
                      {fact.value}
                    </div>
                    <p className="font-body text-body-lg text-on-surface-variant">{fact.label}</p>
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

export function ProjectCTA({ cta = {} }) {
  const {
    heading = "Help Us Continue This Work",
    text = "Your donation helps us keep this project going and reach even more people who need it.",
    buttonText = "Donate Now",
    buttonLink = "/donate",
  } = cta;

  return (
    <section className="relative py-20 lg:py-32 overflow-hidden bg-deep-navy">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-vibrant-blue/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-hope-orange/10 blur-3xl" />
      </div>

      <Container className="relative z-10">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="font-display text-3xl md:text-5xl text-white mb-6">{heading}</h2>
            <p className="font-body text-body-lg text-white/70 mb-10 leading-relaxed">{text}</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="lightblue" size="lg" as={Link} to={buttonLink}>
                {buttonText}
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
