import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

/** Stroke icon used across the shell; sized in px, coloured by currentColor. */
function Stroke({ size = 18, strokeWidth = 1.6, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const MenuIcon = (p: IconProps) => (
  <Stroke size={22} strokeWidth={1.5} {...p}>
    <path d="M4 7h16M4 12h16M4 17h10" />
  </Stroke>
);

export const SearchIcon = (p: IconProps) => (
  <Stroke size={19} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </Stroke>
);

export const BagIcon = (p: IconProps) => (
  <Stroke size={17} {...p}>
    <path d="M6 4h12l1 16H5L6 4z" />
    <path d="M9 8a3 3 0 006 0" />
  </Stroke>
);

export const ChevronDownIcon = (p: IconProps) => (
  <Stroke size={12} strokeWidth={2} {...p}>
    <path d="M6 9l6 6 6-6" />
  </Stroke>
);

export const ArrowUpIcon = (p: IconProps) => (
  <Stroke size={16} strokeWidth={2} {...p}>
    <path d="M12 19V5M5 12l7-7 7 7" />
  </Stroke>
);

export const PlayIcon = ({ size = 20, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>
    <path d="M8 5.5v13l11-6.5z" />
  </svg>
);

export const WhatsAppIcon = ({ size = 19, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>
    <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.3-.8-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.3z" />
  </svg>
);

export const InstagramIcon = (p: IconProps) => (
  <Stroke size={17} {...p}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
  </Stroke>
);

export const FacebookIcon = ({ size = 17, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>
    <path d="M14 8h3V4h-3a4 4 0 00-4 4v2H7v4h3v8h4v-8h3l1-4h-4V8z" />
  </svg>
);

export const TikTokIcon = ({ size = 17, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>
    <path d="M16.6 3a5.4 5.4 0 004.4 4.4v3.3a8.6 8.6 0 01-4.4-1.3v6.2a6.1 6.1 0 11-6.1-6.1c.3 0 .6 0 .9.1v3.4a2.8 2.8 0 102 2.6V3h3.2z" />
  </svg>
);

/* Trust bar icons */
export const ShopIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M3 9l9-6 9 6v11H3z" />
    <path d="M9 20v-6h6v6" />
  </Stroke>
);
export const BoxIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 7h16v13H4z" />
    <path d="M8 7V4h8v3" />
  </Stroke>
);
export const TruckIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M2 7h12v9H2zM14 10h4l3 3v3h-7z" />
    <circle cx="6" cy="17.5" r="1.8" />
    <circle cx="17" cy="17.5" r="1.8" />
  </Stroke>
);
export const StarIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z" />
  </Stroke>
);
export const HeartIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M12 21s-7-4.5-7-11a4 4 0 017-2.6A4 4 0 0119 10c0 6.5-7 11-7 11z" />
  </Stroke>
);
export const CheckIcon = (p: IconProps) => (
  <Stroke size={18} strokeWidth={2.4} {...p}>
    <path d="M5 12l5 5L20 7" />
  </Stroke>
);
