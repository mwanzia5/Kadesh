import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, ChevronDown, User, LogIn } from "lucide-react";
import { cn, getGravatarUrl } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { NAV_LINKS } from "@/constants";
import { useDonorAuth } from "@/context/DonorAuthContext";
import MobileMenu from "./MobileMenu";
const dropdownVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 8, scale: 0.98 },
};

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, profile, loading: authLoading } = useDonorAuth();
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const megaRef = useRef(null);
  const mediaRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMegaOpen(false);
    setMediaOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!megaOpen && !mediaOpen) return;
    function handleClick(e) {
      if (megaRef.current && !megaRef.current.contains(e.target)) setMegaOpen(false);
      if (mediaRef.current && !mediaRef.current.contains(e.target)) setMediaOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [megaOpen, mediaOpen]);

  const isActive = (href) => pathname === href;

  const projectsLink = NAV_LINKS.find((l) => l.label === "Projects");
  const mediaLink = NAV_LINKS.find((l) => l.label === "Media");

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300",
          scrolled ? "bg-white/95 shadow-lg" : "bg-white/80 backdrop-blur-glass"
        )}
      >
        <div className="mx-auto flex items-center justify-between h-20 px-5 md:px-16 max-w-[1280px]">
         <Link to="/" className="flex-shrink-0">
  <img src="/images/kadesh-logo.png" alt="Kadesh Hope Mission" className="h-16" />
</Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              if (link.label === "Projects") {
                return (
                  <div key={link.label} ref={megaRef} className="relative">
                    <button
                      onClick={() => { setMegaOpen((v) => !v); setMediaOpen(false); }}
                      className={cn(
                        "flex items-center gap-1 px-4 py-2 rounded-lg text-body-md font-medium transition-colors",
                        megaOpen || pathname.startsWith("/projects")
                          ? "text-vibrant-blue font-bold"
                          : "text-on-surface hover:text-vibrant-blue"
                      )}
                    >
                      {link.label}
                      <ChevronDown className={cn("w-4 h-4 transition-transform", megaOpen && "rotate-180")} />
                    </button>
                    <AnimatePresence>
                      {megaOpen && (
                        <motion.div
                          variants={dropdownVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          transition={{ duration: 0.2 }}
                          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[520px] bg-white rounded-xl shadow-card p-6"
                        >
                          <div className="grid grid-cols-2 gap-6">
                            {link.children.map((cat) => (
                              <div key={cat.category}>
                                <p className="text-label-bold text-deep-navy mb-2 uppercase tracking-wider">
                                  {cat.category}
                                </p>
                                <ul className="space-y-1">
                                  {cat.items.map((item) => (
                                    <li key={item.href}>
                                      <Link
                                        to={item.href}
                                        className={cn(
                                          "block px-3 py-2 rounded-lg text-body-md transition-colors",
                                          isActive(item.href)
                                            ? "text-vibrant-blue font-bold bg-vibrant-blue/5"
                                            : "text-on-surface-variant hover:text-vibrant-blue hover:bg-surface"
                                        )}
                                      >
                                        {item.label}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              if (link.label === "Media") {
                return (
                  <div key={link.label} ref={mediaRef} className="relative">
                    <button
                      onClick={() => { setMediaOpen((v) => !v); setMegaOpen(false); }}
                      className={cn(
                        "flex items-center gap-1 px-4 py-2 rounded-lg text-body-md font-medium transition-colors",
                        mediaOpen || pathname === "/gallery" || pathname === "/videos"
                          ? "text-vibrant-blue font-bold"
                          : "text-on-surface hover:text-vibrant-blue"
                      )}
                    >
                      {link.label}
                      <ChevronDown className={cn("w-4 h-4 transition-transform", mediaOpen && "rotate-180")} />
                    </button>
                    <AnimatePresence>
                      {mediaOpen && (
                        <motion.div
                          variants={dropdownVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          transition={{ duration: 0.2 }}
                          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-48 bg-white rounded-xl shadow-card p-3"
                        >
                          {link.children.map((item) => (
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
                    "px-4 py-2 rounded-lg text-body-md font-medium transition-colors",
                    isActive(link.href)
                      ? "text-vibrant-blue font-bold"
                      : "text-on-surface hover:text-vibrant-blue"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <Button as={Link} to="/donate" variant="lightblue" size="sm">
              Donate
            </Button>
            {!authLoading && (
              user ? (
                <Link
                  to="/account"
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg font-body text-sm font-medium transition-colors",
                    pathname === "/account"
                      ? "text-vibrant-blue bg-vibrant-blue/5"
                      : "text-on-surface hover:text-vibrant-blue hover:bg-surface"
                  )}
                >
                  <div className="w-7 h-7 rounded-full bg-vibrant-blue flex items-center justify-center overflow-hidden">
                    {getGravatarUrl(user?.email) ? (
                      <img
                        src={getGravatarUrl(user.email, 56)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-xs font-semibold">
                        {profile?.first_name?.charAt(0) || "D"}
                      </span>
                    )}
                  </div>
                  <span className="hidden xl:inline">{profile?.first_name || "Account"}</span>
                </Link>
              ) : (
                <Link
                  to="/donor-auth"
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg font-body text-sm font-medium transition-colors",
                    pathname === "/donor-auth"
                      ? "text-vibrant-blue bg-vibrant-blue/5"
                      : "text-on-surface hover:text-vibrant-blue hover:bg-surface"
                  )}
                >
                  <LogIn className="h-4 w-4" />
                  <span>Log In</span>
                </Link>
              )
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 rounded-lg text-on-surface hover:bg-surface transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
