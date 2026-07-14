import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import ClickSpark from "./ClickSpark";

function GlareHover({
  children,
  className,
  glareColor = "#2563EB",
  glareOpacity = 0.3,
  ...props
}) {
  const containerRef = useRef(null);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setGlarePosition({ x, y });
  }, []);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        background: isHovered
          ? `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, ${glareColor}${Math.round(glareOpacity * 255)
              .toString(16)
              .padStart(2, "0")} 0%, transparent 60%)`
          : undefined,
      }}
      {...props}
    >
      <ClickSpark sparkColor={glareColor} sparkSize={8} sparkRadius={14} sparkCount={8} duration={350}>
        {children}
      </ClickSpark>
    </div>
  );
}

export default GlareHover;
