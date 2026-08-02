import type { CSSProperties } from 'react';
import type { Team } from '../game/types';

interface Props {
  team: Pick<Team, 'id' | 'primary' | 'secondary' | 'accent' | 'abbrev'>;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

/** Compact SVG marks inspired by each franchise identity. */
export function TeamLogo({ team, size = 36, className, style }: Props) {
  const p = team.primary;
  const s = team.secondary;
  const a = team.accent;
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 64 64',
    className,
    style: { flexShrink: 0, ...style },
    'aria-label': team.abbrev,
  } as const;

  switch (team.id) {
    case 'pit': // Iron P
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill={p} />
          <text x="32" y="42" textAnchor="middle" fontSize="34" fontWeight="800" fill={s} fontFamily="Arial Black, sans-serif">
            P
          </text>
        </svg>
      );
    case 'cle': // Guitar pick + headstock
      return (
        <svg {...common}>
          <path d="M32 6c10 10 18 22 18 34a18 18 0 1 1-36 0C14 28 22 16 32 6z" fill={p} stroke={s} strokeWidth="3" />
          <rect x="28" y="22" width="8" height="18" rx="1" fill={s} />
          <circle cx="32" cy="20" r="3" fill={a} />
        </svg>
      );
    case 'cin': // Paddle wheel
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill={p} />
          <circle cx="32" cy="32" r="8" fill={s} />
          {[0, 45, 90, 135].map((deg) => (
            <rect
              key={deg}
              x="30"
              y="8"
              width="4"
              height="20"
              fill={s}
              transform={`rotate(${deg} 32 32)`}
            />
          ))}
        </svg>
      );
    case 'bal': // Warship
      return (
        <svg {...common}>
          <rect width="64" height="64" rx="10" fill={p} />
          <path d="M8 40h48l-6 10H14z" fill={a} />
          <path d="M18 40V22h6l4 8h8l4-8h6v18" fill={s} />
          <rect x="30" y="12" width="4" height="12" fill={a} />
        </svg>
      );
    case 'bos': // Phantom skull hood
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill={p} />
          <path d="M18 20c0-8 28-8 28 0v10c0 12-6 18-14 18s-14-6-14-18z" fill={s} />
          <circle cx="26" cy="30" r="3" fill={p} />
          <circle cx="38" cy="30" r="3" fill={p} />
          <path d="M28 40h8v4h-8z" fill={p} />
        </svg>
      );
    case 'nyc': // Liberty crown / torch
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill={p} />
          <path d="M20 38h24v8H20z" fill={s} />
          <path d="M22 38l4-14 6 8 6-8 4 14" fill={a} />
          <rect x="30" y="10" width="4" height="12" fill={s} />
          <path d="M28 12h8l-4-6z" fill="#F5C518" />
        </svg>
      );
    case 'mia': // Cyclone swirl
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill={p} />
          <path
            d="M32 12c12 0 20 8 20 18S44 44 32 44 14 38 14 30s6-12 14-10"
            fill="none"
            stroke={s}
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle cx="32" cy="32" r="5" fill={a} />
        </svg>
      );
    case 'buf': // Snowman
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill={p} />
          <circle cx="32" cy="40" r="12" fill={a} />
          <circle cx="32" cy="24" r="9" fill={s} />
          <rect x="22" y="14" width="20" height="6" rx="1" fill={p} />
          <rect x="28" y="8" width="8" height="8" fill={p} />
          <circle cx="29" cy="23" r="1.5" fill={p} />
          <circle cx="35" cy="23" r="1.5" fill={p} />
        </svg>
      );
    case 'jax': // Alligator
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill={p} />
          <path d="M10 36c8-10 36-14 44-2-8 6-20 10-28 8-6 4-12 4-16 0z" fill={s} />
          <circle cx="42" cy="28" r="2.5" fill={a} />
          <path d="M48 34l8 2-6 4z" fill={s} />
        </svg>
      );
    case 'nas': // Bear head
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill={p} />
          <circle cx="20" cy="20" r="7" fill={s} />
          <circle cx="44" cy="20" r="7" fill={s} />
          <ellipse cx="32" cy="34" rx="16" ry="14" fill={a} />
          <ellipse cx="32" cy="38" rx="7" ry="5" fill={p} />
          <circle cx="26" cy="30" r="2" fill={p} />
          <circle cx="38" cy="30" r="2" fill={p} />
        </svg>
      );
    case 'hou': // Rocket
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill={p} />
          <path d="M32 8c8 10 8 28 0 40-8-12-8-30 0-40z" fill={s} />
          <circle cx="32" cy="28" r="4" fill={a} />
          <path d="M24 40l8 12 8-12H24z" fill={s} />
        </svg>
      );
    case 'ind': // Indy car
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill={p} />
          <ellipse cx="32" cy="34" rx="18" ry="7" fill={s} />
          <circle cx="18" cy="36" r="5" fill={a} />
          <circle cx="46" cy="36" r="5" fill={a} />
          <path d="M26 28h16l4 6H22z" fill={s} />
        </svg>
      );
    case 'lv': // Raptor
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill={p} />
          <path d="M12 40c8-18 28-24 40-10-10 2-16 8-20 14-6 0-14-2-20-4z" fill={s} />
          <path d="M44 26l10-6-2 10z" fill={a} />
          <circle cx="40" cy="30" r="2.5" fill={p} />
        </svg>
      );
    case 'sd': // Koala
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill={s} />
          <circle cx="16" cy="22" r="10" fill={a} />
          <circle cx="48" cy="22" r="10" fill={a} />
          <circle cx="32" cy="34" r="16" fill={p} stroke={a} strokeWidth="2" />
          <circle cx="26" cy="32" r="2.5" fill={s} />
          <circle cx="38" cy="32" r="2.5" fill={s} />
          <ellipse cx="32" cy="40" rx="4" ry="3" fill={a} />
        </svg>
      );
    case 'den': // Peaks
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill={s} />
          <path d="M6 48L22 18l10 16 8-12 18 26H6z" fill={p} />
          <path d="M22 18l4 8-4 2z" fill={a} />
        </svg>
      );
    case 'kc': // Stampede buffalo
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill={p} />
          <path d="M14 38c4-14 20-18 30-10 2 6 2 12-2 16H18c-4-2-6-4-4-6z" fill={s} />
          <path d="M40 24c6-2 12 0 14 6l-8 2z" fill={a} />
          <circle cx="44" cy="30" r="2" fill={p} />
        </svg>
      );
    case 'chi': // Blaze flame
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill={p} />
          <path d="M32 12c8 10 12 16 12 24a12 12 0 1 1-24 0c0-6 4-12 8-16 0 8 4 10 4 10s2-6 0-18z" fill={s} />
        </svg>
      );
    case 'det': // Gears
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill={s} />
          <circle cx="26" cy="30" r="12" fill="none" stroke={p} strokeWidth="5" />
          <circle cx="40" cy="36" r="10" fill="none" stroke={a} strokeWidth="4" />
          <circle cx="26" cy="30" r="4" fill={p} />
          <circle cx="40" cy="36" r="3" fill={a} />
        </svg>
      );
    case 'gb': // Crossed axes
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill={p} />
          <g stroke={s} strokeWidth="5" strokeLinecap="round">
            <line x1="18" y1="18" x2="46" y2="46" />
            <line x1="46" y1="18" x2="18" y2="46" />
          </g>
          <path d="M14 14l10 2-2 10z" fill={s} />
          <path d="M50 14l-10 2 2 10z" fill={s} />
        </svg>
      );
    case 'min': // Longship
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill={p} />
          <path d="M8 40c8 8 40 8 48 0-4 4-12 6-24 6S12 44 8 40z" fill={s} />
          <path d="M16 40l8-16h4l4 10 4-10h4l8 16" fill="none" stroke={a} strokeWidth="3" />
          <path d="M12 38l-6-4 4-2z" fill={s} />
        </svg>
      );
    case 'dal': // Block W
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill={p} />
          <text x="32" y="44" textAnchor="middle" fontSize="32" fontWeight="900" fill={s} fontFamily="Arial Black, sans-serif">
            W
          </text>
        </svg>
      );
    case 'phi': // Founders shield / bell
      return (
        <svg {...common}>
          <path d="M32 4l22 8v20c0 14-10 24-22 28C20 56 10 46 10 32V12z" fill={p} stroke={s} strokeWidth="3" />
          <circle cx="22" cy="24" r="2.5" fill={a} />
          <circle cx="32" cy="20" r="2.5" fill={a} />
          <circle cx="42" cy="24" r="2.5" fill={a} />
          <path d="M26 34h12v8c0 4-12 4-12 0z" fill={a} />
        </svg>
      );
    case 'was': // Sentinel helmet
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill={p} />
          <path d="M16 36c0-14 32-14 32 0v6H16z" fill={s} />
          <path d="M20 28c4-10 20-10 24 0" fill="none" stroke={s} strokeWidth="4" />
          <rect x="30" y="18" width="4" height="14" fill={a} />
        </svg>
      );
    case 'ric': // Renegades R + star
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill={p} />
          <text x="30" y="44" textAnchor="middle" fontSize="34" fontWeight="800" fill={s} fontFamily="Georgia, serif">
            R
          </text>
          <polygon points="44,20 46,26 52,26 47,30 49,36 44,32 39,36 41,30 36,26 42,26" fill={a} />
        </svg>
      );
    case 'sea': // Emerald gem
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill={s} />
          <path d="M32 10l16 14-16 30L16 24z" fill={p} />
          <path d="M32 10l16 14H16z" fill={a} opacity="0.35" />
        </svg>
      );
    case 'cal': // Condor
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill={p} />
          <path d="M8 34c12-8 20-6 24-2 4-4 12-6 24 2-10 4-16 8-24 8s-14-4-24-8z" fill={s} />
          <circle cx="36" cy="30" r="2.5" fill={a} />
          <path d="M40 28l10-4-4 8z" fill={s} />
        </svg>
      );
    case 'la': // Shooting star
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill={p} />
          <polygon points="38,16 41,26 52,26 43,32 46,42 38,36 30,42 33,32 24,26 35,26" fill={s} />
          <path d="M12 44c8-4 14-10 18-16" stroke={a} strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'ari': // Scorpion
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill={p} />
          <path d="M18 40c6-2 10-8 12-14 2 6 6 12 14 14-8 2-14 4-20 2-4 4-8 4-12 0z" fill={s} />
          <path d="M30 26c0-8 4-14 8-16" stroke={a} strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="40" cy="10" r="3" fill={a} />
        </svg>
      );
    case 'atl': // Phoenix
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill={p} />
          <path d="M32 48c-4-10-14-14-18-22 10 2 14 8 18 8 4 0 8-6 18-8-4 8-14 12-18 22z" fill={s} />
          <path d="M20 22c6 0 10 4 12 8 2-4 6-8 12-8-6 6-8 10-12 10s-6-4-12-10z" fill={a} />
        </svg>
      );
    case 'car': // Wave
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill={p} />
          <path d="M8 40c8-12 16-12 24-4 8-10 16-10 24 2-10 4-18 6-24 4-8 4-16 4-24-2z" fill={s} />
          <path d="M12 36c6-6 12-6 18-2" stroke={a} strokeWidth="3" fill="none" />
        </svg>
      );
    case 'tb': // Trident
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill={p} />
          <path d="M20 18v10c0 4 4 6 8 6h-2v18h4V34h2c4 0 8-2 8-6V18h-4v8c0 2-2 3-4 3h-2V18h-4v11h-2c-2 0-4-1-4-3V18z" fill={s} />
        </svg>
      );
    case 'no': // Voodoo skull
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill={p} />
          <circle cx="32" cy="28" r="14" fill={s} />
          <circle cx="26" cy="26" r="3" fill={p} />
          <circle cx="38" cy="26" r="3" fill={p} />
          <path d="M28 34h8v3h-8z" fill={p} />
          <path d="M22 44h20" stroke={a} strokeWidth="3" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill={p} />
          <text x="32" y="40" textAnchor="middle" fontSize="18" fontWeight="700" fill={s}>
            {team.abbrev.slice(0, 2)}
          </text>
        </svg>
      );
  }
}
