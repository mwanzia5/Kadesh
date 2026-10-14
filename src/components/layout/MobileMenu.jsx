import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, ChevronDown, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/constants";
import { isProgramLinkActive } from "@/lib/programs";
import { useSponsorshipCart } from "@/context/SponsorshipCartContext";
import SponsorshipCartMenu from "@/components/cart/SponsorshipCartMenu";
import { NavigationActions, ProjectNavigation } from "./NavigationParts";

const primaryLinks = NAV_LINKS.filter(
  (link) => link.href !== "/sponsor-a-child",
);

export default function MobileMenu({ isOpen, onClose }) {
  const { pathname, search } = useLocation();
  const { isCartOpen } = useSponsorshipCart();
  const reducedMotion = useReducedMotion();
  const [expandedSection, setExpandedSection] = useState(null);
  const closeRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setExpandedSection(null);
      return;
    }
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      if (
        previouslyFocused instanceof HTMLElement &&
        previouslyFocused.isConnected
      )
        previouslyFocused.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (event) => {
      if (event.defaultPrevented) return;
      if (event.key === "Escape") {
        if (isCartOpen) return;
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = [
        ...panelRef.current.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ].filter(
        (element) =>
          element.getClientRects().length > 0 &&
          !element.closest('[aria-hidden="true"]'),
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first) return;
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !panelRef.current.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !panelRef.current.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose, isCartOpen]);

  const isActive = (href) => isProgramLinkActive(href, pathname, search);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            className="site-mobile-overlay"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            initial={{
              x: reducedMotion ? 0 : "100%",
              opacity: reducedMotion ? 0 : 1,
            }}
            animate={{ x: 0, opacity: 1 }}
            exit={{
              x: reducedMotion ? 0 : "100%",
              opacity: reducedMotion ? 0 : 1,
            }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { type: "spring", damping: 32, stiffness: 320 }
            }
            className="site-mobile-panel"
          >
            <div className="site-mobile-heading">
              <Link to="/" onClick={onClose} className="site-nav-brand">
                <img src="/images/newlogo.png" alt="Kadesh Hope Mission home" />
              </Link>
              <div className="site-mobile-header-actions">
                <div className="site-nav-cart">
                  <SponsorshipCartMenu />
                </div>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={onClose}
                  className="site-nav-menu-toggle"
                  aria-label="Close menu"
                >
                  <X size={25} strokeWidth={1.7} aria-hidden="true" />
                </button>
              </div>
            </div>
            <nav aria-label="Mobile navigation" className="site-mobile-links">
              <span className="site-mobile-eyebrow">Discover Kadesh Hope</span>
              {primaryLinks.map((link) => {
                if (link.children) {
                  const expanded = expandedSection === link.label;
                  const sectionId =
                    "mobile-section-" + link.label.toLowerCase();
                  const active =
                    link.label === "Projects"
                      ? pathname.startsWith("/projects")
                      : link.children.some((item) => isActive(item.href));
                  return (
                    <div key={link.label} className="site-mobile-section">
                      <button
                        type="button"
                        aria-expanded={expanded}
                        aria-controls={sectionId}
                        onClick={() =>
                          setExpandedSection(expanded ? null : link.label)
                        }
                        className={cn(
                          "site-mobile-link",
                          active && "is-active",
                        )}
                      >
                        {link.label}
                        <ChevronDown
                          size={20}
                          aria-hidden="true"
                          className={cn(
                            "site-nav-chevron",
                            expanded && "is-open",
                          )}
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {expanded && (
                          <motion.div
                            id={sectionId}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: reducedMotion ? 0 : 0.2 }}
                            className="site-mobile-submenu"
                          >
                            {link.label === "Projects" ? (
                              <>
                                <ProjectNavigation
                                  pathname={pathname}
                                  search={search}
                                  onNavigate={onClose}
                                />
                                <Link
                                  to="/projects"
                                  onClick={onClose}
                                  className="site-mobile-all-projects"
                                >
                                  Explore all projects{" "}
                                  <ArrowUpRight size={18} aria-hidden="true" />
                                </Link>
                              </>
                            ) : (
                              <div className="site-mobile-media">
                                {link.children.map((item) => (
                                  <Link
                                    key={item.href}
                                    to={item.href}
                                    onClick={onClose}
                                    aria-current={
                                      isActive(item.href) ? "page" : undefined
                                    }
                                  >
                                    {item.label}
                                    <ArrowUpRight
                                      size={17}
                                      aria-hidden="true"
                                    />
                                  </Link>
                                ))}
                              </div>
                            )}
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
                    onClick={onClose}
                    className={cn(
                      "site-mobile-link",
                      isActive(link.href) && "is-active",
                    )}
                    aria-current={isActive(link.href) ? "page" : undefined}
                  >
                    {link.label}
                    <ArrowUpRight size={18} aria-hidden="true" />
                  </Link>
                );
              })}
            </nav>
            <div className="site-mobile-footer">
              <p>Be part of a brighter future.</p>
              <NavigationActions onNavigate={onClose} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
