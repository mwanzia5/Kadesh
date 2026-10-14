import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  HeartPulse,
  School,
  Sprout,
  UserRound,
} from "lucide-react";
import { useDonorAuth } from "@/context/DonorAuthContext";
import { getGravatarUrl } from "@/lib/utils";
import { buildProjectCategories } from "@/lib/navProjects";
import { isProgramLinkActive } from "@/lib/programs";

const categories = buildProjectCategories();
const icons = {
  education: School,
  healthcare: HeartPulse,
  "social-development": Sprout,
};

export function AccountLink({ onNavigate }) {
  const { user, profile, loading } = useDonorAuth();
  const label = user
    ? profile?.first_name
      ? `${profile.first_name}'s account`
      : "My account"
    : "Sign in or create an account";

  if (loading) {
    return (
      <span
        className="site-nav-account is-loading"
        role="status"
        aria-label="Loading account"
      >
        <UserRound size={25} aria-hidden="true" />
      </span>
    );
  }

  return (
    <Link
      to={user ? "/account" : "/login"}
      onClick={onNavigate}
      className="site-nav-account"
      aria-label={label}
      title={label}
    >
      {user ? (
        <span className="site-nav-avatar">
          <span aria-hidden="true">
            {profile?.first_name?.charAt(0)?.toUpperCase() || "D"}
          </span>
          {getGravatarUrl(user.email) && (
            <img
              src={getGravatarUrl(user.email, 88, "404")}
              alt=""
              onError={(event) => {
                event.currentTarget.hidden = true;
              }}
            />
          )}
        </span>
      ) : (
        <UserRound size={25} strokeWidth={1.7} aria-hidden="true" />
      )}
    </Link>
  );
}

export function NavigationActions({ onNavigate }) {
  return (
    <div className="site-nav-ctas">
      <Link
        to="/sponsor-a-child"
        className="site-nav-cta site-nav-sponsor"
        onClick={onNavigate}
      >
        Sponsor a Child
      </Link>
      <Link
        to="/donate"
        className="site-nav-cta site-nav-donate"
        onClick={onNavigate}
      >
        Donate <ArrowUpRight size={18} aria-hidden="true" />
      </Link>
    </div>
  );
}

export function ProjectNavigation({ pathname, search, onNavigate }) {
  const navigate = useNavigate();
  return (
    <div className="site-nav-project-grid">
      {categories.map((category) => {
        const Icon = icons[category.id];
        return (
          // The whole card opens the category. Links inside it (the heading
          // and each project) keep working and handle keyboard access.
          // tabIndex={-1} lets a click on the card's blank areas keep focus
          // inside the menu, so the menu doesn't close before the click lands.
          <div
            className={`site-nav-category site-nav-category-${category.id} is-clickable`}
            key={category.id}
            tabIndex={-1}
            onClick={(event) => {
              if (event.target.closest("a")) return;
              onNavigate?.();
              navigate(category.href);
            }}
          >
            <Link
              to={category.href}
              onClick={onNavigate}
              className="site-nav-category-heading"
              aria-current={
                isProgramLinkActive(category.href, pathname, search)
                  ? "page"
                  : undefined
              }
            >
              <span className="site-nav-category-icon">
                <Icon size={25} strokeWidth={1.6} aria-hidden="true" />
              </span>
              <span>{category.category}</span>
              <ArrowUpRight
                className="site-nav-category-arrow"
                size={18}
                aria-hidden="true"
              />
            </Link>
            <p>{category.description}</p>
            <ul>
              {category.items.map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    onClick={onNavigate}
                    aria-current={
                      isProgramLinkActive(item.href, pathname, search)
                        ? "page"
                        : undefined
                    }
                  >
                    <span>{item.label}</span>
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
