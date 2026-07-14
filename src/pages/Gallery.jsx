import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Camera,
} from "lucide-react";

import PageTransition from "@/animations/PageTransition";
import { staggerContainer, slideUp } from "@/animations/variants";

import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import OptimizedImage from "@/components/ui/OptimizedImage";
import GlareHover from "@/components/ui/GlareHover";
import ScrollReveal from "@/components/ui/ScrollReveal";
import SectionHeading from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "All",
  "Education",
  "Health",
  "Food Security",
  "Women & Youth",
  "Community",
];

const GALLERY_IMAGES = [
  {
    src: "/images/others/group-of-girls-playing.webp",
    title: "Community Outreach",
    category: "community",
  },
  {
    src: "/images/kadesh images_02.jpg",
    title: "Healthcare Services",
    category: "health",
  },
  {
    src: "/images/kadesh images_03.png",
    title: "Education Program",
    category: "education",
  },
  {
    src: "/images/kadesh images_04.jpg",
    title: "Food Distribution",
    category: "food",
  },
  {
    src: "/images/kadesh images_05.jpg",
    title: "Community Gathering",
    category: "community",
  },
  {
    src: "/images/kadesh images_06.jpg",
    title: "Medical Camp",
    category: "health",
  },
  {
    src: "/images/kadesh images_07.jpg",
    title: "Women Empowerment",
    category: "women",
  },
  {
    src: "/images/kadesh images_08.jpg",
    title: "School Learning",
    category: "education",
  },
  {
    src: "/images/kadesh images_09.jpg",
    title: "Agricultural Training",
    category: "food",
  },
  {
    src: "/images/kadesh images_10.jpg",
    title: "Volunteer Work",
    category: "community",
  },
  {
    src: "/images/kadesh images_11.jpg",
    title: "Youth Development",
    category: "women",
  },
  {
    src: "/images/kadesh images_12.jpg",
    title: "Community Health",
    category: "health",
  },
  {
    src: "/images/healthcare/healthcare_1.jpg",
    title: "Healthcare Initiative",
    category: "health",
  },
  {
    src: "/images/child to school/child project_1.jpeg",
    title: "Child Education",
    category: "education",
  },
  {
    src: "/images/Lumina School/Lumina School_01.jpeg",
    title: "Lumina School",
    category: "education",
  },
  {
    src: "/images/womensproject_1.jpeg",
    title: "Women's Project",
    category: "women",
  },
];

const ASPECT_CLASSES = [
  "aspect-[3/4]",
  "aspect-square",
  "aspect-[4/3]",
  "aspect-[3/4]",
  "aspect-square",
  "aspect-[4/3]",
  "aspect-[3/4]",
  "aspect-square",
];

const INITIAL_COUNT = 9;
const LOAD_MORE_COUNT = 6;

export default function Gallery() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const [lightbox, setLightbox] = useState({ isOpen: false, currentIndex: 0 });

  const filteredImages = useMemo(() => {
    return GALLERY_IMAGES.filter((img) => {
      const matchesCategory =
        activeFilter === "All" ||
        img.category.toLowerCase() === activeFilter.toLowerCase() ||
        (activeFilter === "Women & Youth" &&
          img.category === "women");

      const matchesSearch =
        searchQuery === "" ||
        img.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        img.category.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [activeFilter, searchQuery]);

  const visibleImages = useMemo(
    () => filteredImages.slice(0, visibleCount),
    [filteredImages, visibleCount]
  );

  const hasMore = visibleCount < filteredImages.length;

  const handleFilterChange = useCallback((filter) => {
    setActiveFilter(filter);
    setVisibleCount(INITIAL_COUNT);
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
    setVisibleCount(INITIAL_COUNT);
  }, []);

  const openLightbox = useCallback(
    (index) => {
      setLightbox({ isOpen: true, currentIndex: index });
    },
    []
  );

  const closeLightbox = useCallback(() => {
    setLightbox((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const navigateLightbox = useCallback(
    (direction) => {
      setLightbox((prev) => ({
        ...prev,
        currentIndex:
          (prev.currentIndex + direction + visibleImages.length) %
          visibleImages.length,
      }));
    },
    [visibleImages.length]
  );

  useEffect(() => {
    if (!lightbox.isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") navigateLightbox(-1);
      if (e.key === "ArrowRight") navigateLightbox(1);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightbox.isOpen, closeLightbox, navigateLightbox]);

  return (
    <PageTransition>
      <HeroSection />

      <Section background="white" className="section-padding">
        <Container>
          <div className="max-w-xl mx-auto mb-10">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search photos..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-soft-accent/60 bg-surface font-body text-body-md text-deep-navy placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-vibrant-blue/40 focus:border-vibrant-blue transition-all"
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => handleFilterChange(category)}
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

          <AnimatePresence mode="popLayout">
            <motion.div
              layout
              className="columns-1 sm:columns-2 lg:columns-3 gap-4"
            >
              {visibleImages.map((image, index) => {
                const aspectClass =
                  ASPECT_CLASSES[index % ASPECT_CLASSES.length];

                return (
                  <motion.div
                    key={image.src}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{
                      duration: 0.4,
                      delay: (index % LOAD_MORE_COUNT) * 0.05,
                    }}
                    className="break-inside-avoid mb-4"
                  >
                    <GlareHover
                      glareColor="#2563EB"
                      className="group rounded-xl overflow-hidden cursor-pointer"
                      onClick={() => openLightbox(index)}
                    >
                      <div className={cn("relative overflow-hidden", aspectClass)}>
                        <OptimizedImage
                          src={image.src}
                          alt={image.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                          <div>
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white/90 text-xs font-body mb-2 capitalize">
                              {image.category}
                            </span>
                            <h3 className="font-display text-white text-lg">
                              {image.title}
                            </h3>
                          </div>
                        </div>
                      </div>
                    </GlareHover>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {visibleImages.length === 0 && (
            <div className="text-center py-20">
              <Camera className="h-16 w-16 text-on-surface-variant/30 mx-auto mb-4" />
              <p className="font-body text-body-lg text-on-surface-variant">
                No photos found. Try a different search or filter.
              </p>
            </div>
          )}

          {hasMore && (
            <div className="text-center mt-12">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() =>
                  setVisibleCount((prev) => prev + LOAD_MORE_COUNT)
                }
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-vibrant-blue text-white font-body text-body-md font-semibold shadow-md hover:bg-vibrant-blue/90 transition-colors"
              >
                Load More
              </motion.button>
            </div>
          )}
        </Container>
      </Section>

      <Lightbox
        isOpen={lightbox.isOpen}
        currentIndex={lightbox.currentIndex}
        images={visibleImages}
        onClose={closeLightbox}
        onNavigate={navigateLightbox}
      />
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

function Lightbox({ isOpen, currentIndex, images, onClose, onNavigate }) {
  const currentImage = images[currentIndex];

  return (
    <AnimatePresence>
      {isOpen && currentImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={onClose}
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-50 p-2 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(-1);
            }}
            className="absolute left-4 md:left-8 z-50 p-3 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(1);
            }}
            className="absolute right-4 md:right-8 z-50 p-3 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="relative max-w-5xl w-full mx-4 md:mx-16 max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <OptimizedImage
              src={currentImage.src}
              alt={currentImage.title}
              className="w-full h-full object-contain rounded-lg"
            />
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent rounded-b-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white/90 text-xs font-body mb-1 capitalize">
                    {currentImage.category}
                  </span>
                  <h3 className="font-display text-white text-xl">
                    {currentImage.title}
                  </h3>
                </div>
                <span className="text-white/70 font-body text-sm">
                  {currentIndex + 1} / {images.length}
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
