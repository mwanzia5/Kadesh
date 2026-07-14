import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Tag, ArrowLeft, User, Clock } from "lucide-react";

import PageTransition from "@/animations/PageTransition";
import Container from "@/components/ui/Container";
import ScrollReveal from "@/components/ui/ScrollReveal";

const STORAGE_KEY = "khm_news";

function loadNews() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function NewsArticle() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    const articles = loadNews().filter((a) => a.published);
    const found = articles.find((a) => a.id === id);
    setArticle(found);

    if (found) {
      const relatedArticles = articles
        .filter((a) => a.id !== id && a.category === found.category)
        .slice(0, 3);
      setRelated(relatedArticles);
    }
  }, [id]);

  if (!article) {
    return (
      <PageTransition>
        <section className="pt-32 pb-20">
          <Container>
            <div className="text-center py-20">
              <h2 className="font-display text-3xl text-deep-navy mb-4">Article not found</h2>
              <Link to="/news" className="font-body text-vibrant-blue hover:underline">
                Back to News
              </Link>
            </div>
          </Container>
        </section>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      {/* Hero */}
      <section className="relative min-h-[40vh] flex items-end overflow-hidden bg-deep-navy">
        {article.image && (
          <div className="absolute inset-0">
            <img src={article.image} alt={article.title} className="w-full h-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-t from-deep-navy via-deep-navy/60 to-deep-navy/30" />
          </div>
        )}

        <div className="relative z-10 w-full">
          <Container>
            <div className="py-16 md:py-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Link
                  to="/news"
                  className="inline-flex items-center gap-2 text-white/70 hover:text-white font-body text-sm mb-6 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to News
                </Link>

                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-vibrant-blue px-3 py-1 font-body text-caption font-medium text-white">
                    <Tag className="h-3.5 w-3.5" />
                    {article.category}
                  </span>
                  <span className="text-sm text-white/60 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(article.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-white max-w-4xl">
                  {article.title}
                </h1>

                <div className="flex items-center gap-4 mt-6 text-white/60 font-body text-sm">
                  <span className="flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    {article.author}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {Math.ceil(article.content.split(/\s+/).length / 200)} min read
                  </span>
                </div>
              </motion.div>
            </div>
          </Container>
        </div>
      </section>

      {/* Content */}
      <Section background="white" className="section-padding">
        <Container>
          <div className="max-w-3xl mx-auto">
            <ScrollReveal>
              <div className="prose prose-lg max-w-none font-body text-on-surface leading-relaxed">
                <p className="text-xl text-on-surface-variant mb-8 font-medium">
                  {article.excerpt}
                </p>

                {article.content.split("\n").map((paragraph, i) => (
                  paragraph.trim() && (
                    <p key={i} className="mb-6">
                      {paragraph}
                    </p>
                  )
                ))}
              </div>
            </ScrollReveal>

            {/* Share / Back */}
            <ScrollReveal delay={0.2}>
              <div className="mt-12 pt-8 border-t border-soft-accent flex items-center justify-between">
                <Link
                  to="/news"
                  className="inline-flex items-center gap-2 font-body text-label-bold text-vibrant-blue hover:gap-3 transition-all"
                >
                  <ArrowLeft className="h-4 w-4" />
                  All Articles
                </Link>
              </div>
            </ScrollReveal>

            {/* Related */}
            {related.length > 0 && (
              <ScrollReveal delay={0.3} className="mt-12">
                <h3 className="font-display text-2xl text-deep-navy mb-6">Related Articles</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {related.map((a) => (
                    <Link
                      key={a.id}
                      to={`/news/${a.id}`}
                      className="group block bg-surface rounded-xl border border-soft-accent overflow-hidden hover:shadow-card transition-shadow"
                    >
                      {a.image && (
                        <div className="aspect-[16/10] overflow-hidden">
                          <img src={a.image} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      )}
                      <div className="p-4">
                        <span className="text-xs text-vibrant-blue font-medium">{a.category}</span>
                        <h4 className="font-display text-base text-deep-navy mt-1 group-hover:text-vibrant-blue transition-colors line-clamp-2">
                          {a.title}
                        </h4>
                      </div>
                    </Link>
                  ))}
                </div>
              </ScrollReveal>
            )}
          </div>
        </Container>
      </Section>
    </PageTransition>
  );
}
