import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
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
const Partners = lazy(() => import("@/pages/Partners"));
const Teams = lazy(() => import("@/pages/Teams"));
const ChildEducation = lazy(() => import("@/pages/projects/ChildEducation"));
const HomeCare = lazy(() => import("@/pages/projects/HomeCare"));
const LuminaCharis = lazy(() => import("@/pages/projects/LuminaCharis"));
const Community = lazy(() => import("@/pages/projects/Community"));
const Borewell = lazy(() => import("@/pages/projects/Borewell"));
const WomenProjects = lazy(() => import("@/pages/projects/WomenProjects"));
const ImpactStatistics = lazy(() => import("@/pages/ImpactStatistics"));
const News = lazy(() => import("@/pages/News"));
const NewsArticle = lazy(() => import("@/pages/NewsArticle"));
const BethlehemBread = lazy(() => import("@/pages/projects/BethlehemBread"));
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminLoginPage = lazy(() => import("@/pages/admin/AdminLoginPage"));

export default function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  const routes = (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/donate" element={<Donate />} />
      <Route path="/donor-auth" element={<DonorAuth />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/videos" element={<Videos />} />
      <Route path="/partners" element={<Partners />} />
      <Route path="/teams" element={<Teams />} />
      <Route path="/projects/child-education" element={<ChildEducation />} />
      <Route path="/projects/home-care" element={<HomeCare />} />
      <Route path="/projects/lumina-charis" element={<LuminaCharis />} />
      <Route path="/projects/community" element={<Community />} />
      <Route path="/projects/borewell" element={<Borewell />} />
      <Route path="/projects/women" element={<WomenProjects />} />
      <Route path="/impact" element={<ImpactStatistics />} />
      <Route path="/news" element={<News />} />
      <Route path="/news/:id" element={<NewsArticle />} />
      <Route path="/projects/bethlehem-bread" element={<BethlehemBread />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/*" element={<AdminDashboard />} />
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
