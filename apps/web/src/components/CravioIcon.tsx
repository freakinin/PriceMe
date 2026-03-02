interface CravioIconProps {
  size?: number;
  color?: string;
  className?: string;
}

export function CravioIcon({ size = 24, color = '#c2410c', className }: CravioIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M18 14 L18 82 L88 82"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="28" cy="62" r="4" fill={color} />
      <circle cx="44" cy="48" r="4" fill={color} />
      <circle cx="58" cy="54" r="4" fill={color} />
      <circle cx="38" cy="36" r="4" fill={color} />
      <circle cx="65" cy="30" r="4" fill={color} />
      <circle cx="52" cy="70" r="4" fill={color} />
      <circle cx="72" cy="44" r="4" fill={color} />
    </svg>
  );
}
