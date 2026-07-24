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
  { src: "/Eldoret/Among Students.jpg", title: "Among Students", category: "education" },
  { src: "/Eldoret/Asians_Hindus.jpg", title: "Asians Hindus", category: "community" },
  { src: "/Eldoret/Asians_Hindus_1.jpg", title: "Asians Hindus 1", category: "community" },
  { src: "/Eldoret/IMG-20250326-WA0021.jpg", title: "IMG-20250326-WA0021", category: "community" },
  { src: "/Eldoret/IMG-20250624-WA0026.jpg", title: "IMG-20250624-WA0026", category: "community" },
  { src: "/Eldoret/IMG-20250624-WA0027.jpg", title: "IMG-20250624-WA0027", category: "community" },
  { src: "/Eldoret/IMG-20250624-WA0028.jpg", title: "IMG-20250624-WA0028", category: "community" },
  { src: "/Eldoret/IMG-20250624-WA0029.jpg", title: "IMG-20250624-WA0029", category: "community" },
  { src: "/Eldoret/IMG-20250624-WA0030.jpg", title: "IMG-20250624-WA0030", category: "community" },
  { src: "/Eldoret/IMG-20250624-WA0040.jpg", title: "IMG-20250624-WA0040", category: "community" },
  { src: "/Eldoret/IMG-20250624-WA0041.jpg", title: "IMG-20250624-WA0041", category: "community" },
  { src: "/Eldoret/IMG-20250624-WA0042.jpg", title: "IMG-20250624-WA0042", category: "community" },
  { src: "/Eldoret/IMG-20250624-WA0043.jpg", title: "IMG-20250624-WA0043", category: "community" },
  { src: "/Eldoret/IMG-20250624-WA0044.jpg", title: "IMG-20250624-WA0044", category: "community" },
  { src: "/Eldoret/IMG-20250624-WA0045.jpg", title: "IMG-20250624-WA0045", category: "community" },
  { src: "/Eldoret/IMG-20250624-WA0046.jpg", title: "IMG-20250624-WA0046", category: "community" },
  { src: "/Eldoret/IMG-20250624-WA0047.jpg", title: "IMG-20250624-WA0047", category: "community" },
  { src: "/Eldoret/IMG-20250624-WA0048.jpg", title: "IMG-20250624-WA0048", category: "community" },
  { src: "/Eldoret/IMG-20250624-WA0049.jpg", title: "IMG-20250624-WA0049", category: "community" },
  { src: "/Eldoret/Ministry among Hindus.jpg", title: "Ministry among Hindus", category: "community" },
  { src: "/Eldoret/Mombasa.jpg", title: "Mombasa", category: "community" },
  { src: "/Eldoret/Mombasa_1.jpg", title: "Mombasa 1", category: "community" },
  { src: "/Eldoret/Mombasa2.jpg", title: "Mombasa2", category: "community" },
  { src: "/Eldoret/Outreach.jpg", title: "Outreach", category: "community" },
  { src: "/Eldoret/Picture17.jpg", title: "Picture17", category: "community" },
  { src: "/Eldoret/Picture18.jpg", title: "Picture18", category: "community" },
  { src: "/Eldoret/Picture19.jpg", title: "Picture19", category: "community" },
  { src: "/Eldoret/Picture31.jpg", title: "Picture31", category: "community" },
  { src: "/Eldoret/Village Ministry.jpg", title: "Village Ministry", category: "community" },
  { src: "/Eldoret/WhatsApp Image 2023-10-01 at 13.28.04_b28ea41e.jpg", title: "Mission Photo (2023-10-01)", category: "community" },
  { src: "/Eldoret/WhatsApp Image 2024-04-01 at 15.12.07_fa6c6ef2.jpg", title: "Mission Photo (2024-04-01)", category: "community" },
  { src: "/Eldoret/WhatsApp Image 2024-04-01 at 15.12.10_1ce11263.jpg", title: "Mission Photo (2024-04-01)", category: "community" },
  { src: "/Eldoret/WhatsApp Image 2024-04-01 at 15.12.10_ee636fc6.jpg", title: "Mission Photo (2024-04-01)", category: "community" },
  { src: "/Eldoret/WhatsApp Image 2024-04-01 at 15.13.29_d49640ec.jpg", title: "Mission Photo (2024-04-01)", category: "community" },
  { src: "/Eldoret/WhatsApp Image 2024-04-01 at 15.32.34_0a05c906.jpg", title: "Mission Photo (2024-04-01)", category: "community" },
  { src: "/Eldoret/WhatsApp Image 2024-04-01 at 16.23.45_6d9f4fac.jpg", title: "Mission Photo (2024-04-01)", category: "community" },
  { src: "/Eldoret/WhatsApp Image 2024-04-01 at 16.23.45_c5f87276.jpg", title: "Mission Photo (2024-04-01)", category: "community" },
  { src: "/Eldoret/WhatsApp Image 2024-04-01 at 17.01.42_c7a7a9c1.jpg", title: "Mission Photo (2024-04-01)", category: "community" },
  { src: "/Eldoret/WhatsApp Image 2024-04-01 at 17.14.30_eb577999.jpg", title: "Mission Photo (2024-04-01)", category: "community" },
  { src: "/Eldoret/WhatsApp Image 2024-04-01 at 17.20.22_2a8f2f85.jpg", title: "Mission Photo (2024-04-01)", category: "community" },
  { src: "/Eldoret/WhatsApp Image 2024-09-06 at 21.50.17_79227993.jpg", title: "Mission Photo (2024-09-06)", category: "community" },
  { src: "/Eldoret/WhatsApp Image 2025-02-03 at 06.24.39_4e1d3a97.jpg", title: "Mission Photo (2025-02-03)", category: "community" },
  { src: "/Eldoret/WhatsApp Image 2025-02-03 at 06.24.40_611dcab8.jpg", title: "Mission Photo (2025-02-03)", category: "community" },
  { src: "/Eldoret/WhatsApp Image 2025-02-03 at 06.24.40_89c44146.jpg", title: "Mission Photo (2025-02-03)", category: "community" },
  { src: "/Eldoret/WhatsApp Image 2025-03-26 at 10.01.33_244fbe35.jpg", title: "Mission Photo (2025-03-26)", category: "community" },
  { src: "/Eldoret/WhatsApp Image 2025-03-26 at 15.05.06_3330dbfc.jpg", title: "Mission Photo (2025-03-26)", category: "community" },
  { src: "/Eldoret/WhatsApp Image 2025-03-26 at 15.06.53_6fafa491.jpg", title: "Mission Photo (2025-03-26)", category: "community" },
  { src: "/Eldoret/WhatsApp Image 2025-06-24 at 12.17.54_4a7b6242.jpg", title: "Mission Photo (2025-06-24)", category: "community" },
  { src: "/Eldoret/WhatsApp Image 2025-06-24 at 12.30.34_aa682db4.jpg", title: "Mission Photo (2025-06-24)", category: "community" },
  { src: "/Eldoret/WhatsApp Image 2025-06-24 at 12.30.34_e889c959.jpg", title: "Mission Photo (2025-06-24)", category: "community" },
  { src: "/Egypt/IMG-20250205-WA0007.jpg", title: "Egypt Outreach", category: "community" },
  { src: "/Egypt/IMG-20250205-WA0008.jpg", title: "Egypt Outreach", category: "community" },
  { src: "/Egypt/IMG-20250205-WA0011.jpg", title: "Egypt Outreach", category: "community" },
  { src: "/Egypt/IMG-20250205-WA0013.jpg", title: "Egypt Outreach", category: "community" },
  { src: "/Egypt/IMG-20250628-WA0071.jpg", title: "Egypt Ministry", category: "community" },
  { src: "/Egypt/IMG-20250628-WA0072.jpg", title: "Egypt Ministry", category: "community" },
  { src: "/Egypt/IMG-20250628-WA0073.jpg", title: "Egypt Ministry", category: "community" },
  { src: "/Egypt/IMG-20250628-WA0074.jpg", title: "Egypt Ministry", category: "community" },
  { src: "/Uganda/Picture4.png", title: "Uganda Community", category: "community" },
  { src: "/Uganda/Picture5.jpg", title: "Uganda Community", category: "community" },
  { src: "/Uganda/Picture6.jpg", title: "Uganda Community", category: "community" },
  { src: "/Uganda/Picture7.jpg", title: "Uganda Community", category: "community" },
  { src: "/Uganda/Picture8.png", title: "Uganda Community", category: "community" },
  { src: "/Uganda/Picture9.jpg", title: "Uganda Community", category: "community" },
  { src: "/Uganda/Picture10.png", title: "Uganda Community", category: "community" },
  { src: "/Uganda/Picture20.png", title: "Uganda Community", category: "community" },
  { src: "/Uganda/Picture21.jpg", title: "Uganda Community", category: "community" },
  { src: "/Uganda/Picture22.jpg", title: "Uganda Community", category: "community" },
  { src: "/Uganda/Picture23.png", title: "Uganda Community", category: "community" },
  { src: "/Uganda/Picture24.jpg", title: "Uganda Community", category: "community" },
  { src: "/Uganda/Picture25.jpg", title: "Uganda Community", category: "community" },
  { src: "/Uganda/Picture29.jpg", title: "Uganda Community", category: "community" },
  { src: "/Uganda/Picture30.jpg", title: "Uganda Community", category: "community" },
  { src: "/Uganda/Picture32.jpg", title: "Uganda Community", category: "community" },
  { src: "/Uganda/Picture34.jpg", title: "Uganda Community", category: "community" },
  { src: "/Uganda/Picture35.png", title: "Uganda Community", category: "community" },
  { src: "/Uganda/Picture36.png", title: "Uganda Community", category: "community" },
  { src: "/Uganda/Picture37.jpg", title: "Uganda Community", category: "community" },
  { src: "/Uganda/Picture38.jpg", title: "Uganda Community", category: "community" },
  { src: "/Uganda/Picture39.jpg", title: "Uganda Community", category: "community" },
  { src: "/Uganda/Picture40.png", title: "Uganda Community", category: "community" },
  { src: "/Uganda/Picture41.png", title: "Uganda Community", category: "community" },
  { src: "/Uganda/Picture42.png", title: "Uganda Community", category: "community" },
  { src: "/Uganda/Picture43.png", title: "Uganda Community", category: "community" },
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
            autoRotateSpeed={isMobile ? 0.3 : 0.4}
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
