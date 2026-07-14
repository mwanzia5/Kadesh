import { cn } from "@/lib/utils";
import ScrollReveal from "./ScrollReveal";

function highlightText(text, highlight) {
  if (!highlight) return text;

  const parts = text.split(new RegExp(`(${highlight})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === highlight.toLowerCase() ? (
      <span key={i} className="text-vibrant-blue">
        {part}
      </span>
    ) : (
      part
    )
  );
}

function SectionHeading({
  title,
  subtitle,
  highlight,
  align = "center",
  light = false,
  className,
  ...props
}) {
  return (
    <ScrollReveal
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className
      )}
      {...props}
    >
      <h2
        className={cn(
          "font-display text-headline-lg md:text-display-lg-mobile",
          light ? "text-white" : "text-deep-navy"
        )}
      >
        {highlightText(title, highlight)}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "font-body text-body-lg mt-4",
            light ? "text-white/70" : "text-on-surface-variant"
          )}
        >
          {subtitle}
        </p>
      )}
    </ScrollReveal>
  );
}

export default SectionHeading;
