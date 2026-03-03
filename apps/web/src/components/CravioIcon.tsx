import { PulseIcon } from './PulseIcon';

interface CravioIconProps {
  size?: number;
  color?: string;
  className?: string;
}

export function CravioIcon({ size = 24, color = '#c2410c', className }: CravioIconProps) {
  return <PulseIcon size={size} color={color} className={className} />;
}
