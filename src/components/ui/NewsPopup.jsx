import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { X, Newspaper, ArrowRight, Loader2 } from "lucide-react";
import { getNews } from "@/services/news";

const DISMISS_KEY = "khm_news_popup_dismissed";
const SHOW_DELAY_MS = 4000;

export default function NewsPopup() {
  const [article, setArticle] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY)) return;

    getNews().then(({ data }) => {
      if (!data || data.length === 0) return;
      const eligible = data.filter((a) => a.display_location !== "page_only");
      if (eligible.length === 0) return;
      const latest = eligible[0];
      setArticle({
        id: latest.id,
        title: latest.title,
        excerpt: latest.excerpt,
        image: latest.image,
        video_url: latest.video_url,
        category: latest.category || "General",
      });
      const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
      return () => clearTimeout(timer);
    });
  }, []);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(DISMISS_KEY, "1");
  };

  if (!article) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="fixed bottom-6 left-6 z-50 w-[320px] max-w-[calc(100vw-24px)] rounded-2xl bg-white shadow-2xl border border-black/5 overflow-hidden"
        >
          <div className="relative h-32 bg-gradient-to-br from-deep-navy to-vibrant-blue flex items-center justify-center">
            {article.video_url ? (
              <video
                src={article.video_url}
                className="w-full h-full object-cover"
                muted
                autoPlay
                loop
                playsInline
              />
            ) : article.image ? (
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Newspaper className="w-10 h-10 text-white/70" />
            )}
            <button
              onClick={dismiss}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5">
            <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-vibrant-blue/10 text-vibrant-blue mb-2">
              {article.category}
            </span>
            <h3 className="font-display text-base font-semibold text-deep-navy leading-snug mb-1.5 line-clamp-2">
              {article.title}
            </h3>
            <p className="font-body text-sm text-gray-500 line-clamp-2 mb-4">
              {article.excerpt}
            </p>

            <div className="flex gap-2">
              <button
                onClick={dismiss}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 border border-gray-200 transition-colors"
              >
                Maybe Later
              </button>
              <Link
                to={`/news/${article.id}`}
                onClick={dismiss}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-vibrant-blue text-white hover:bg-blue-700 transition-colors"
              >
                Read
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
