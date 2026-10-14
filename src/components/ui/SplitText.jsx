import { useRef, useEffect } from "react";
import { useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { cn } from "@/lib/utils";

function SplitText({
  text,
  children,
  className,
  delay = 0.1,
  duration = 0.8,
  stagger = 0.03,
  ...props
}) {
  const containerRef = useRef(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!containerRef.current) return;

    const el = containerRef.current;
    const chars = el.querySelectorAll(".split-char");

    if (chars.length === 0) return;
    if (reduceMotion) {
      gsap.set(chars, { clearProps: "all" });
      return;
    }

    const animation = gsap.fromTo(
      chars,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration,
        delay,
        stagger,
        ease: "power3.out",
        clearProps: "all",
      },
    );

    return () => animation.kill();
  }, [text, delay, duration, stagger, reduceMotion]);

  if (text) {
    return (
      <span
        ref={containerRef}
        className={cn("inline-block", className)}
        {...props}
      >
        {text.split("").map((char, i) => (
          <span key={i} className="split-char inline-block">
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </span>
    );
  }

  return (
    <span
      ref={containerRef}
      className={cn("inline-block", className)}
      {...props}
    >
      {children}
    </span>
  );
}

export default SplitText;
