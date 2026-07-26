import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Heart,
  ArrowRight,
  ArrowUpRight,
  Stethoscope,
  Building2,
  Users,
  Activity,
  CheckCircle,
  Shield,
  Download,
  FileText,
  MapPin,
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
    slug: "child-education",
    title: "Child Education Project",
    image: "/images/child to school/child project_1.jpeg",
    category: "Child to School",
  },
  {
    slug: "borewell",
    title: "Borewell Project",
    image: "/borehole2/Picture1.webp",
    category: "Social Development",
  },
  {
    slug: "bethlehem-bread",
    title: "Bethlehem Bread",
    image: "/bread-baking/Picture44.webp",
    category: "Food Security",
  },
];

const galleryImages = [
  { src: "/images/healthcare/healthcare_1.jpg", alt: "Health outreach" },
  { src: "/images/healthcare/healthcare_2.jpg", alt: "Medical services" },
  { src: "/images/healthcare/healthcare_3.jpg", alt: "Community health education" },
  { src: "/images/healthcare/healthcare_4.jpg", alt: "Health worker visit" },
];

const keyFacts = [
  { icon: Building2, value: "4", label: "Health Clinics" },
  { icon: Users, value: "2,000+", label: "Families Served" },
  { icon: Activity, value: "15", label: "Health Workers" },
];

// Facts sourced from the Ohana Care Clinic 2026 newsletter
const ohanaCoreValues = [
  { letter: "E", name: "Excellence", desc: "High clinical standards and professional integrity in every service." },
  { letter: "C", name: "Compassion", desc: "Treating every patient with warmth, care, and respect." },
  { letter: "H", name: "Holistic Care", desc: "Addressing physical, emotional, and spiritual well-being." },
  { letter: "I", name: "Innovation", desc: "Creative solutions to overcome healthcare challenges." },
  { letter: "D", name: "Dignity", desc: "Respecting cultural, religious, and personal differences." },
];

const ohanaServices = [
  "General Medical Consultation",
  "Maternal and Child Healthcare",
  "Diabetic and Chronic Disease Management",
  "Diagnostic Laboratory Services",
  "Pharmacy and Medication Support",
];

const ohanaTimeline = [
  { date: "Nov 2025", label: "Foundation & Structural Works" },
  { date: "Dec 2025", label: "Layout & Internal Development" },
  { date: "Jan 2026", label: "Finishing & Installations" },
  { date: "Feb 2026", label: "Systems & Utilities Setup" },
  { date: "Mar 2026", label: "Final Touches & Completion" },
];

export default function HomeCare() {
  return (
    <PageTransition>
      <HeroSection />
      <StorySection />
      <OhanaClinicSection />
      <GallerySection />
      <ImpactSection />
      <NewsletterDownloadSection />
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
          src="/images/healthcare/healthcare_1.jpg"
          alt="Home Care Program"
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
              <span className="inline-block rounded-full bg-hope-orange px-5 py-2 font-body text-label-bold uppercase tracking-widest text-white">
                Health & Wellness
              </span>
            </motion.div>

            <div className="max-w-4xl mb-8">
              <SplitText
                text="Home Care"
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
              Transforming lives by providing compassionate home care for the elderly and vulnerable
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
              <div className="w-12 h-12 rounded-xl bg-hope-orange/10 flex items-center justify-center">
                <Stethoscope className="h-6 w-6 text-hope-orange" />
              </div>
              <span className="font-body text-label-bold text-hope-orange uppercase tracking-wider">
                About The Program
              </span>
            </div>

            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-deep-navy mb-8">
              Home Care
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className="space-y-6 font-body text-body-lg text-on-surface leading-relaxed">
              <p>
                As a non-profit organization, we are dedicated to transforming lives by providing compassionate home care for the elderly and vulnerable. Our mission ensures that those in need receive dignified care, access to essential services, and a supportive environment where they can thrive.
              </p>
              <p>
                We remain committed to uplifting underprivileged individuals by addressing key areas such as healthcare, nutrition, emotional well-being, and sustainable support systems. Beyond meeting physical needs, we offer psychological and moral support, ensuring that the elderly and vulnerable feel valued, safe, and cared for. Additionally, we promote employment opportunities in caregiving, empowering communities while improving the quality of life for those under our care.
              </p>
              <p>
                At the heart of our mission is the belief that everyone deserves respect, comfort, and companionship. We actively support initiatives that provide home-based care, medical assistance, and daily living support to ensure dignity in aging and resilience for the vulnerable.
              </p>
              <p>
                Furthermore, we uphold financial integrity and accountability, ensuring that all contributions directly impact those in need, creating lasting and meaningful change in their lives.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.3} className="mt-10">
            <div className="flex flex-wrap gap-4">
              {["Healthcare & Nutrition", "Emotional Well-being", "Dignified Care", "Financial Integrity"].map(
                (tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2 rounded-full bg-hope-orange/10 px-4 py-2 font-body text-label text-hope-orange"
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

// NEW — Ohana Care Clinic of Africa, sourced from the 2026 newsletter.
// A related primary healthcare initiative under KHMA's health pillar,
// run in partnership with the Sweet Aroma Foundation (SAF).
function OhanaClinicSection() {
  return (
    <Section background="gray" className="section-padding">
      <Container>
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-vibrant-blue/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-vibrant-blue" />
              </div>
              <span className="font-body text-label-bold text-vibrant-blue uppercase tracking-wider">
                Featured Health Initiative
              </span>
            </div>

            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-deep-navy mb-2">
              Ohana Care Clinic of Africa
            </h2>
            <p className="font-body text-body-md text-hope-orange font-semibold italic mb-6">
              "No One Left Behind"
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="flex items-center gap-2 mb-6 font-body text-body-md text-on-surface-variant">
              <MapPin className="h-5 w-5 text-hope-orange shrink-0" />
              Maili Nne, Eldoret–Uganda Road, Eldoret, Kenya
            </div>

            <div className="space-y-5 font-body text-body-lg text-on-surface leading-relaxed mb-10">
              <p>
                Ohana Care Clinic is a primary healthcare initiative established by the Sweet Aroma
                Foundation (SAF) in partnership with Kadesh Hope Mission of Africa (KHMA). It was
                founded to bring accessible, affordable, and compassionate healthcare to the
                fast-growing, underserved communities around Maili Nne — addressing everything from
                malaria and HIV/AIDS to diabetes, hypertension, and maternal health.
              </p>
              <p>
                The name "Ohana" means family, and that defines the clinic's approach: every patient
                is treated with dignity, warmth, and personal attention that goes beyond diagnosis and
                treatment to the emotional and spiritual needs of individuals and families.
              </p>
            </div>
          </ScrollReveal>

          {/* Core values */}
          <ScrollReveal delay={0.15}>
            <h3 className="font-display text-xl text-deep-navy mb-5">Core Values — E.C.H.O.I.D.</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
              {ohanaCoreValues.map((value) => (
                <div key={value.letter} className="bg-white rounded-xl border border-soft-accent/50 p-5 text-center">
                  <div className="w-10 h-10 rounded-full bg-vibrant-blue/10 flex items-center justify-center mx-auto mb-3">
                    <span className="font-display font-bold text-vibrant-blue">{value.letter}</span>
                  </div>
                  <p className="font-body text-label-bold text-deep-navy mb-1">{value.name}</p>
                  <p className="font-body text-caption text-on-surface-variant leading-snug">{value.desc}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Services offered */}
            <ScrollReveal delay={0.2}>
              <h3 className="font-display text-xl text-deep-navy mb-5">Services Offered</h3>
              <ul className="space-y-3">
                {ohanaServices.map((service) => (
                  <li key={service} className="flex items-start gap-3 font-body text-body-md text-on-surface">
                    <CheckCircle className="h-5 w-5 text-hope-orange shrink-0 mt-0.5" />
                    {service}
                  </li>
                ))}
              </ul>
            </ScrollReveal>

            {/* Journey timeline */}
            <ScrollReveal delay={0.25}>
              <h3 className="font-display text-xl text-deep-navy mb-5">Development Journey</h3>
              <div className="space-y-3">
                {ohanaTimeline.map((step) => (
                  <div key={step.date} className="flex items-center gap-4 bg-white rounded-lg border border-soft-accent/50 px-4 py-3">
                    <span className="font-body text-label-bold text-vibrant-blue w-24 shrink-0">{step.date}</span>
                    <span className="font-body text-body-md text-on-surface-variant">{step.label}</span>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
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
          subtitle="Moments from our Home Care program"
        />

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-[180px] sm:auto-rows-[160px] lg:auto-rows-[180px] gap-4">
          {galleryImages.map((image, index) => (
            <ScrollReveal
              key={index}
              delay={index * 0.1}
              className={`h-full ${index === 0 ? "sm:col-span-2 sm:row-span-2" : ""}`}
            >
              <GlareHover glareColor="#F37021" className="h-full rounded-xl overflow-hidden group">
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
          subtitle="Key facts about our Home Care program"
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
                  <div className="w-16 h-16 rounded-xl bg-hope-orange/10 flex items-center justify-center mx-auto mb-5">
                    <fact.icon className="h-8 w-8 text-hope-orange" />
                  </div>
                  <div className="font-display text-4xl md:text-5xl font-bold text-hope-orange mb-3">
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

// NEW — lets visitors download the full Ohana Care Clinic 2026 newsletter
// for the complete story, photos, and partnership details.
function NewsletterDownloadSection() {
  return (
    <Section background="gray" className="section-padding">
      <Container>
        <ScrollReveal>
          <div className="max-w-3xl mx-auto text-center bg-white rounded-2xl border border-soft-accent/50 shadow-card p-10 md:p-14">
            <div className="w-16 h-16 rounded-2xl bg-vibrant-blue/10 flex items-center justify-center mx-auto mb-6">
              <FileText className="h-8 w-8 text-vibrant-blue" />
            </div>
            <h3 className="font-display text-2xl md:text-3xl text-deep-navy mb-4">
              Read the Full Ohana Care Clinic Newsletter
            </h3>
            <p className="font-body text-body-md text-on-surface-variant mb-8 leading-relaxed">
              Get the complete story behind Ohana Care Clinic of Africa — our partnership with the
              Sweet Aroma Foundation, the full development journey, services offered, and photos
              from the opening — in our 2026 newsletter.
            </p>
            <a
              href="/documents/Ohana Clinic_Kadesh Newsletter 1.pdf"
              download
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="primary" size="lg">
                Download Newsletter (PDF)
                <Download className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </div>
        </ScrollReveal>
      </Container>
    </Section>
  );
}

function DonationCTA() {
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
              Support Community Healthcare
            </h2>
            <p className="font-body text-body-lg text-white/70 mb-10 leading-relaxed">
              Your donation helps us provide essential healthcare services to families who need them most. Together, we can ensure that quality healthcare reaches every community.
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
                    <span className="absolute top-4 left-4 inline-block rounded-full bg-hope-orange px-4 py-1.5 font-body text-caption font-medium text-white">
                      {project.category}
                    </span>
                  </div>

                  <div className="flex flex-col flex-1 p-6">
                    <h3 className="font-display text-headline-md text-deep-navy mb-2 group-hover:text-hope-orange transition-colors">
                      {project.title}
                    </h3>
                    <span className="inline-flex items-center gap-1.5 font-body text-label-bold text-hope-orange mt-auto">
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