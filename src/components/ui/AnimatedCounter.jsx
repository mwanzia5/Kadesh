import { useState, useEffect, useRef } from "react";
import { useInView } from "framer-motion";

function AnimatedCounter({ end, suffix = "", duration = 2000, ...props }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;

    let startTime = null;
    let rafId;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [isInView, end, duration]);

  const formatted = count.toLocaleString("en-US");

  return (
    <span ref={ref} {...props}>
      {formatted}
      {suffix}
    </span>
  );
}

export default AnimatedCounter;
