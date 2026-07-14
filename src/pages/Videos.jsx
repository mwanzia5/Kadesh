import { useState, useMemo } from "react";
import { Play, Search, Filter } from "lucide-react";

import PageTransition from "@/animations/PageTransition";
import Container from "@/components/ui/Container";
import ScrollReveal from "@/components/ui/ScrollReveal";
import SectionHeading from "@/components/ui/SectionHeading";
import { useVideos } from "@/hooks/useVideos";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Education", "Health", "Food Security", "Women & Youth", "Community"];

const categoryColors = {
  Education: "bg-blue-500/20 text-blue-400",
  Health: "bg-rose-500/20 text-rose-400",
  "Food Security": "bg-amber-500/20 text-amber-400",
  "Women & Youth": "bg-purple-500/20 text-purple-400",
  Community: "bg-emerald-500/20 text-emerald-400",
};

function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export default function Videos() {
  const { data: videosData, isLoading } = useVideos();
  const videos = videosData?.data || [];

  const [activeVideo, setActiveVideo] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
      const matchesCategory = activeCategory === "All" || video.category === activeCategory;
      const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [videos, activeCategory, searchQuery]);

  const current = activeVideo || filteredVideos[0];

  return (
    <PageTransition>
      <section className="pt-28 pb-20 min-h-screen bg-background">
        <Container>
          <ScrollReveal>
            <SectionHeading
              title="Stories Worth Watching"
              subtitle="Watch how we're transforming lives across Africa"
            />
          </ScrollReveal>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : videos.length === 0 ? (
            <ScrollReveal>
              <div className="text-center py-20 text-muted-foreground">
                <Play className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No videos available yet. Check back soon!</p>
              </div>
            </ScrollReveal>
          ) : (
            <>
              {/* Featured Video */}
              {current && (
                <ScrollReveal delay={0.1}>
                  <div className="max-w-4xl mx-auto mb-12">
                    <div className="relative rounded-xl overflow-hidden shadow-card aspect-video bg-black">
                      {current.url?.includes("youtube") ? (
                        <iframe
                          src={current.url}
                          title={current.title}
                          className="absolute inset-0 w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : current.thumbnail ? (
                        <div className="relative w-full h-full">
                          <video
                            src={current.url}
                            poster={current.thumbnail}
                            controls
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <video
                          src={current.url}
                          controls
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-foreground">{current.title}</h3>
                      <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", categoryColors[current.category])}>
                        {current.category}
                      </span>
                      {current.duration && (
                        <span className="text-sm text-muted-foreground ml-auto">{current.duration}</span>
                      )}
                    </div>
                  </div>
                </ScrollReveal>
              )}

              {/* Filters */}
              <ScrollReveal delay={0.15}>
                <div className="max-w-4xl mx-auto mb-10 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                          activeCategory === cat
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search videos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-full bg-muted text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                    />
                  </div>
                </div>
              </ScrollReveal>

              {/* Video Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {filteredVideos.map((video, i) => (
                  <ScrollReveal key={video.id} delay={0.1 + i * 0.05}>
                    <div
                      className="rounded-xl cursor-pointer"
                      onClick={() => setActiveVideo(video)}
                    >
                      <div
                        className={cn(
                          "group relative rounded-xl overflow-hidden bg-zinc-900 aspect-video",
                          current?.id === video.id && "ring-2 ring-primary"
                        )}
                      >
                        {video.thumbnail ? (
                          <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                        ) : video.url?.includes("youtube") ? (
                          <img
                            src={`https://img.youtube.com/vi/${extractYouTubeId(video.url)}/hqdefault.jpg`}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-12 h-12 text-white/60 group-hover:text-white group-hover:scale-110 transition-all duration-300" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                        <span className={cn("absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full", categoryColors[video.category])}>
                          {video.category}
                        </span>
                        {video.duration && (
                          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                            {video.duration}
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <h4 className="text-sm font-medium text-foreground line-clamp-2">{video.title}</h4>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>

              {filteredVideos.length === 0 && (
                <ScrollReveal>
                  <div className="text-center py-16">
                    <Filter className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No videos match your search.</p>
                  </div>
                </ScrollReveal>
              )}
            </>
          )}
        </Container>
      </section>
    </PageTransition>
  );
}
