import { cn } from "@/lib/utils";

const variants = {
  glass: "bg-white/10 backdrop-blur-md border border-white/20",
  solid: "bg-white shadow-md border border-surface-dim/10",
};

function Card({ variant = "solid", className, children, ...props }) {
  return (
    <div
      className={cn(
        "rounded-2xl transition-shadow duration-300 hover:shadow-xl",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn("px-6 pt-6", className)} {...props}>
      {children}
    </div>
  );
}

function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn("font-display text-headline-md text-deep-navy", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

function CardDescription({ className, children, ...props }) {
  return (
    <p
      className={cn("font-body text-body text-on-surface-variant mt-2", className)}
      {...props}
    >
      {children}
    </p>
  );
}

function CardContent({ className, children, ...props }) {
  return (
    <div className={cn("px-6 py-4", className)} {...props}>
      {children}
    </div>
  );
}

function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn("px-6 pb-6 pt-2 flex items-center gap-3", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
