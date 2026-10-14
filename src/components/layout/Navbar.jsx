import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Menu, ChevronDown, ArrowUpRight, Images, Play, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/constants";
import { isProgramLinkActive } from "@/lib/programs";
import { useSponsorshipCart } from "@/context/SponsorshipCartContext";
import { useDonorAuth } from "@/context/DonorAuthContext";
import SponsorshipCartMenu from "@/components/cart/SponsorshipCartMenu";
import {
  AccountLink,
  NavigationActions,
  ProjectNavigation,
} from "./NavigationParts";
import MobileMenu from "./MobileMenu";
import "./navigation.css";

const primaryLinks = NAV_LINKS.filter(
  (link) => link.href !== "/sponsor-a-child",
);
const dropdownVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 6 },
};
const mediaDetails = {
  "/gallery": { icon: Images, description: "Our work in pictures" },
  "/videos": { icon: Play, description: "Stories from our community" },
};

export default function Navbar() {
  const { pathname, search } = useLocation();
  const reducedMotion = useReducedMotion();
  const { closeCart, isCartOpen } = useSponsorshipCart();
  const { user, profile, loading: authLoading } = useDonorAuth();
  const firstName = profile?.first_name?.trim() || "";
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktop, setDesktop] = useState(
    () => window.matchMedia("(min-width: 1280px)").matches,
  );
  const dropdownRefs = useRef({});
  const triggerRefs = useRef({});
  const keyboardOpen = useRef(null);
  const closeMobile = useCallback(() => {
    setMobileOpen(false);
    closeCart();
  }, [closeCart]);
  const closeDropdowns = useCallback(() => setOpenDropdown(null), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1280px)");
    const onResize = (event) => {
      setDesktop(event.matches);
      setMobileOpen(false);
      setOpenDropdown(null);
      closeCart();
    };
    query.addEventListener("change", onResize);
    return () => query.removeEventListener("change", onResize);
  }, [closeCart]);

  useEffect(() => {
    setOpenDropdown(null);
    setMobileOpen(false);
  }, [pathname, search]);

  useEffect(() => {
    if (!isCartOpen) return;
    setOpenDropdown(null);
    // Sponsorship pages can open the cart directly on smaller screens too.
    if (!desktop) setMobileOpen(true);
  }, [isCartOpen, desktop]);

  useEffect(() => {
    if (!openDropdown) return;
    if (keyboardOpen.current === openDropdown) {
      dropdownRefs.current[openDropdown]
        ?.querySelector(".site-nav-dropdown a")
        ?.focus();
      keyboardOpen.current = null;
    }
    const handleOutside = (event) => {
      if (!dropdownRefs.current[openDropdown]?.contains(event.target))
        setOpenDropdown(null);
    };
    const handleKey = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpenDropdown(null);
      triggerRefs.current[openDropdown]?.focus();
    };
    document.addEventListener("pointerdown", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [openDropdown]);

  const isActive = (href) => isProgramLinkActive(href, pathname, search);

  return (
    <>
      <style>{`
        /* Desktop navbar text/icons: larger without increasing navbar height */
        @media (min-width: 1280px) {
          .site-nav-link {
            font-size: 17px !important;
            line-height: 1.1 !important;
          }

          .site-nav-actions,
          .site-nav-actions a,
          .site-nav-actions button {
            font-size: 17px !important;
            line-height: 1.1 !important;
          }

          .site-nav-utilities svg,
          .site-nav-actions svg {
            width: 24px !important;
            height: 24px !important;
          }

          .site-nav-chevron {
            width: 18px !important;
            height: 18px !important;
          }

          /* Keep the account icon compact, but clearly label its purpose. */
          .site-nav-account-labeled {
            display: flex;
            align-items: center;
            gap: 8px;
            white-space: nowrap;
            cursor: pointer;
          }

          .site-nav-account-label {
            font-size: 13px !important;
            line-height: 1 !important;
            font-weight: 600;
            letter-spacing: 0.01em;
          }

          /* Signed in: show who is signed in, with a link to the account. */
          .site-nav-account-name {
            display: flex;
            flex-direction: column;
            gap: 3px;
            max-width: 140px;
          }
          .site-nav-account-name strong {
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 14px !important;
            line-height: 1.1 !important;
            font-weight: 700;
            color: #142845;
          }
          .site-nav-account-name small {
            font-size: 12px !important;
            line-height: 1 !important;
            font-weight: 600;
            color: #1e5bab;
          }
        }
      `}</style>
      <nav
        aria-label="Main navigation"
        className={cn("site-navbar", scrolled && "is-scrolled")}
      >
        <div className="site-navbar-inner">
          <Link to="/" className="site-nav-brand" onClick={closeDropdowns}>
            <img src="/images/newlogo.png" alt="Kadesh Hope Mission home" />
          </Link>
          {desktop && (
            <div className="site-nav-links">
              {primaryLinks.map((link) => {
                if (!link.children)
                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      className={cn(
                        "site-nav-link",
                        isActive(link.href) && "is-active",
                      )}
                      aria-current={isActive(link.href) ? "page" : undefined}
                    >
                      {link.label}
                    </Link>
                  );
                const isProjects = link.label === "Projects";
                const open = openDropdown === link.label;
                const active = isProjects
                  ? pathname.startsWith("/projects")
                  : link.children.some((item) => isActive(item.href));
                const panelId = "desktop-" + link.label.toLowerCase();
                return (
                  <div
                    key={link.label}
                    className={cn(
                      "site-nav-disclosure",
                      !isProjects && "site-nav-media",
                    )}
                    ref={(node) => {
                      dropdownRefs.current[link.label] = node;
                    }}
                    onBlur={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget))
                        setOpenDropdown((current) =>
                          current === link.label ? null : current,
                        );
                    }}
                  >
                    <button
                      type="button"
                      ref={(node) => {
                        triggerRefs.current[link.label] = node;
                      }}
                      aria-expanded={open}
                      aria-controls={panelId}
                      className={cn(
                        "site-nav-link",
                        (active || open) && "is-active",
                      )}
                      onClick={() => {
                        closeCart();
                        setOpenDropdown(open ? null : link.label);
                      }}
                      onKeyDown={(event) => {
                        if (event.key !== "ArrowDown") return;
                        event.preventDefault();
                        closeCart();
                        if (open)
                          dropdownRefs.current[link.label]
                            ?.querySelector(".site-nav-dropdown a")
                            ?.focus();
                        else {
                          keyboardOpen.current = link.label;
                          setOpenDropdown(link.label);
                        }
                      }}
                    >
                      {link.label}
                      <ChevronDown
                        size={17}
                        aria-hidden="true"
                        className={cn("site-nav-chevron", open && "is-open")}
                      />
                    </button>
                    <AnimatePresence>
                      {open && (
                        <motion.div
                          id={panelId}
                          className={cn(
                            "site-nav-dropdown",
                            isProjects
                              ? "site-nav-mega"
                              : "site-nav-media-panel",
                          )}
                          variants={dropdownVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          transition={{ duration: reducedMotion ? 0 : 0.18 }}
                        >
                          {isProjects ? (
                            <>
                              <div className="site-nav-mega-heading">
                                <div>
                                  <span>Our work</span>
                                  <strong>
                                    Three pathways to lasting opportunity.
                                  </strong>
                                </div>
                                <Link to="/projects" onClick={closeDropdowns}>
                                  Explore all projects{" "}
                                  <ArrowUpRight size={18} aria-hidden="true" />
                                </Link>
                              </div>
                              <ProjectNavigation
                                pathname={pathname}
                                search={search}
                                onNavigate={closeDropdowns}
                              />
                            </>
                          ) : (
                            link.children.map((item) => {
                              const detail = mediaDetails[item.href];
                              const Icon = detail?.icon || Images;
                              return (
                                <Link
                                  key={item.href}
                                  to={item.href}
                                  onClick={closeDropdowns}
                                  aria-current={
                                    isActive(item.href) ? "page" : undefined
                                  }
                                >
                                  <span className="site-nav-media-icon">
                                    <Icon size={22} aria-hidden="true" />
                                  </span>
                                  <span>
                                    <strong>{item.label}</strong>
                                    <small>{detail?.description}</small>
                                  </span>
                                  <ArrowUpRight size={16} aria-hidden="true" />
                                </Link>
                              );
                            })
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
          <div className="site-nav-actions">
            {desktop ? (
              <>
                <NavigationActions onNavigate={closeDropdowns} />
                <div className="site-nav-utilities">
                  <div className="site-nav-cart">
                    <SponsorshipCartMenu onOpen={closeDropdowns} />
                  </div>
                  {!authLoading && !user ? (
                    <Link to="/login" className="site-nav-auth" onClick={closeDropdowns}>
                      <UserRound size={18} strokeWidth={2} aria-hidden="true" />
                      Log in / Sign up
                    </Link>
                  ) : (
                  <div
                    className="site-nav-account-labeled"
                    onClick={(event) => {
                      // The AccountLink already owns the real navigation.
                      // Clicking the label or empty space delegates to that same control,
                      // making the icon + text behave like one clickable item.
                      if (event.target.closest("a, button")) return;
                      event.currentTarget.querySelector("a, button")?.click();
                    }}
                  >
                    <AccountLink onNavigate={closeDropdowns} />
                    {authLoading ? null : user ? (
                      <span className="site-nav-account-name">
                        <strong>Hi, {firstName || "there"}</strong>
                        <small>My account</small>
                      </span>
                    ) : (
                      <span className="site-nav-account-label">
                        Sign Up / Login
                      </span>
                    )}
                  </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="site-nav-menu-toggle"
                  onClick={() => {
                    closeCart();
                    setMobileOpen(true);
                  }}
                  aria-label="Open menu"
                  aria-expanded={mobileOpen}
                  aria-controls="mobile-navigation"
                >
                  <Menu size={26} strokeWidth={1.7} aria-hidden="true" />
                </button>
                <AccountLink onNavigate={closeMobile} />
              </>
            )}
          </div>
        </div>
      </nav>
      {!desktop && <MobileMenu isOpen={mobileOpen} onClose={closeMobile} />}
    </>
  );
}
