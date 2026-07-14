import { cn } from "@/lib/utils";

function Container({ className, children, ...props }) {
  return (
    <div className={cn("max-w-[1280px] mx-auto px-5 md:px-16", className)} {...props}>
      {children}
    </div>
  );
}

export default Container;
