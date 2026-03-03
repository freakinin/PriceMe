import { useRef } from "react";
import styles from "./PulseIcon.module.css";

interface PulseIconProps {
  className?: string;
  size?: number;
  color?: string;
}

export function PulseIcon({ className, size = 24, color }: PulseIconProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  function replay() {
    if (!svgRef.current) return;
    svgRef.current.querySelectorAll<SVGElement>("path, circle").forEach((el) => {
      el.style.animation = "none";
      el.getBoundingClientRect(); // force reflow so the browser registers the reset
      el.style.animation = "";
    });
  }

  return (
    <svg
      ref={svgRef}
      className={className}
      onMouseEnter={replay}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={color ? { color } : undefined}
    >
      <path className={styles.path} d="M2 12 H6 L9 3 L15 21 L18 12 H22" />
      <circle className={styles.dotFirst} cx="9" cy="3" r="2" fill="currentColor" stroke="none" />
      <circle className={styles.dotSecond} cx="15" cy="21" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}
