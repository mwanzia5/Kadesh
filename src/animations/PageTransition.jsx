import { motion } from "framer-motion";
import { pageTransition, smoothTransition } from "./variants";

export default function PageTransition({ children, className = "" }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
      transition={smoothTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}
