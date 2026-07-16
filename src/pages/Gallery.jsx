import { useState, useMemo } from "react";
import { Search, Camera, Loader2 } from "lucide-react";

import PageTransition from "@/animations/PageTransition";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import ScrollReveal from "@/components/ui/ScrollReveal";
import SectionHeading from "@/components/ui/SectionHeading";
import DomeGallery from "@/components/ui/DomeGallery";
import useMediaQuery from "@/hooks/useMediaQuery";
import { useGalleryImages } from "@/hooks/useGallery";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "All",
  "Education",
  "Health",
  "Food Security",
  "Women & Youth",
  "Community",
];

const CATEGORY_MAP = {
  education: "Education",
  health: "Health",
  food: "Food Security",
  foodsecurity: "Food Security",
  women: "Women & Youth",
  youth: "Women & Youth",
  community: "Community",
};

const FALLBACK_IMAGES = [
  { src: "/images/others/group-of-girls-playing.webp", title: "Community Outreach", category: "community" },
  { src: "/images/kadesh images_02.jpg", title: "Healthcare Services", category: "health" },
  { src: "/images/kadesh images_03.png", title: "Education Program", category: "education" },
  { src: "/images/kadesh images_04.jpg", title: "Food Distribution", category: "food" },
  { src: "/images/kadesh images_05.jpg", title: "Community Gathering", category: "community" },
  { src: "/images/kadesh images_06.jpg", title: "Medical Camp", category: "health" },
  { src: "/images/kadesh images_07.jpg", title: "Women Empowerment", category: "women" },
  { src: "/images/kadesh images_08.jpg", title: "School Learning", category: "education" },
  { src: "/images/kadesh images_09.jpg", title: "Agricultural Training", category: "food" },
  { src: "/images/kadesh images_10.jpg", title: "Volunteer Work", category: "community" },
  { src: "/images/kadesh images_11.jpg", title: "Youth Development", category: "women" },
  { src: "/images/kadesh images_12.jpg", title: "Community Health", category: "health" },
  { src: "/images/healthcare/healthcare_1.jpg", title: "Healthcare Initiative", category: "health" },
  { src: "/images/child to school/child project_1.jpeg", title: "Child Education", category: "education" },
  { src: "/images/Lumina School/Lumina School_01.jpeg", title: "Lumina School", category: "education" },
  { src: "/images/womensproject_1.jpeg", title: "Women's Project", category: "women" },
];

export default function Gallery() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { data: dbImages, isLoading } = useGalleryImages();

  const allImages = useMemo(() => {
    const dbList = dbImages?.data;
    if (dbList && dbList.length > 0) {
      return dbList.map((img) => ({
        src: img.image_url,
        title: img.title,
        category: img.category,
        id: img.id,
      }));
    }
    return FALLBACK_IMAGES;
  }, [dbImages]);

  const filteredImages = useMemo(() => {
    return allImages.filter((img) => {
      const imgCat = CATEGORY_MAP[img.category?.toLowerCase()] || img.category;
      const matchesCategory =
        activeFilter === "All" ||
        imgCat?.toLowerCase() === activeFilter.toLowerCase();

      const matchesSearch =
        searchQuery === "" ||
        img.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        img.category?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [allImages, activeFilter, searchQuery]);

  const domeImages = useMemo(
    () => filteredImages.map((img) => ({ src: img.src, alt: img.title })),
    [filteredImages]
  );

  const imageCategories = useMemo(
    () =>
      filteredImages.map((img) => {
        const mapped = CATEGORY_MAP[img.category?.toLowerCase()];
        return mapped || img.category || "Other";
      }),
    [filteredImages]
  );

  const highlightCat =
    activeFilter === "All" ? null : activeFilter;

  return (
    <PageTransition>
      <HeroSection />

      <Section background="white" className="pt-16 pb-10">
        <Container>
          <div className="max-w-xl mx-auto mb-10">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search photos..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-soft-accent/60 bg-surface font-body text-body-md text-deep-navy placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-vibrant-blue/40 focus:border-vibrant-blue transition-all"
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setActiveFilter(category)}
                className={cn(
                  "px-5 py-2 rounded-full font-body text-label-bold transition-all duration-300",
                  activeFilter === category
                    ? "bg-vibrant-blue text-white shadow-md"
                    : "bg-surface-variant/40 text-on-surface-variant hover:bg-surface-variant hover:text-deep-navy"
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </Container>
      </Section>

      <section className="relative w-full h-[60vh] sm:h-[75vh] md:h-[85vh] min-h-[400px] sm:min-h-[500px] md:min-h-[600px] bg-deep-navy overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60 px-6 text-center">
            <Loader2 className="h-12 w-12 mb-4 animate-spin opacity-60" />
            <p className="font-body text-body-lg">Loading gallery...</p>
          </div>
        ) : domeImages.length > 0 ? (
          <DomeGallery
            images={domeImages}
            fit={0.8}
            minRadius={isMobile ? 300 : 600}
            maxVerticalRotationDeg={0}
            segments={isMobile ? 20 : 34}
            dragDampening={2}
            grayscale={false}
            autoRotate
            autoRotateSpeed={isMobile ? 0.1 : 0.15}
            highlightCategory={highlightCat}
            imageCategories={imageCategories}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60 px-6 text-center">
            <Camera className="h-16 w-16 mb-4 opacity-40" />
            <p className="font-body text-body-lg">
              No photos found. Try a different search or filter.
            </p>
          </div>
        )}
      </section>
    </PageTransition>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-deep-navy via-vibrant-blue/90 to-deep-navy">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-[10%] w-64 h-64 rounded-full bg-hope-orange/30 blur-3xl" />
          <div className="absolute bottom-10 right-[15%] w-80 h-80 rounded-full bg-vibrant-blue/30 blur-3xl" />
        </div>
      </div>

      <div className="relative z-10 w-full">
        <Container>
          <div className="flex flex-col items-center text-center text-white py-24">
            <ScrollReveal>
              <span className="inline-block rounded-full bg-hope-orange/90 px-5 py-2 font-body text-label-bold uppercase tracking-widest text-white mb-8">
                Our Gallery
              </span>
            </ScrollReveal>
            <SectionHeading
              title="Moments of Impact"
              subtitle="A visual journey through our work across Africa"
              light
            />
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
