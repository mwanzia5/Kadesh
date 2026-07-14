import { cn } from "@/lib/utils";

const backgrounds = {
  white: "bg-white",
  gray: "bg-gray-50",
  navy: "bg-deep-navy text-white",
};

function Section({
  id,
  background = "white",
  className,
  children,
  ...props
}) {
  return (
    <section
      id={id}
      className={cn("py-16 lg:py-24", backgrounds[background], className)}
      {...props}
    >
      {children}
    </section>
  );
}

export default Section;
