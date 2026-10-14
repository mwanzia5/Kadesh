import { createContext, useState } from "react";
import { Download, FileText, Plus } from "lucide-react";

const MotionContext = createContext(null);

export function ProjectSurface({ children, className }) {
  const [paused, setPaused] = useState(false);
  return (
    <MotionContext.Provider value={{ paused, setPaused }}>
      <div
        className={`project-surface ${className}`}
        data-motion-paused={paused}
      >
        {children}
      </div>
    </MotionContext.Provider>
  );
}

export function ProjectMotif({ side = "right" }) {
  return (
    <div className={`project-motif project-motif-${side}`} aria-hidden="true">
      <span className="project-orbit project-orbit-outer" />
      <span className="project-orbit project-orbit-inner" />
      <svg viewBox="0 0 560 300" fill="none">
        <path d="M-20 205 C90 205 75 75 195 75 S300 260 425 165 S525 90 585 115" />
      </svg>
    </div>
  );
}

export function ProjectMarquee({ items }) {
  return (
    <div className="project-marquee">
      <p className="sr-only">{items.join(". ")}.</p>
      <div className="project-marquee-window" aria-hidden="true">
        <div className="project-marquee-track">
          {[0, 1].map((copy) => (
            <div className="project-marquee-group" key={copy}>
              {items.map((text) => (
                <span key={text}>
                  {text}
                  <Plus size={19} strokeWidth={1} />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProjectDocument({
  id,
  href,
  filename,
  title,
  description,
  meta,
}) {
  return (
    <a id={id} href={href} download={filename} className="project-document">
      <span className="project-document-icon" aria-hidden="true">
        <FileText size={29} strokeWidth={1.4} />
        <span>PDF</span>
      </span>
      <span className="project-document-copy">
        <span className="project-document-eyebrow">Explore the full story</span>
        <strong>{title}</strong>
        <span className="project-document-description">{description}</span>
        <small>{meta}</small>
        <span className="project-document-action">
          Download PDF
          <Download size={16} aria-hidden="true" />
        </span>
      </span>
    </a>
  );
}
