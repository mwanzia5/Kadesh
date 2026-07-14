import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

function OptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  ...props
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <motion.img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      onLoad={() => setLoaded(true)}
      initial={{ opacity: 0, filter: "blur(10px)" }}
      animate={
        loaded
          ? { opacity: 1, filter: "blur(0px)" }
          : { opacity: 0, filter: "blur(10px)" }
      }
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn("object-cover", className)}
      {...props}
    />
  );
}

export default OptimizedImage;
