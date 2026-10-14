import { Link, useNavigate } from "react-router-dom";
import {
  School,
  Heart,
  Users,
  ArrowRight,
  Quote,
  ArrowUpRight,
  Globe2,
  HandHeart,
  Sparkles,
} from "lucide-react";

import SEO from "@/components/ui/SEO";
import { getCMSContent, useCMSReady } from "@/hooks/useCMS";
import { PROGRAM_CATEGORIES, FEATURED_PROJECTS } from "@/lib/programs";
import Container from "@/components/ui/Container";
import OptimizedImage from "@/components/ui/OptimizedImage";
import ScrollReveal from "@/components/ui/ScrollReveal";

const pillarIcons = {
  School,
  Heart,
  Users,
};

const galleryImages = [
  {
    src: "/images/others/a-group-of-african-children-laughing-and-playing-with-water-in-rural-area-black-kids.webp",
    alt: "Children enjoying clean water",
  },
  { src: "/images/kadesh images_02.jpg", alt: "Lumina Charis School of Africa" },
  // This photo has a white frame baked into the file; zoom in to hide it.
  { src: "/images/kadesh images_03.jpg", alt: "Women's community gathering", trimFrame: true },
  { src: "/images/kadesh images_04.jpg", alt: "Pupils at Lumina Charis" },
  { src: "/images/kadesh images_05.jpg", alt: "A school celebration day" },
  { src: "/images/kadesh images_06.jpg", alt: "Ohana Care Clinic" },
];

const partnerLogos = [
  { src: "/images/logos/image1-removebg-preview.png", alt: "Partner 1" },
  { src: "/images/logos/image2-removebg-preview.png", alt: "Partner 2" },
  { src: "/images/logos/image3-removebg-preview.png", alt: "Partner 3" },
  { src: "/images/logos/image4-removebg-preview.png", alt: "Partner 4" },
  { src: "/images/logos/image5-removebg-preview.png", alt: "Partner 5" },
];

export default function Home() {
  useCMSReady();

  return (
    <div className="relative z-0 w-full bg-white pointer-events-auto">
      <SEO
        title="Home"
        description="Kadesh Hope Mission advances education, healthcare, food security, and social development across DR Congo, Uganda, and Kenya."
      />

      <HeroSection />
      <MissionIntroSection />
      <PillarsSection />
      <WhoWeAreSection />
      <ProjectsSection />
      <GallerySection />
      <PartnersSection />
      <DonationCTASection />
    </div>
  );
}

function PrimaryLink({ to, children, className = "" }) {
  return (
    <Link
      to={to}
      className={`relative z-10 inline-flex items-center justify-center rounded-full bg-vibrant-blue px-7 py-3.5 font-body text-sm font-semibold text-white shadow-lg transition-colors hover:bg-deep-navy ${className}`}
    >
      {children}
    </Link>
  );
}

function SecondaryLink({ to, children, className = "" }) {
  return (
    <Link
      to={to}
      className={`relative z-10 inline-flex items-center justify-center rounded-full border border-current px-7 py-3.5 font-body text-sm font-semibold transition-colors ${className}`}
    >
      {children}
    </Link>
  );
}

function HeroSection() {
  const heroTitle = getCMSContent("home", "heroTitle", "Hope Restored");
  const heroWords = String(heroTitle).trim().split(/\s+/);

  return (
    <section className="relative z-0 flex min-h-[94vh] items-center justify-center overflow-hidden bg-deep-navy">
      <style>{`
        @keyframes kadeshHeroWordReveal {
          0%, 8% {
            opacity: 0;
            transform: translateY(24px);
            filter: blur(6px);
          }
          18%, 72% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
          88%, 100% {
            opacity: 0;
            transform: translateY(-12px);
            filter: blur(3px);
          }
        }

        .kadesh-hero-word {
          display: inline-block;
          opacity: 0;
          animation: kadeshHeroWordReveal 5.2s cubic-bezier(0.22, 1, 0.36, 1) infinite;
          will-change: transform, opacity, filter;
        }

        .kadesh-hero-story,
        .kadesh-hero-donate {
          min-height: 56px;
          border-radius: 999px;
          transition: transform 220ms ease, background 220ms ease, border-color 220ms ease, box-shadow 220ms ease;
        }

        .kadesh-hero-story {
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid rgba(255, 255, 255, 0.82);
          color: #0F2654;
          box-shadow: 0 12px 30px rgba(6, 18, 43, 0.22);
        }

        .kadesh-hero-story:hover {
          transform: translateY(-2px);
          background: #ffffff;
          box-shadow: 0 16px 34px rgba(6, 18, 43, 0.28);
        }

        .kadesh-hero-donate {
          background: rgba(10, 30, 66, 0.52);
          border: 1px solid rgba(255, 255, 255, 0.34);
          color: #ffffff;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 10px 26px rgba(6, 18, 43, 0.16);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .kadesh-hero-donate:hover {
          transform: translateY(-2px);
          background: rgba(15, 38, 84, 0.78);
          border-color: rgba(255, 255, 255, 0.48);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 14px 30px rgba(6, 18, 43, 0.22);
        }

        .kadesh-hero-story:active,
        .kadesh-hero-donate:active {
          transform: translateY(0);
        }

        @media (prefers-reduced-motion: reduce) {
          .kadesh-hero-word {
            opacity: 1;
            animation: none;
            filter: none;
            transform: none;
          }
          .kadesh-hero-story,
          .kadesh-hero-donate {
            transition: none;
          }
        }
      `}</style>
      <div className="pointer-events-none absolute inset-0 z-0">
        <OptimizedImage
          src="/images/hero-children.jpg"
          alt="Kadesh Hope Mission community"
          className="h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-deep-navy/50" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-deep-navy/35 via-transparent to-deep-navy/85" />
      </div>

      <Container className="relative z-10 w-full">
        <div className="mx-auto flex max-w-5xl flex-col items-center px-2 py-28 text-center text-white md:py-36">
          <div className="mb-8 flex items-center justify-center gap-3 sm:gap-4">
            <span className="h-px w-6 shrink-0 bg-hope-orange sm:w-12" />
            <span className="whitespace-nowrap font-body text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 sm:text-xs sm:tracking-[0.28em]">
              {getCMSContent(
                "home",
                "heroBadge",
                "Serving Africa Since 2009",
              )}
            </span>
            <span className="h-px w-6 shrink-0 bg-hope-orange sm:w-12" />
          </div>

          <h1
            className="font-display text-6xl font-bold leading-[0.92] tracking-[-0.04em] text-white sm:text-7xl md:text-8xl lg:text-[7.2rem]"
            aria-label={heroTitle}
          >
            {heroWords.map((word, index) => (
              <span key={`${word}-${index}`} aria-hidden="true">
                <span
                  className="kadesh-hero-word"
                  style={{ animationDelay: `${index * 0.36}s` }}
                >
                  {word}
                </span>
                {index < heroWords.length - 1 ? " " : ""}
              </span>
            ))}
          </h1>

          <p className="mt-7 max-w-2xl text-balance font-body text-lg leading-relaxed text-white/82 sm:text-xl md:text-2xl">
            {getCMSContent(
              "home",
              "heroSubtitle",
              "Education, healthcare, food security, and opportunity for communities across Africa.",
            )}
          </p>

          <div className="relative z-20 mt-10 flex w-full flex-col items-center justify-center gap-3.5 sm:w-auto sm:flex-row">
            <Link
              to="/about"
              className="kadesh-hero-story group relative z-10 inline-flex w-full items-center justify-center gap-3 px-7 font-body text-[15px] font-semibold tracking-[0.005em] sm:w-[230px]"
            >
              <span>{getCMSContent("home", "heroCta2", "Know Our Story")}</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-deep-navy/[0.07] transition-transform duration-300 group-hover:translate-x-0.5">
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>

            <Link
              to="/donate"
              className="kadesh-hero-donate group relative z-10 inline-flex w-full items-center justify-center gap-3 px-7 font-body text-[15px] font-semibold tracking-[0.005em] sm:w-[230px]"
            >
              <span>{getCMSContent("home", "heroCta", "Donate Now")}</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/[0.08] transition-transform duration-300 group-hover:scale-105">
                <Heart className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </div>
      </Container>

      <div className="pointer-events-none absolute bottom-0 left-0 z-0 w-full leading-none">
        <svg
          viewBox="0 0 1440 90"
          preserveAspectRatio="none"
          className="h-[48px] w-full md:h-[76px]"
        >
          <path
            d="M0 44C187 72 373 77 558 55C738 33 893 21 1064 42C1209 60 1328 67 1440 46V90H0V44Z"
            fill="#F7F3EC"
          />
        </svg>
      </div>
    </section>
  );
}

function MissionIntroSection() {
  const items = [
    {
      icon: Globe2,
      number: "01",
      title: "Across Communities",
      text: "Serving communities across DR Congo, Uganda, and Kenya through locally focused initiatives that support children, families, and communities with compassion and care.",
    },
    {
      icon: HandHeart,
      number: "02",
      title: "Practical Support",
      text: "From education and nutritious meals to healthcare and essential resources, we focus on support that makes a meaningful difference in everyday life.",
    },
    {
      icon: Sparkles,
      number: "03",
      title: "Building Stronger Futures",
      text: "Through education, healthcare, nutritious meals, spiritual encouragement, and community support, we work to strengthen lives today while helping build a more hopeful future.",
    },
  ];

  // One colour per step, matching the "Our Foundation" pillars below.
  const pillarThemes = [
    { tile: "bg-[#E4EEFC] text-[#255DAB] ring-[#BCD3F2]", accent: "bg-[#255DAB]", line: "from-[#BCD3F2] to-[#C3DFCF]" },
    { tile: "bg-[#E3F2EA] text-[#28694F] ring-[#C3DFCF]", accent: "bg-[#28694F]", line: "from-[#C3DFCF] to-[#E8D2AE]" },
    { tile: "bg-[#FAEEDC] text-[#8B5A24] ring-[#E8D2AE]", accent: "bg-[#8B5A24]", line: "" },
  ];

  return (
    <section className="relative z-0 overflow-hidden bg-[#F7F3EC] py-20 md:py-28">
      <div className="pointer-events-none absolute -left-28 top-12 h-72 w-72 rounded-full border border-[#D7C49A]/30" />
      <div className="pointer-events-none absolute -left-14 top-24 h-44 w-44 rounded-full border border-[#D7C49A]/18" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#DDEBF4]/45 blur-3xl" />
      <span className="pointer-events-none absolute right-[4%] top-1/2 hidden -translate-y-1/2 font-display text-[15rem] font-bold leading-none text-deep-navy/[0.025] xl:block">
        2009
      </span>

      <Container className="relative z-10">
        <div className="grid items-center gap-14 lg:grid-cols-[0.88fr_1.12fr] lg:gap-20">
          <ScrollReveal direction="left">
            <div className="max-w-xl">
              <div className="flex items-center gap-3">
                <span className="h-px w-10 bg-hope-orange" />
                <p className="font-body text-xs font-bold uppercase tracking-[0.24em] text-hope-orange">
                  Kadesh Hope Mission of Africa
                </p>
              </div>

              <h2 className="mt-6 font-display text-4xl font-bold leading-[1.06] tracking-[-0.035em] text-deep-navy sm:text-5xl lg:text-[3.65rem]">
                Compassion in Action, Faith in Every Step, and Hope that Transforms Lives
              </h2>

              <p className="mt-6 max-w-lg font-body text-base leading-8 text-[#586473] sm:text-lg">
                Since 2009, Kadesh Hope Mission has served communities across Africa by meeting practical needs and sharing the hope of Jesus Christ. Through compassionate service, prayer, the teaching of God’s Word, and long-term community initiatives, we seek to see lives strengthened, families restored, and communities transformed.
              </p>

              <div className="mt-8 flex items-center gap-5 border-l-2 border-hope-orange/70 pl-5">
                <div>
                  <p className="font-display text-3xl font-bold text-deep-navy">15+ Years</p>
                  <p className="mt-1 font-body text-sm leading-6 text-[#6A7480]">
                    Sharing God’s love through compassionate action, Gospel outreach, and community transformation.
                  </p>
                </div>
              </div>

              <div className="mt-9">
                <Link
                  to="/about"
                  className="group inline-flex items-center gap-3 font-body text-sm font-bold text-deep-navy"
                >
                  <span className="border-b border-deep-navy/30 pb-1 transition group-hover:border-hope-orange group-hover:text-vibrant-blue">
                    Discover our story
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-deep-navy/15 bg-white transition group-hover:border-vibrant-blue group-hover:bg-vibrant-blue group-hover:text-white">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right">
            <div className="relative mx-auto w-full max-w-2xl">
              <div className="absolute -inset-5 rounded-[2.5rem] border border-[#E5D8BF]/70" />
              <div className="relative overflow-hidden rounded-[2.2rem] border border-[#E8DDCA] bg-white p-5 shadow-[0_28px_80px_-55px_rgba(15,38,82,0.5)] sm:p-9">
                <p className="font-body text-xs font-bold uppercase tracking-[0.24em] text-hope-orange">
                  How we serve
                </p>
                <ol className="mt-6">
                  {items.map((item, index) => {
                    const Icon = item.icon;
                    const theme = pillarThemes[index % pillarThemes.length];
                    return (
                      <li
                        key={item.title}
                        className={`group relative grid grid-cols-[48px_1fr] gap-4 sm:grid-cols-[56px_1fr] sm:gap-6 ${
                          index < items.length - 1 ? "pb-9" : ""
                        }`}
                      >
                        {index < items.length - 1 && (
                          <span
                            aria-hidden="true"
                            className={`absolute bottom-2 left-6 top-[3.75rem] w-0.5 sm:left-7 sm:top-[4.25rem] -translate-x-1/2 rounded-full bg-gradient-to-b ${theme.line}`}
                          />
                        )}
                        <div className="relative z-10">
                          <span
                            className={`flex h-12 w-12 items-center justify-center rounded-2xl sm:h-14 sm:w-14 ring-1 ring-inset transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_12px_24px_-12px_rgba(15,38,82,0.35)] ${theme.tile}`}
                          >
                            <Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.7} aria-hidden="true" />
                          </span>
                          <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-hope-orange px-1.5 font-body text-[10px] font-bold tracking-wider text-white shadow-sm">
                            {item.number}
                          </span>
                        </div>
                        <div className="pt-1">
                          <h3 className="font-display text-xl font-bold leading-snug text-deep-navy sm:text-2xl">
                            {item.title}
                          </h3>
                          <span
                            aria-hidden="true"
                            className={`mt-2 block h-0.5 w-8 rounded-full transition-all duration-300 group-hover:w-14 ${theme.accent}`}
                          />
                          <p className="mt-3 font-body text-[15px] leading-7 text-[#5C6876]">
                            {item.text}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </Container>
    </section>
  );
}

function PillarsSection() {
  const navigate = useNavigate();
  const themes = [
    {
      circle: "bg-[#EEF5FF] border-[#C7DAF3]",
      icon: "bg-white text-[#255DAB] border-[#C7DAF3]",
      ink: "text-[#255DAB]",
      glow: "from-white/90",
      badge: "bg-[#255DAB]",
      hover: "hover:border-[#9DBDE6]",
    },
    {
      circle: "bg-[#EDF7F2] border-[#CBE2D5]",
      icon: "bg-white text-[#28694F] border-[#CBE2D5]",
      ink: "text-[#28694F]",
      glow: "from-white/90",
      badge: "bg-[#28694F]",
      hover: "hover:border-[#A5CDB6]",
    },
    {
      circle: "bg-[#FCF4E8] border-[#EAD8BC]",
      icon: "bg-white text-[#8B5A24] border-[#EAD8BC]",
      ink: "text-[#8B5A24]",
      glow: "from-white/90",
      badge: "bg-[#8B5A24]",
      hover: "hover:border-[#DDBE8E]",
    },
  ];

  return (
    <section
      id="our-foundation"
      aria-labelledby="foundation-heading"
      className="relative z-0 overflow-hidden bg-[#FAFBFD] py-20 md:py-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-44 top-8 h-[24rem] w-[24rem] rounded-full border border-deep-navy/[0.06]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-36 bottom-0 h-72 w-72 rounded-full border border-hope-orange/[0.10]"
      />

      <Container className="relative z-10">
        <ScrollReveal className="mx-auto max-w-4xl text-center">
          <p className="font-body text-xs font-bold uppercase tracking-[0.22em] text-vibrant-blue">
            Our Foundation
          </p>
          <h2
            id="foundation-heading"
            className="mt-4 text-balance font-display text-4xl font-bold leading-tight tracking-[-0.03em] text-deep-navy md:text-5xl"
          >
            Three Pathways, One Shared Purpose
          </h2>
          <p className="mx-auto mt-5 max-w-2xl font-body text-base leading-7 text-on-surface-variant md:text-lg">
            Education, Healthcare, and Social Development — working together to
            strengthen children, families, and communities with dignity and hope.
          </p>
        </ScrollReveal>

        <div className="relative mx-auto mt-16 max-w-6xl">
          {/* Dotted path linking the three circles (desktop) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-[10%] right-[10%] top-1/2 hidden -translate-y-1/2 border-t-2 border-dotted border-[#C9D6E6] lg:block"
          />
          {["left-[33.33%]", "left-[66.66%]"].map((pos) => (
            <span
              key={pos}
              aria-hidden="true"
              className={`pointer-events-none absolute top-1/2 z-0 hidden h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-hope-orange shadow lg:block ${pos}`}
            />
          ))}

          <div className="grid gap-10 lg:grid-cols-3 lg:gap-8">
            {PROGRAM_CATEGORIES.slice(0, 3).map((category, index) => {
              const Icon = pillarIcons[category.icon] || Users;
              const theme = themes[index];

              return (
                <ScrollReveal
                  key={category.id}
                  delay={index * 0.1}
                  className="relative flex justify-center"
                >
                  <article
                    // The whole circle opens the pathway; the project links
                    // inside still go to their own pages.
                    onClick={(event) => {
                      if (event.target.closest("a")) return;
                      navigate(category.href);
                    }}
                    className={`group relative z-10 flex aspect-square cursor-pointer w-full max-w-[365px] flex-col items-center justify-center overflow-hidden rounded-full border px-7 py-8 text-center sm:px-9 sm:py-10 shadow-[0_22px_60px_-40px_rgba(15,38,82,0.30)] transition duration-500 hover:-translate-y-2 hover:shadow-[0_32px_70px_-42px_rgba(15,38,82,0.42)] ${theme.circle} ${theme.hover}`}
                  >
                    <div
                      aria-hidden="true"
                      className={`pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b to-transparent ${theme.glow}`}
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-[14px] rounded-full border border-white/80"
                    />

                    <div className="relative z-10 flex flex-col items-center">
                      <div className="relative">
                        <span
                          className={`flex h-16 w-16 items-center justify-center rounded-full border shadow-sm transition duration-300 group-hover:scale-105 ${theme.icon}`}
                        >
                          <Icon aria-hidden="true" className="h-7 w-7" strokeWidth={1.8} />
                        </span>
                        <span
                          className={`absolute -right-2 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 font-body text-[10px] font-bold tracking-wider text-white shadow-sm ${theme.badge}`}
                        >
                          0{index + 1}
                        </span>
                      </div>

                      <h3 className="mt-4 max-w-[270px] font-display text-2xl font-bold leading-tight text-deep-navy sm:mt-5 sm:text-[1.8rem]">
                        {category.title}
                      </h3>

                      <p className="mt-2 max-w-[285px] font-body text-[13px] leading-6 text-[#4F5C6D] sm:mt-3 sm:text-sm">
                        {category.description}
                      </p>

                      <div className="mt-5 flex max-w-[300px] flex-wrap justify-center gap-1.5">
                        {category.projects.slice(0, 2).map((project) => (
                          <Link
                            key={project.slug}
                            to={project.href}
                            className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-white bg-white/85 px-2.5 py-1.5 font-body text-[11px] font-semibold text-deep-navy shadow-sm transition hover:bg-white"
                          >
                            {project.label}
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        ))}
                      </div>

                      <Link
                        to={category.href}
                        className={`mt-4 inline-flex items-center gap-2 font-body text-sm font-bold sm:mt-5 ${theme.ink}`}
                      >
                        Explore {category.title.toLowerCase()}
                        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-current transition-transform duration-300 group-hover:translate-x-1">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </Link>
                    </div>
                  </article>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}

// Education, healthcare and community: same colours as the pillars above.
const whoWeAreFocus = [
  { icon: School, tile: "bg-[#E4EEFC] text-[#255DAB] ring-[#BCD3F2]" },
  { icon: Heart, tile: "bg-[#E3F2EA] text-[#28694F] ring-[#C3DFCF]" },
  { icon: Users, tile: "bg-[#FAEEDC] text-[#8B5A24] ring-[#E8D2AE]" },
];

function WhoWeAreSection() {
  const checks = [
    getCMSContent(
      "home",
      "whoWeCheck1",
      "Quality education access for every child",
    ),
    getCMSContent(
      "home",
      "whoWeCheck2",
      "Healthcare for underserved communities",
    ),
    getCMSContent(
      "home",
      "whoWeCheck3",
      "Social development and economic empowerment",
    ),
  ];

  return (
    <section className="relative z-0 overflow-hidden bg-[#F6F2EA] py-24 md:py-32">
      <div className="pointer-events-none absolute -left-28 top-16 h-72 w-72 rounded-full border border-deep-navy/[0.05]" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-vibrant-blue/[0.05] blur-3xl" />

      <Container className="relative z-10">
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-6 lg:pr-4">
            <p className="font-body text-xs font-bold uppercase tracking-[0.22em] text-hope-orange">
              Who We Are
            </p>

            <h2 className="mt-4 font-display text-4xl font-bold leading-tight tracking-[-0.03em] text-deep-navy md:text-5xl">
              {getCMSContent(
                "home",
                "whoWeAreTitle",
                "From a Journey of Service to a Growing Mission of Hope",
              )}
            </h2>

            <p className="mt-6 font-body text-base leading-8 text-[#526071] md:text-lg">
              {getCMSContent(
                "home",
                "whoWeAreDesc",
                "Founded in 2009, Kadesh Hope Mission began when a group of young people left India for the Democratic Republic of Congo to serve families living in poverty. Today, we work across Africa through education, healthcare, and community development — restoring hope and building brighter futures.",
              )}
            </p>

            <ul className="mt-8 grid gap-4">
              {checks.map((item, i) => {
                const { icon: Icon, tile } = whoWeAreFocus[i % whoWeAreFocus.length];
                return (
                  <li key={i} className="flex items-center gap-4">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${tile}`}
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                    </span>
                    <span className="font-body text-base font-medium leading-6 text-deep-navy">
                      {item}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-9">
              <Link
                to="/about"
                className="group inline-flex items-center gap-3 rounded-full border border-deep-navy bg-deep-navy py-2 pl-6 pr-2 font-body text-sm font-semibold text-white shadow-[0_14px_30px_-16px_rgba(15,38,82,0.55)] transition duration-300 hover:-translate-y-0.5 hover:border-vibrant-blue hover:bg-vibrant-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vibrant-blue focus-visible:ring-offset-2"
              >
                {getCMSContent("home", "whoWeAreCta", "Get to Know Us")}
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-deep-navy transition duration-300 group-hover:translate-x-0.5 group-hover:text-vibrant-blue">
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative mx-auto max-w-xl pb-14">
              <div className="overflow-hidden rounded-[2rem] border-[8px] border-white shadow-[0_32px_80px_-42px_rgba(15,38,82,0.45)]">
                <OptimizedImage
                  src="/images/gallery/kadesh images_04.jpg"
                  alt="Children at a Kadesh Hope Mission school"
                  className="aspect-[4/5] w-full object-cover"
                />
              </div>

              <div className="pointer-events-none absolute -bottom-1 left-5 right-5 rounded-[1.6rem] bg-deep-navy p-6 shadow-[0_20px_55px_-30px_rgba(15,38,82,0.75)] sm:left-[-2rem] sm:right-auto sm:max-w-sm">
                <Quote className="h-7 w-7 text-hope-orange" />
                <p className="mt-3 font-display text-lg font-bold leading-relaxed text-white">
                  Hope becomes meaningful when it is translated into
                  opportunity.
                </p>
                <p className="mt-3 font-body text-sm leading-6 text-white/70">
                  We work alongside communities so that support becomes a
                  stronger foundation for the future.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

// Category tag colours, matching the Three Pathways circles.
const projectCategoryChip = {
  education: "bg-[#255DAB]",
  healthcare: "bg-[#28694F]",
  "social-development": "bg-[#8B5A24]",
};

function ProjectsSection() {
  return (
    <section
      id="our-projects"
      aria-labelledby="projects-heading"
      className="relative z-0 overflow-hidden bg-[#F7F3EC] py-20 md:py-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full border border-deep-navy/[0.06]"
      />
      <Container className="relative">
        <ScrollReveal className="flex flex-col gap-6 border-b border-deep-navy/15 pb-9 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="font-body text-xs font-bold uppercase tracking-[0.22em] text-vibrant-blue">
              Our Projects
            </p>
            <h2
              id="projects-heading"
              className="mt-4 text-balance font-display text-4xl font-bold leading-tight tracking-[-0.03em] text-deep-navy md:text-5xl"
            >
              Where Every Project Builds a Stronger Future
            </h2>
          </div>
          <p className="max-w-xs shrink-0 font-body text-sm leading-7 text-on-surface-variant lg:max-w-[220px]">
            From the classroom to the clinic, discover four ways we put
            compassion into action.
          </p>
        </ScrollReveal>

        {/* Phones: a swipeable row; tablet and up: a grid */}
        <div className="-mx-5 mt-10 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
          {FEATURED_PROJECTS.map((project, index) => {
            const category = PROGRAM_CATEGORIES.find((item) =>
              item.projects.some((entry) => entry.slug === project.slug),
            );
            const chip =
              projectCategoryChip[category?.id] || projectCategoryChip.education;
            const title =
              project.slug === "ohana-care" ? "Ohana Care Clinic" : project.title;
            const projectImage =
              project.slug === "ohana-care"
                ? "/images/kadesh images_06.jpg"
                : project.image;
            return (
              <ScrollReveal
                key={project.slug}
                delay={index * 0.08}
                className="h-full w-[80%] shrink-0 snap-start sm:w-auto"
              >
                <Link
                  to={project.href}
                  className="group relative flex aspect-[4/5] h-full flex-col justify-end overflow-hidden rounded-[1.6rem] bg-deep-navy shadow-[0_24px_50px_-38px_rgba(15,38,82,0.6)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_60px_-34px_rgba(15,38,82,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vibrant-blue focus-visible:ring-offset-2 sm:aspect-[3/4]"
                >
                  <OptimizedImage
                    src={projectImage}
                    alt={project.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 motion-safe:group-hover:scale-105"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B1C3D] via-[#0B1C3D]/55 to-transparent"
                  />
                  <span
                    className={`absolute left-4 top-4 rounded-full px-3 py-1.5 font-body text-[11px] font-bold uppercase tracking-[0.12em] text-white shadow-sm ${chip}`}
                  >
                    {category?.title}
                  </span>
                  <div className="relative p-5 sm:p-6">
                    <h3 className="font-display text-2xl font-bold leading-tight text-white">
                      {title}
                    </h3>
                    <p className="mt-2 line-clamp-3 font-body text-sm leading-6 text-white/80">
                      {project.description}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-2 font-body text-sm font-semibold text-white">
                      Explore project
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/40 transition duration-300 group-hover:border-white group-hover:bg-white group-hover:text-deep-navy">
                        <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                      </span>
                    </span>
                  </div>
                </Link>
              </ScrollReveal>
            );
          })}
        </div>
        <ScrollReveal className="mt-10 text-center">
          <Link
            to="/projects"
            className="group inline-flex items-center gap-3 rounded-full border border-deep-navy bg-deep-navy py-2 pl-6 pr-2 font-body text-sm font-semibold text-white shadow-[0_14px_30px_-16px_rgba(15,38,82,0.55)] transition duration-300 hover:-translate-y-0.5 hover:border-vibrant-blue hover:bg-vibrant-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vibrant-blue focus-visible:ring-offset-2"
          >
            View all projects
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-deep-navy transition duration-300 group-hover:translate-x-0.5 group-hover:text-vibrant-blue">
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </span>
          </Link>
        </ScrollReveal>
      </Container>
    </section>
  );
}

function GallerySection() {
  // Bento grid. Desktop (4 columns x 3 rows):  [1 1 2 3] [1 1 4 4] [5 5 6 6]
  // Phones (2 columns): first photo full width, then pairs, last full width.
  const layouts = [
    "col-span-2 row-span-2",
    "col-span-1 row-span-1",
    "col-span-1 row-span-1",
    "col-span-2 row-span-1 lg:col-span-2",
    "col-span-1 row-span-1 lg:col-span-2",
    "col-span-1 row-span-1 lg:col-span-2",
  ];

  const galleryButton = (
    <Link
      to="/gallery"
      className="group inline-flex items-center gap-3 rounded-full border border-deep-navy bg-deep-navy py-2 pl-6 pr-2 font-body text-sm font-semibold text-white shadow-[0_14px_30px_-16px_rgba(15,38,82,0.55)] transition duration-300 hover:-translate-y-0.5 hover:border-vibrant-blue hover:bg-vibrant-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vibrant-blue focus-visible:ring-offset-2"
    >
      {getCMSContent("home", "galleryCta", "View full gallery")}
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-deep-navy transition duration-300 group-hover:translate-x-0.5 group-hover:text-vibrant-blue">
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </span>
    </Link>
  );

  return (
    <section className="relative z-0 overflow-hidden bg-white py-20 md:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-28 top-16 h-72 w-72 rounded-full border border-vibrant-blue/[0.07]"
      />

      <Container className="relative z-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="font-body text-xs font-bold uppercase tracking-[0.22em] text-hope-orange">
              Moments of Impact
            </p>
            <h2 className="mt-4 font-display text-4xl font-bold leading-tight tracking-[-0.03em] text-deep-navy md:text-5xl">
              A Mission in Motion: Hope Is Seen in the Moments That Change Everyday Life
            </h2>
            <p className="mt-4 max-w-xl font-body text-base leading-7 text-on-surface-variant md:text-lg">
              {getCMSContent(
                "home",
                "gallerySub",
                "A visual journey through education, healthcare, clean water, food support, and everyday moments of hope.",
              )}
            </p>
          </div>
          <div className="shrink-0">{galleryButton}</div>
        </div>

        <div className="mt-10 grid auto-rows-[130px] grid-cols-2 gap-3 sm:auto-rows-[180px] md:gap-4 lg:auto-rows-[190px] lg:grid-cols-4">
          {galleryImages.map((image, index) => (
            <ScrollReveal
              key={image.src}
              delay={(index % 3) * 0.06}
              className={`h-full ${layouts[index]}`}
            >
              <Link
                to="/gallery"
                aria-label={`Open gallery: ${image.alt}`}
                className="group relative block h-full overflow-hidden rounded-2xl bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vibrant-blue focus-visible:ring-offset-2 md:rounded-[1.4rem]"
              >
                <OptimizedImage
                  src={image.src}
                  alt={image.alt}
                  className={`h-full w-full object-cover transition-transform duration-700 ${
                    image.trimFrame
                      ? "scale-[1.07] motion-safe:group-hover:scale-[1.12]"
                      : "motion-safe:group-hover:scale-[1.06]"
                  }`}
                />
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

function PartnersSection() {
  return (
    <section className="relative z-0 overflow-hidden border-y border-[#E9E1D3] bg-[#F8F5EF] py-20 md:py-24">
      <style>{`
        @keyframes kadeshPartnerMarquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .kadesh-partner-track {
          animation: kadeshPartnerMarquee 30s linear infinite;
          will-change: transform;
        }
        .kadesh-partner-marquee:hover .kadesh-partner-track {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .kadesh-partner-track {
            animation: none;
            flex-wrap: wrap;
            justify-content: center;
            width: auto;
          }
          .kadesh-partner-track > li[aria-hidden="true"] { display: none; }
        }
      `}</style>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full border border-vibrant-blue/[0.08]"
      />

      <Container className="relative z-10">
        <div className="grid items-end gap-8 lg:grid-cols-[1fr_0.8fr]">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <span className="h-px w-9 bg-vibrant-blue/60" />
              <p className="font-body text-xs font-bold uppercase tracking-[0.24em] text-vibrant-blue">
                Trusted Partners
              </p>
            </div>
            <h2 className="mt-5 font-display text-4xl font-bold leading-tight tracking-[-0.03em] text-deep-navy md:text-5xl">
              Partnership makes meaningful work travel further
            </h2>
          </div>

          <div className="lg:justify-self-end">
            <p className="max-w-xl font-body text-base leading-7 text-[#637080]">
              {getCMSContent(
                "home",
                "partnersSub",
                "We are grateful for organizations that share our commitment to practical service, dignity, and long-term community impact.",
              )}
            </p>
            <Link
              to="/contact"
              className="group mt-4 inline-flex items-center gap-2 font-body text-sm font-bold text-deep-navy"
            >
              <span className="border-b border-deep-navy/30 pb-0.5 transition group-hover:border-hope-orange group-hover:text-vibrant-blue">
                Become a partner
              </span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

      </Container>

      {/* Scrolling logo strip: two copies loop seamlessly; pauses on hover */}
      <div className="kadesh-partner-marquee relative mt-12 overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#F8F5EF] to-transparent sm:w-32"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#F8F5EF] to-transparent sm:w-32"
        />
        <ul className="kadesh-partner-track flex w-max py-3">
          {[...partnerLogos, ...partnerLogos].map((logo, index) => (
            <li
              key={`${logo.src}-${index}`}
              aria-hidden={index >= partnerLogos.length ? "true" : undefined}
              className="mr-4 shrink-0 sm:mr-5"
            >
              <div className="group flex h-28 w-48 items-center justify-center rounded-2xl border border-[#E6DDCE] bg-white px-5 shadow-[0_14px_34px_-30px_rgba(15,38,82,.45)] transition duration-300 hover:-translate-y-1 hover:border-[#D7C49A] sm:h-32 sm:w-60">
                <img
                  src={logo.src}
                  alt={index < partnerLogos.length ? logo.alt : ""}
                  loading="lazy"
                  className="h-16 w-auto max-w-[85%] object-contain transition duration-300 group-hover:scale-105 sm:h-20"
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function DonationCTASection() {
  return (
    <section className="relative z-0 bg-[#F7F3EC] py-20 md:py-28">
      <Container>
        <div className="relative overflow-hidden rounded-[2.25rem] bg-gradient-to-br from-[#0F2652] via-[#12366D] to-[#1E5BAB] px-6 py-14 text-white shadow-[0_40px_100px_-60px_rgba(15,38,82,0.9)] sm:px-10 md:px-16 md:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(243,112,33,0.22),transparent_40%),radial-gradient(circle_at_10%_100%,rgba(255,255,255,0.10),transparent_45%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full border border-white/10"
          />

          <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[1fr_auto] lg:gap-16">
            <div className="max-w-3xl">
              <p className="font-body text-xs font-bold uppercase tracking-[0.22em] text-[#FFB27A]">
                Make a Difference Today
              </p>

              <h2 className="mt-4 font-display text-4xl font-bold leading-tight tracking-[-0.03em] text-white md:text-5xl">
                {getCMSContent(
                  "home",
                  "donateCtaTitle",
                  "Help turn compassion into lasting opportunity",
                )}
              </h2>

              <p className="mt-5 max-w-2xl font-body text-base leading-7 text-white/75 md:text-lg">
                {getCMSContent(
                  "home",
                  "donateCtaDesc",
                  "Every donation helps us provide education, healthcare, food security, and hope to communities across Africa. Your generosity transforms lives and builds futures.",
                )}
              </p>

            </div>

            <div className="relative z-20 flex flex-col gap-3 sm:flex-row lg:w-64 lg:flex-col">
              <Link
                to="/donate"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-hope-orange px-7 py-3.5 font-body text-base font-semibold text-white shadow-[0_14px_30px_-12px_rgba(243,112,33,0.7)] transition hover:-translate-y-0.5 hover:bg-[#E5641A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                {getCMSContent("home", "donateCtaBtn", "Donate Now")}
                <Heart className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link
                to="/sponsor-a-child"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 font-body text-base font-semibold text-deep-navy transition hover:-translate-y-0.5 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                Sponsor a Child
                <School className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/35 px-7 py-3.5 font-body text-base font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                {getCMSContent("home", "donatePartnerBtn", "Become a Partner")}
                <Users className="h-5 w-5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
