import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const directions = {
  up: { y: 40, x: 0 },
  down: { y: -40, x: 0 },
  left: { x: 40, y: 0 },
  right: { x: -40, y: 0 },
};

function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  className,
  ...props
}) {
  const reduceMotion = useReducedMotion();
  const offset = directions[direction] || directions.up;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -40px 0px", amount: 0.1 }}
      transition={{
        duration: reduceMotion ? 0 : 0.6,
        delay: reduceMotion ? 0 : delay,
        ease: "easeOut",
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export default ScrollReveal;
