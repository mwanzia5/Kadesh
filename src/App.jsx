import { lazy, Suspense } from "react";
import { Routes, Route, useLocation, Link } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Layout from "@/components/layout/Layout";
import PageLoader from "@/components/ui/PageLoader";
import { DonorAuthProvider } from "@/context/DonorAuthContext";

const Home = lazy(() => import("@/pages/Home"));
const About = lazy(() => import("@/pages/About"));
const Contact = lazy(() => import("@/pages/Contact"));
const Donate = lazy(() => import("@/pages/Donate"));
const DonorAuth = lazy(() => import("@/pages/DonorAuth"));
const Gallery = lazy(() => import("@/pages/Gallery"));
const Videos = lazy(() => import("@/pages/Videos"));
const ChildEducation = lazy(() => import("@/pages/projects/ChildEducation"));
const HomeCare = lazy(() => import("@/pages/projects/HomeCare"));
const LuminaCharis = lazy(() => import("@/pages/projects/LuminaCharis"));
const Borewell = lazy(() => import("@/pages/projects/Borewell"));
const News = lazy(() => import("@/pages/News"));
const NewsArticle = lazy(() => import("@/pages/NewsArticle"));
const BethlehemBread = lazy(() => import("@/pages/projects/BethlehemBread"));
const ProjectDetail = lazy(() => import("@/pages/projects/ProjectDetail"));
const SponsorAChild = lazy(() => import("@/pages/SponsorAChild"));
const ChildProfile = lazy(() => import("@/pages/ChildProfile"));
const DonorDashboard = lazy(() => import("@/pages/DonorDashboard"));
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminLoginPage = lazy(() => import("@/pages/admin/AdminLoginPage"));

export default function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  const routes = (
    <Routes location={location}>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/donate" element={<Donate />} />
      <Route path="/donor-auth" element={<DonorAuth />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/videos" element={<Videos />} />
      <Route path="/projects/child-education" element={<ChildEducation />} />
      <Route path="/projects/home-care" element={<HomeCare />} />
      <Route path="/projects/lumina-charis" element={<LuminaCharis />} />
      <Route path="/projects/borewell" element={<Borewell />} />
      <Route path="/news" element={<News />} />
      <Route path="/news/:id" element={<NewsArticle />} />
      <Route path="/projects/bethlehem-bread" element={<BethlehemBread />} />
      <Route path="/projects/:slug" element={<ProjectDetail />} />
      <Route path="/sponsor-a-child" element={<SponsorAChild />} />
      <Route path="/sponsor-a-child/:id" element={<ChildProfile />} />
      <Route path="/account" element={<DonorDashboard />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/*" element={<AdminDashboard />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );

  if (isAdmin) {
    return (
      <AnimatePresence mode="wait">
        <Suspense fallback={<PageLoader />}>{routes}</Suspense>
      </AnimatePresence>
    );
  }

  return (
    <DonorAuthProvider>
      <Layout>
        <AnimatePresence mode="wait">
          <Suspense fallback={<PageLoader />}>{routes}</Suspense>
        </AnimatePresence>
      </Layout>
    </DonorAuthProvider>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-deep-navy">
      <div className="text-center text-white px-6">
        <h1 className="font-display text-8xl font-bold text-vibrant-blue mb-4">404</h1>
        <h2 className="font-display text-2xl font-semibold mb-4">Page Not Found</h2>
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
