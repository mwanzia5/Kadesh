import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Tag, ArrowUpRight, Newspaper, Clock, User, Search } from "lucide-react";

import PageTransition from "@/animations/PageTransition";
import { staggerContainer, slideUp } from "@/animations/variants";

import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import ScrollReveal from "@/components/ui/ScrollReveal";
import GlareHover from "@/components/ui/GlareHover";

const STORAGE_KEY = "khm_news";

function loadNews() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

const CATEGORIES = ["All", "Education", "Health", "Food Security", "Community", "Events", "Announcement"];

export default function News() {
  const [articles, setArticles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setArticles(loadNews().filter((a) => a.published));
  }, []);

  const filtered = articles.filter((a) => {
    const matchesCategory = selectedCategory === "All" || a.category === selectedCategory;
    const matchesSearch =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <PageTransition>
      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden bg-deep-navy">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-vibrant-blue/20 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-hope-orange/20 blur-3xl" />
        </div>

        <div className="relative z-10 w-full">
          <Container>
            <div className="flex flex-col items-center text-center text-white py-24">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-6"
              >
                <span className="inline-block rounded-full bg-vibrant-blue px-5 py-2 font-body text-label-bold uppercase tracking-widest text-white">
                  Latest Updates
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="font-display text-4xl md:text-6xl font-bold leading-tight mb-6"
              >
                News &{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-vibrant-blue to-hope-orange">
                  Updates
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="font-body text-body-lg md:text-xl max-w-2xl text-white/80"
              >
                Stay informed about our programs, events, and community impact across Africa
              </motion.p>
            </div>
          </Container>
        </div>

        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="relative block w-[calc(100%+1.3px)] h-[60px] md:h-[100px]">
            <path d="M0 60L48 55C96 50 192 40 288 35C384 30 480 30 576 33.3C672 36.7 768 43.3 864 48.3C960 53.3 1056 56.7 1152 55C1248 53.3 1344 46.7 1392 43.3L1440 40V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0V60Z" className="fill-white" />
          </svg>
        </div>
      </section>

      {/* Filters */}
      <Section background="white" className="py-8 border-b border-soft-accent">
        <Container>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-soft-accent bg-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 focus:border-vibrant-blue"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg font-body text-sm font-medium transition-colors ${
                    selectedCategory === cat
                      ? "bg-vibrant-blue text-white"
                      : "bg-surface text-on-surface-variant hover:bg-vibrant-blue/10 hover:text-vibrant-blue"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* Articles */}
      <Section background="white" className="section-padding">
        <Container>
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="font-display text-2xl text-deep-navy mb-2">No articles found</h3>
              <p className="font-body text-on-surface-variant">
                {articles.length === 0
                  ? "Check back soon for news and updates from our programs."
                  : "Try adjusting your search or filter criteria."}
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Featured Article */}
              {featured && (
                <ScrollReveal>
                  <Link
                    to={`/news/${featured.id}`}
                    className="group block bg-white rounded-2xl border border-soft-accent overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
                  >
                    <div className="flex flex-col lg:flex-row">
                      {featured.image && (
                        <div className="lg:w-1/2 h-64 lg:h-auto bg-gray-100">
                          <img
                            src={featured.image}
                            alt={featured.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}
                      <div className={`p-8 lg:p-10 flex flex-col justify-center ${!featured.image ? "w-full" : "lg:w-1/2"}`}>
                        <div className="flex items-center gap-3 mb-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-vibrant-blue/10 px-3 py-1 font-body text-caption font-medium text-vibrant-blue">
                            <Tag className="h-3.5 w-3.5" />
                            {featured.category}
                          </span>
                          <span className="text-caption text-on-surface-variant flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(featured.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>

                        <h2 className="font-display text-2xl md:text-3xl lg:text-4xl text-deep-navy mb-4 group-hover:text-vibrant-blue transition-colors">
                          {featured.title}
                        </h2>

                        <p className="font-body text-body-lg text-on-surface-variant mb-6 leading-relaxed">
                          {featured.excerpt}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                            <User className="h-4 w-4" />
                            {featured.author}
                          </div>
                          <span className="inline-flex items-center gap-1.5 font-body text-label-bold text-vibrant-blue group-hover:gap-2.5 transition-all">
                            Read More
                            <ArrowUpRight className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
              )}

              {/* Rest of articles */}
              {rest.length > 0 && (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                  {rest.map((article) => (
                    <motion.div key={article.id} variants={slideUp}>
                      <GlareHover className="h-full">
                        <Link
                          to={`/news/${article.id}`}
                          className="group flex flex-col h-full bg-white rounded-2xl border border-soft-accent overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
                        >
                          {article.image && (
                            <div className="relative overflow-hidden aspect-[16/10]">
                              <img
                                src={article.image}
                                alt={article.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            </div>
                          )}

                          <div className="flex flex-col flex-1 p-6">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-vibrant-blue/10 text-vibrant-blue font-medium">
                                <Tag className="h-3 w-3" />
                                {article.category}
                              </span>
                              <span className="text-xs text-on-surface-variant flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(article.createdAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>

                            <h3 className="font-display text-lg text-deep-navy mb-2 group-hover:text-vibrant-blue transition-colors line-clamp-2">
                              {article.title}
                            </h3>

                            <p className="font-body text-sm text-on-surface-variant line-clamp-3 mb-4 flex-1">
                              {article.excerpt}
                            </p>

                            <div className="flex items-center justify-between pt-4 border-t border-soft-accent">
                              <span className="text-xs text-on-surface-variant flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {article.author}
                              </span>
                              <span className="inline-flex items-center gap-1 font-body text-label-bold text-vibrant-blue text-xs">
                                Read
                                <ArrowUpRight className="h-3 w-3" />
                              </span>
                            </div>
                          </div>
                        </Link>
                      </GlareHover>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          )}
        </Container>
      </Section>
    </PageTransition>
  );
}
