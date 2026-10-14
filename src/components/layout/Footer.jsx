import { Link } from "react-router-dom";
import {
  ArrowRight,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import {
  FacebookIcon,
  TwitterIcon,
  YoutubeIcon,
  LinkedinIcon,
} from "@/components/ui/SocialIcons";
import { SITE_CONFIG } from "@/constants";
import { PROGRAM_CATEGORIES } from "@/lib/programs";

// Only show social networks that have a real link (placeholders are "#").
const socialLinks = [
  { icon: FacebookIcon, href: SITE_CONFIG.social.facebook, label: "Facebook" },
  { icon: TwitterIcon, href: SITE_CONFIG.social.twitter, label: "X (Twitter)" },
  { icon: YoutubeIcon, href: SITE_CONFIG.social.youtube, label: "YouTube" },
  { icon: LinkedinIcon, href: SITE_CONFIG.social.linkedin, label: "LinkedIn" },
].filter(({ href }) => href && href !== "#");

const exploreLinks = [
  { label: "Home", href: "/" },
  { label: "About us", href: "/about" },
  { label: "Projects", href: "/projects" },
  { label: "Sponsor a child", href: "/sponsor-a-child" },
  { label: "Gallery", href: "/gallery" },
  { label: "Videos", href: "/videos" },
  { label: "News", href: "/news" },
  { label: "Contact", href: "/contact" },
];

const programLinks = PROGRAM_CATEGORIES.map(({ title, href }) => ({
  label: title,
  href,
}));

const linkClass =
  "group inline-flex items-center gap-1.5 font-body text-sm text-white/70 transition-colors hover:text-white";

function FooterHeading({ children }) {
  return (
    <h3 className="mb-3 font-body text-xs font-bold uppercase tracking-[0.18em] text-[#9cc3ff]">
      {children}
    </h3>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  const phoneHref = `tel:${SITE_CONFIG.phone.replace(/\s/g, "")}`;

  return (
    <footer className="bg-gradient-to-b from-[#0b2342] to-[#071a33] text-white">
      {/* Main */}
      <div className="mx-auto max-w-[1280px] px-5 py-12 md:px-16 md:py-[4.5rem]">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1.3fr_1.2fr_1fr_1.3fr] lg:gap-10">
          {/* Brand */}
          <div>
            <Link
              to="/"
              className="inline-block rounded-xl bg-white px-3 py-2 shadow-sm"
              aria-label={`${SITE_CONFIG.name} home`}
            >
              <img
                src="/images/newlogo.png"
                alt={SITE_CONFIG.fullName}
                className="h-10 w-auto"
              />
            </Link>
            <p className="mt-3 max-w-xs font-body text-sm leading-6 text-white/70">
              {SITE_CONFIG.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={SITE_CONFIG.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with us on WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-[#25d366] hover:text-white"
              >
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
              </a>
              <a
                href={`mailto:${SITE_CONFIG.email}`}
                aria-label="Email us"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-[#1e5bab] hover:text-white"
              >
                <Mail className="h-5 w-5" aria-hidden="true" />
              </a>
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-[#1e5bab] hover:text-white"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <nav aria-label="Explore">
            <FooterHeading>Explore</FooterHeading>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Programs */}
          <nav aria-label="Our programs">
            <FooterHeading>Our programs</FooterHeading>
            <ul className="space-y-2">
              {programLinks.map((link) => (
                <li key={link.href + link.label}>
                  <Link to={link.href} className={linkClass}>
                    {link.label}
                    <ArrowRight
                      className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <FooterHeading>Get in touch</FooterHeading>
            <ul className="space-y-2.5 font-body text-sm text-white/70">
              <li>
                <a
                  href={`mailto:${SITE_CONFIG.email}`}
                  className="flex items-start gap-3 transition-colors hover:text-white"
                >
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#9cc3ff]" aria-hidden="true" />
                  <span className="break-all">{SITE_CONFIG.email}</span>
                </a>
              </li>
              <li>
                <a
                  href={phoneHref}
                  className="flex items-start gap-3 transition-colors hover:text-white"
                >
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#9cc3ff]" aria-hidden="true" />
                  {SITE_CONFIG.phone}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#9cc3ff]" aria-hidden="true" />
                <address className="not-italic leading-5">
                  {SITE_CONFIG.address.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-1.5 px-5 py-4 text-center md:flex-row md:px-16 md:text-left">
          <p className="font-body text-xs text-white/50">
            &copy; {year} {SITE_CONFIG.fullName}. All rights reserved.
          </p>
          <p className="font-body text-xs text-white/50">
            {SITE_CONFIG.tagline}
          </p>
        </div>
      </div>
    </footer>
  );
}
