import Navbar from "./Navbar";
import Footer from "./Footer";
import WhatsAppFAB from "./WhatsAppFAB";
import ScrollToTop from "./ScrollToTop";
import NewsPopup from "@/components/ui/NewsPopup";

export default function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-vibrant-blue focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-vibrant-blue"
      >
        Skip to main content
      </a>
      <ScrollToTop />
      <Navbar />
      <main id="main-content" className="flex-1 pt-20">{children}</main>
      <Footer />
      <WhatsAppFAB />
      <NewsPopup />
    </div>
  );
}
