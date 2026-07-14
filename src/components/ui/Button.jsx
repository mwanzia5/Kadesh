import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import ClickSpark from "./ClickSpark";

const variants = {
  primary: "bg-vibrant-blue text-white hover:bg-vibrant-blue/90 shadow-md hover:shadow-lg",
  secondary:
    "border-2 border-vibrant-blue text-vibrant-blue hover:bg-vibrant-blue/10",
  orange: "bg-hope-orange text-white hover:bg-hope-orange/90 shadow-md hover:shadow-lg",
  ghost: "bg-transparent text-on-surface hover:bg-surface-dim",
};

const sizes = {
  sm: "px-4 py-2 text-body-sm rounded-lg",
  md: "px-6 py-3 text-body rounded-xl",
  lg: "px-8 py-4 text-body-lg rounded-xl",
};

const Button = forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    className,
    as: Component = "button",
    children,
    ...props
  },
  ref
) {
  return (
    <Component
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center font-body font-semibold transition-all duration-300 cursor-pointer",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      <ClickSpark sparkColor="#ffffff" sparkSize={8} sparkRadius={12} sparkCount={6} duration={300}>
        {children}
      </ClickSpark>
    </Component>
  );
});

export default Button;
