import { Link } from "react-router-dom";
import { FacebookIcon, TwitterIcon, YoutubeIcon, LinkedinIcon } from "@/components/ui/SocialIcons";
import { SITE_CONFIG } from "@/constants";

const socialIcons = [
  { icon: FacebookIcon, href: SITE_CONFIG.social.facebook, label: "Facebook" },
  { icon: TwitterIcon, href: SITE_CONFIG.social.twitter, label: "Twitter" },
  { icon: YoutubeIcon, href: SITE_CONFIG.social.youtube, label: "YouTube" },
  { icon: LinkedinIcon, href: SITE_CONFIG.social.linkedin, label: "LinkedIn" },
];

const exploreLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Programs", href: "/projects/child-education" },
  { label: "Gallery", href: "/gallery" },
  { label: "News", href: "/news" },
];

const orgLinks = [
  { label: "Partners", href: "/partners" },
  { label: "Contact", href: "/contact" },
  { label: "Donate", href: "/donate" },
  { label: "Get Involved", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="bg-deep-navy text-white">
      <div className="mx-auto max-w-[1280px] px-5 md:px-16 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <img
              src="/images/newlogo.png"
              alt="Kadesh Hope Mission"
              className="h-16 mb-5 brightness-0 invert"
            />
            <p className="text-body-md text-white/70 mb-6 max-w-xs">
              {SITE_CONFIG.description}
            </p>
            <div className="flex gap-3">
              {socialIcons.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white/70 hover:bg-vibrant-blue hover:text-white transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-label-bold uppercase tracking-wider mb-5 text-white">
              Explore
            </h3>
            <ul className="space-y-3">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-body-md text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Organization */}
          <div>
            <h3 className="text-label-bold uppercase tracking-wider mb-5 text-white">
              Organization
            </h3>
            <ul className="space-y-3">
              {orgLinks.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    to={link.href}
                    className="text-body-md text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="text-label-bold uppercase tracking-wider mb-5 text-white">
              Connect
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href={`mailto:${SITE_CONFIG.email}`}
                  className="text-body-md text-white/70 hover:text-white transition-colors"
                >
                  {SITE_CONFIG.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${SITE_CONFIG.phone.replace(/\s/g, "")}`}
                  className="text-body-md text-white/70 hover:text-white transition-colors"
                >
                  {SITE_CONFIG.phone}
                </a>
              </li>
              {SITE_CONFIG.regions.map((region) => (
                <li key={region} className="text-body-md text-white/70">
                  {region}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-[1280px] px-5 md:px-16 py-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-caption text-white/50">
            &copy; 2026 {SITE_CONFIG.name}. All rights reserved.
          </p>
          <p className="text-caption text-white/50">
            {SITE_CONFIG.tagline}
          </p>
        </div>
      </div>
    </footer>
  );
}
