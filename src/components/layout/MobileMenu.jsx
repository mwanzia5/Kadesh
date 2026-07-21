import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { NAV_LINKS } from "@/constants";

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const panelVariants = {
  hidden: { x: "100%" },
  visible: { x: 0 },
};

export default function MobileMenu({ isOpen, onClose }) {
  const { pathname } = useLocation();
  const [expandedSections, setExpandedSections] = useState({});
  const closeRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      closeRef.current?.focus();
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    onClose();
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  function toggleSection(label) {
    setExpandedSections((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  const isActive = (href) => pathname === href;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] bg-deep-navy/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-[70] w-full max-w-sm bg-white shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between h-20 px-5 border-b border-soft-accent">
              <img src="/images/kadesh-logo.png" alt="Kadesh Hope Mission" className="h-9" />
              <button
                ref={closeRef}
                onClick={onClose}
                className="p-2 rounded-lg text-on-surface hover:bg-surface transition-colors"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-5 space-y-1">
              {NAV_LINKS.map((link) => {
                if (link.children) {
                  const isExpanded = expandedSections[link.label];
                  const sectionActive =
                    link.label === "Projects" && pathname.startsWith("/projects");
                  const mediaActive =
                    link.label === "Media" && (pathname === "/gallery" || pathname === "/videos");

                  return (
                    <div key={link.label}>
                      <button
                        onClick={() => toggleSection(link.label)}
                        className={cn(
                          "flex items-center justify-between w-full px-4 py-3 rounded-xl text-body-lg font-medium transition-colors",
                          sectionActive || mediaActive
                            ? "text-vibrant-blue font-bold bg-vibrant-blue/5"
                            : "text-on-surface hover:bg-surface"
                        )}
                      >
                        {link.label}
                        <ChevronDown
                          className={cn(
                            "w-5 h-5 transition-transform duration-200",
                            isExpanded && "rotate-180"
                          )}
                        />
                      </button>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <div className="pl-4 pb-2">
                              {link.label === "Projects"
                                ? link.children.map((cat) => (
                                    <div key={cat.category} className="mt-2">
                                      <p className="px-4 py-1 text-label-bold text-deep-navy uppercase tracking-wider">
                                        {cat.category}
                                      </p>
                                      {cat.items.map((item) => (
                                        <Link
                                          key={item.href}
                                          to={item.href}
                                          className={cn(
                                            "block px-4 py-2 rounded-lg text-body-md transition-colors",
                                            isActive(item.href)
                                              ? "text-vibrant-blue font-bold bg-vibrant-blue/5"
                                              : "text-on-surface-variant hover:text-vibrant-blue hover:bg-surface"
                                          )}
                                        >
                                          {item.label}
                                        </Link>
                                      ))}
                                    </div>
                                  ))
                                : link.children.map((item) => (
                                    <Link
                                      key={item.href}
                                      to={item.href}
                                      className={cn(
                                        "block px-4 py-2 rounded-lg text-body-md transition-colors",
                                        isActive(item.href)
                                          ? "text-vibrant-blue font-bold bg-vibrant-blue/5"
                                          : "text-on-surface-variant hover:text-vibrant-blue hover:bg-surface"
                                      )}
                                    >
                                      {item.label}
                                    </Link>
                                  ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={cn(
                      "block px-4 py-3 rounded-xl text-body-lg font-medium transition-colors",
                      isActive(link.href)
                        ? "text-vibrant-blue font-bold bg-vibrant-blue/5"
                        : "text-on-surface hover:bg-surface"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="p-5 border-t border-soft-accent">
              <Button as={Link} to="/donate" variant="lightblue" size="md" className="w-full">
                Donate
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
