import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, useLocation, Link, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PROGRAM_CATEGORIES } from "@/lib/programs";
import Layout from "@/components/layout/Layout";
import PageLoader from "@/components/ui/PageLoader";
import { DonorAuthProvider } from "@/context/DonorAuthContext";
import { SponsorshipCartProvider } from "@/context/SponsorshipCartContext";
import { trackPageview } from "@/lib/analytics";
import { Sentry } from "@/lib/monitoring";

const Home = lazy(() => import("@/pages/Home"));
const About = lazy(() => import("@/pages/About"));
const Contact = lazy(() => import("@/pages/Contact"));
const Donate = lazy(() => import("@/pages/Donate"));
const SponsorshipCheckout = lazy(() => import("@/pages/SponsorshipCheckout"));
const DonorAuth = lazy(() => import("@/pages/DonorAuth"));
const Gallery = lazy(() => import("@/pages/Gallery"));
const Videos = lazy(() => import("@/pages/Videos"));
const ProgramCategory = lazy(() => import("@/pages/projects/ProgramCategory"));
const ProjectsOverview = lazy(
  () => import("@/pages/projects/ProjectsOverview"),
);
const News = lazy(() => import("@/pages/News"));
const NewsArticle = lazy(() => import("@/pages/NewsArticle"));
const ProjectDetail = lazy(() => import("@/pages/projects/ProjectDetail"));
const SponsorAChild = lazy(() => import("@/pages/SponsorAChild"));
const ChildProfile = lazy(() => import("@/pages/ChildProfile"));
const DonorDashboard = lazy(() => import("@/pages/DonorDashboard"));
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminLoginPage = lazy(() => import("@/pages/admin/AdminLoginPage"));

export default function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  useEffect(() => {
    trackPageview();
  }, [location.pathname, location.search]);

  const routes = (
    <Routes location={location}>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/donate" element={<Donate />} />
      <Route path="/donor-auth" element={<DonorAuth />} />
      <Route path="/login" element={<DonorAuth intent="login" />} />
      <Route path="/signup" element={<DonorAuth intent="signup" />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/videos" element={<Videos />} />
      <Route path="/projects" element={<ProjectsOverview />} />
      <Route
        path="/projects/education"
        element={<ProgramCategory key="education" categoryId="education" />}
      />
      <Route
        path="/projects/healthcare"
        element={<ProgramCategory key="healthcare" categoryId="healthcare" />}
      />
      <Route
        path="/projects/social-development"
        element={
          <ProgramCategory
            key="social-development"
            categoryId="social-development"
          />
        }
      />
      <Route path="/news" element={<News />} />
      <Route path="/news/:id" element={<NewsArticle />} />
      {PROGRAM_CATEGORIES.flatMap((category) => category.projects).map(
        (project) => (
          <Route
            key={project.slug}
            path={`/projects/${project.slug}`}
            element={<Navigate to={project.href} replace />}
          />
        ),
      )}
      <Route path="/projects/:slug" element={<ProjectDetail />} />
      <Route path="/sponsor-a-child" element={<SponsorAChild />} />
      <Route
        path="/sponsor-a-child/checkout"
        element={<SponsorshipCheckout />}
      />
      <Route path="/sponsor-a-child/:id" element={<ChildProfile />} />
      <Route path="/account" element={<DonorDashboard />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/*" element={<AdminDashboard />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );

  if (isAdmin) {
    return (
      <Sentry.ErrorBoundary fallback={<PageError />}>
        <AnimatePresence mode="wait">
          <Suspense fallback={<PageLoader />}>{routes}</Suspense>
        </AnimatePresence>
      </Sentry.ErrorBoundary>
    );
  }

  return (
    <DonorAuthProvider>
      <SponsorshipCartProvider>
        <Layout>
          <Sentry.ErrorBoundary fallback={<PageError />}>
            <AnimatePresence mode="wait">
              <Suspense fallback={<PageLoader />}>{routes}</Suspense>
            </AnimatePresence>
          </Sentry.ErrorBoundary>
        </Layout>
      </SponsorshipCartProvider>
    </DonorAuthProvider>
  );
}

function PageError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-deep-navy">
      <div className="text-center text-white px-6">
        <h1 className="font-display text-4xl font-bold text-vibrant-blue mb-4">
          Something went wrong
        </h1>
        <p className="font-body text-white/60 mb-8 max-w-md mx-auto">
          An unexpected error occurred. Please refresh the page to try again.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-vibrant-blue text-white rounded-lg font-body text-sm font-semibold hover:bg-vibrant-blue/90 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-deep-navy">
      <div className="text-center text-white px-6">
        <h1 className="font-display text-8xl font-bold text-vibrant-blue mb-4">
          404
        </h1>
        <h2 className="font-display text-2xl font-semibold mb-4">
          Page Not Found
        </h2>
        <p className="font-body text-white/60 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-vibrant-blue text-white rounded-lg font-body text-sm font-semibold hover:bg-vibrant-blue/90 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
