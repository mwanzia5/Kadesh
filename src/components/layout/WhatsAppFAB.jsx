import { motion } from "framer-motion";
import { Phone } from "lucide-react";
import { SITE_CONFIG } from "@/constants";
import ClickSpark from "@/components/ui/ClickSpark";

export default function WhatsAppFAB() {
  return (
    <ClickSpark sparkColor="#25D366" sparkSize={10} sparkRadius={18} sparkCount={8} duration={400}>
      <motion.a
        href={SITE_CONFIG.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:scale-110 transition-transform"
        aria-label="Chat on WhatsApp"
        animate={{
          scale: [1, 1.12, 1],
          boxShadow: [
            "0 0 0 0 rgba(37, 211, 102, 0.4)",
            "0 0 0 12px rgba(37, 211, 102, 0)",
            "0 0 0 0 rgba(37, 211, 102, 0)",
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Phone className="w-6 h-6" />
      </motion.a>
    </ClickSpark>
  );
}
