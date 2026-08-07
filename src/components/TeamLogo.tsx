import type { CSSProperties, ReactNode } from 'react';
import type { Team } from '../game/types';

interface Props {
  team: Pick<Team, 'id' | 'primary' | 'secondary' | 'accent' | 'abbrev'>;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

function Badge({
  common,
  fill,
  children,
  rim,
}: {
  common: Record<string, unknown>;
  fill: string;
  children: ReactNode;
  rim?: string;
}) {
  return (
    <svg {...common}>
      <defs>
        <radialGradient id={`glow-${String(common['aria-label'])}`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="55%" stopColor={fill} stopOpacity="1" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill={`url(#glow-${String(common['aria-label'])})`} />
      <circle cx="32" cy="32" r="30" fill="none" stroke={rim ?? 'rgba(255,255,255,0.22)'} strokeWidth="2" />
      {children}
    </svg>
  );
}

/** Franchise crests inspired by the 32-team league sheet. */
export function TeamLogo({ team, size = 36, className, style }: Props) {
  const p = team.primary;
  const s = team.secondary;
  const a = team.accent;
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 64 64',
    className,
    style: { flexShrink: 0, displayRendering: 'geometricPrecision' as const, ...style },
    'aria-label': team.abbrev,
  };

  switch (team.id) {
    case 'pit': // Industrial metallic P
      return (
        <Badge common={common} fill={p} rim={s}>
          <path
            d="M20 14h16c8 0 13 4 13 11s-5 11-13 11H28v14h-8V14zm8 7v8h7c3.5 0 5.5-1.6 5.5-4S38.5 21 35 21H28z"
            fill={s}
            stroke={a}
            strokeWidth="1.2"
          />
          <path d="M18 12l4-2M42 12l4-2M18 52l4 2" stroke={a} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
        </Badge>
      );
    case 'cle': // Guitar pick + electric guitar
      return (
        <svg {...common}>
          <path d="M32 5c11 11 20 24 20 36a20 20 0 1 1-40 0C12 29 21 16 32 5z" fill={p} stroke={s} strokeWidth="2.5" />
          <path d="M29 18h6v10l7 14H22l7-14V18z" fill={s} />
          <rect x="30.5" y="12" width="3" height="8" rx="1" fill={a} />
          <circle cx="32" cy="40" r="3.5" fill={a} />
          <path d="M24 34h16M26 38h12" stroke={a} strokeWidth="1.2" opacity="0.8" />
        </svg>
      );
    case 'cin': // Ship wheel with R
      return (
        <Badge common={common} fill={p} rim={a}>
          {[0, 45, 90, 135].map((deg) => (
            <rect
              key={deg}
              x="30"
              y="6"
              width="4"
              height="16"
              rx="1"
              fill={s}
              transform={`rotate(${deg} 32 32)`}
            />
          ))}
          <circle cx="32" cy="32" r="12" fill={p} stroke={s} strokeWidth="3" />
          <circle cx="32" cy="32" r="22" fill="none" stroke={s} strokeWidth="2.5" />
          <text x="32" y="38" textAnchor="middle" fontSize="16" fontWeight="800" fill={s} fontFamily="Georgia, serif">
            R
          </text>
        </Badge>
      );
    case 'bal': // Battleship silhouette
      return (
        <Badge common={common} fill={p} rim={a}>
          <path d="M8 38h48l-5 9H13z" fill={a} />
          <path d="M14 38V24h7l3 7h10l3-7h7v14" fill={s} />
          <rect x="29" y="12" width="4" height="14" fill={a} />
          <path d="M31 12l8-4" stroke={a} strokeWidth="2" strokeLinecap="round" />
          <circle cx="20" cy="42" r="1.6" fill={p} />
          <circle cx="32" cy="42" r="1.6" fill={p} />
          <circle cx="44" cy="42" r="1.6" fill={p} />
        </Badge>
      );
    case 'bos': // Hooded phantom skull
      return (
        <Badge common={common} fill={p} rim={s}>
          <path d="M18 18c0-10 28-10 28 0v12c0 14-6 22-14 22S18 44 18 30z" fill={s} />
          <path d="M22 22c2-6 18-6 20 0v6c0 3-2 5-4 5H26c-2 0-4-2-4-5z" fill={a} />
          <ellipse cx="26" cy="30" rx="3.2" ry="3.8" fill={p} />
          <ellipse cx="38" cy="30" rx="3.2" ry="3.8" fill={p} />
          <path d="M28 40h8v3.5c0 2-8 2-8 0z" fill={p} />
          <path d="M24 48c4 4 12 4 16 0" stroke={s} strokeWidth="2" fill="none" />
        </Badge>
      );
    case 'nyc': // Liberty crown / head
      return (
        <Badge common={common} fill={p} rim={s}>
          <path d="M18 40h28v10H18z" fill={s} />
          <path d="M22 40c2-14 8-20 10-22 2 2 8 8 10 22" fill={a} />
          <path d="M20 22l5-10 7 8 7-8 5 10" fill={a} stroke={s} strokeWidth="1" />
          <rect x="30" y="8" width="4" height="10" fill={s} />
          <path d="M28 10h8l-4-6z" fill="#F5C518" />
        </Badge>
      );
    case 'mia': // Cyclone swirl
      return (
        <Badge common={common} fill={p} rim={s}>
          <path
            d="M32 10c14 0 22 9 22 20 0 10-8 16-18 16-8 0-14-4-14-10s5-9 12-8"
            fill="none"
            stroke={s}
            strokeWidth="5.5"
            strokeLinecap="round"
          />
          <path
            d="M34 18c8 1 12 6 12 12"
            fill="none"
            stroke={a}
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.9"
          />
          <circle cx="32" cy="32" r="5" fill={s} />
          <circle cx="32" cy="32" r="2.2" fill={a} />
        </Badge>
      );
    case 'buf': // Angry snowman + top hat
      return (
        <Badge common={common} fill={p} rim={s}>
          <circle cx="32" cy="42" r="12" fill={s} />
          <circle cx="32" cy="26" r="9.5" fill={s} />
          <rect x="22" y="14" width="20" height="5" rx="1" fill={a} />
          <rect x="27" y="6" width="10" height="10" rx="1" fill={a} />
          <circle cx="28.5" cy="25" r="1.6" fill={a} />
          <circle cx="35.5" cy="25" r="1.6" fill={a} />
          <path d="M30 29l5 1.5-5 1.5z" fill="#FC4C02" />
          <path d="M27 33h10" stroke={a} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="32" cy="40" r="1.4" fill={a} />
          <circle cx="32" cy="45" r="1.4" fill={a} />
        </Badge>
      );
    case 'jax': // Alligator head
      return (
        <Badge common={common} fill={p} rim={s}>
          <path d="M8 34c10-14 28-18 44-6 2 4 2 8-2 11-10 6-22 8-30 6-6 3-12 3-16-1 2-4 3-7 4-10z" fill={s} />
          <path d="M14 36c6 2 18 4 28 1 2 2 1 5-2 6-10 3-20 2-26-1z" fill={a} />
          <circle cx="44" cy="28" r="2.8" fill={a} />
          <path d="M40 34h10M38 37h8" stroke={p} strokeWidth="1.4" />
          <path d="M50 32l8 3-7 4z" fill={s} />
        </Badge>
      );
    case 'nas': // Growling bear profile
      return (
        <Badge common={common} fill={p} rim={s}>
          <ellipse cx="30" cy="34" rx="16" ry="15" fill={a} />
          <circle cx="18" cy="20" r="7" fill={a} />
          <circle cx="18" cy="20" r="3.5" fill={s} />
          <path d="M34 28c8-2 16 2 18 10-6 2-12 4-18 3-2-4-2-9 0-13z" fill={s} />
          <circle cx="36" cy="30" r="2.2" fill={p} />
          <path d="M42 38c2 2 4 3 7 3" stroke={s} strokeWidth="2" fill="none" />
          <path d="M28 42h10" stroke={p} strokeWidth="2" strokeLinecap="round" />
        </Badge>
      );
    case 'hou': // Rocket + star trail
      return (
        <Badge common={common} fill={p} rim={a}>
          <path d="M14 48l6-6 4 4-6 6z" fill={s} opacity="0.85" />
          <path d="M20 44l4-4" stroke={a} strokeWidth="2" />
          <path d="M36 8c10 12 10 30 0 44-10-14-10-32 0-44z" fill={s} />
          <path d="M36 14c5 8 5 22 0 34" stroke={a} strokeWidth="2" fill="none" opacity="0.5" />
          <circle cx="36" cy="28" r="4.5" fill={a} stroke={p} strokeWidth="1.5" />
          <path d="M28 40l8 14 8-14H28z" fill={s} />
          <path d="M30 42h12l-6 8z" fill="#FC4C02" />
          <polygon points="18,18 19.5,22 24,22 20.5,25 22,29 18,26.5 14,29 15.5,25 12,22 16.5,22" fill={a} />
        </Badge>
      );
    case 'ind': // Open-wheel race car
      return (
        <Badge common={common} fill={p} rim={s}>
          <ellipse cx="32" cy="36" rx="20" ry="8" fill={s} />
          <path d="M18 34h28l-3-8H21z" fill={s} />
          <path d="M24 26h10l2 6H22z" fill={a} />
          <circle cx="16" cy="38" r="6" fill={a} stroke={p} strokeWidth="2" />
          <circle cx="48" cy="38" r="6" fill={a} stroke={p} strokeWidth="2" />
          <circle cx="16" cy="38" r="2" fill={s} />
          <circle cx="48" cy="38" r="2" fill={s} />
          <rect x="30" y="20" width="3" height="8" fill={s} />
        </Badge>
      );
    case 'lv': // Raptor head profile
      return (
        <Badge common={common} fill={p} rim={s}>
          <path d="M10 42c8-20 30-28 44-12-2 4-6 8-12 12-2 4-6 8-12 8-8 0-16-4-20-8z" fill={s} />
          <path d="M40 24c8-4 16-2 18 4l-10 4z" fill={a} />
          <path d="M28 36c4 2 10 4 16 2" stroke={a} strokeWidth="2" fill="none" />
          <circle cx="38" cy="30" r="2.6" fill={p} />
          <circle cx="38.8" cy="29.4" r="1" fill={a} />
          <path d="M18 40l-6 6M22 44l-4 6" stroke={s} strokeWidth="2" strokeLinecap="round" />
        </Badge>
      );
    case 'sd': // Koala face
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="30" fill={s} />
          <circle cx="32" cy="32" r="30" fill="none" stroke={a} strokeWidth="2" />
          <circle cx="14" cy="22" r="11" fill={a} />
          <circle cx="50" cy="22" r="11" fill={a} />
          <circle cx="14" cy="22" r="6" fill={p} />
          <circle cx="50" cy="22" r="6" fill={p} />
          <circle cx="32" cy="36" r="17" fill={p} stroke={a} strokeWidth="2" />
          <circle cx="25" cy="33" r="2.8" fill={s} />
          <circle cx="39" cy="33" r="2.8" fill={s} />
          <ellipse cx="32" cy="42" rx="4.5" ry="3.2" fill={a} />
        </svg>
      );
    case 'den': // Three mountain peaks
      return (
        <Badge common={common} fill={s} rim={p}>
          <path d="M4 50L20 18l10 16 8-14 22 30H4z" fill={p} />
          <path d="M20 18l5 10-5 3z" fill={a} />
          <path d="M38 20l4 8-3 2z" fill={a} />
          <path d="M8 50h48" stroke={a} strokeWidth="2" opacity="0.35" />
        </Badge>
      );
    case 'kc': // Charging bull / stampede
      return (
        <Badge common={common} fill={p} rim={s}>
          <path d="M12 40c4-16 22-22 34-12 2 6 2 14-2 18H18c-5-2-8-4-6-6z" fill={s} />
          <path d="M40 22c8-4 16 0 18 8l-10 3z" fill={a} />
          <path d="M14 28c-4-2-8 0-10 4 4 0 8 2 10 4z" fill={a} />
          <circle cx="44" cy="32" r="2.4" fill={p} />
          <path d="M28 44c2 4 6 6 10 6" stroke={a} strokeWidth="2" fill="none" />
          <path d="M22 36h8" stroke={p} strokeWidth="2" />
        </Badge>
      );
    case 'chi': // Blaze fireball
      return (
        <Badge common={common} fill={p} rim={s}>
          <path d="M32 10c10 12 14 18 14 28a14 14 0 1 1-28 0c0-8 5-14 10-20 0 10 5 12 5 12s3-8 0-20z" fill={s} />
          <path d="M32 22c5 6 7 10 7 16a7 7 0 1 1-14 0c0-4 2-7 5-10 0 5 2 6 2 6s1-4 0-12z" fill={a} />
        </Badge>
      );
    case 'det': // Interlocking gears
      return (
        <Badge common={common} fill={s} rim={p}>
          <circle cx="26" cy="30" r="13" fill="none" stroke={p} strokeWidth="5" />
          {[0, 45, 90, 135].map((d) => (
            <rect key={`g1-${d}`} x="24" y="14" width="4" height="8" fill={p} transform={`rotate(${d} 26 30)`} />
          ))}
          <circle cx="26" cy="30" r="4.5" fill={p} />
          <circle cx="40" cy="38" r="11" fill="none" stroke={a} strokeWidth="4" />
          {[20, 65, 110, 155].map((d) => (
            <rect key={`g2-${d}`} x="38" y="25" width="4" height="7" fill={a} transform={`rotate(${d} 40 38)`} />
          ))}
          <circle cx="40" cy="38" r="3.5" fill={a} />
        </Badge>
      );
    case 'gb': // Crossed axes
      return (
        <Badge common={common} fill={p} rim={s}>
          <g stroke={s} strokeWidth="5" strokeLinecap="round">
            <line x1="16" y1="16" x2="48" y2="48" />
            <line x1="48" y1="16" x2="16" y2="48" />
          </g>
          <path d="M12 12l12 2-3 11z" fill={s} />
          <path d="M52 12l-12 2 3 11z" fill={s} />
          <path d="M12 52l12-2-3-11z" fill={s} />
          <path d="M52 52l-12-2 3-11z" fill={s} />
          <circle cx="32" cy="32" r="4" fill={a} stroke={s} strokeWidth="1.5" />
        </Badge>
      );
    case 'min': // Viking longship
      return (
        <Badge common={common} fill={p} rim={s}>
          <path d="M6 42c10 10 42 10 52 0-6 5-16 8-26 8S12 47 6 42z" fill={s} />
          <path d="M10 40c2-2 6-2 8 0M20 40c2-2 6-2 8 0M30 40c2-2 6-2 8 0M40 40c2-2 6-2 8 0" stroke={a} strokeWidth="1.5" />
          <path d="M18 40l8-18h5l4 12 4-12h5l8 18" fill="none" stroke={a} strokeWidth="2.5" />
          <path d="M10 38l-6-5 5-2z" fill={s} />
          <path d="M54 38l6-4-4-3z" fill={s} />
          <path d="M12 33l-2-6 5 2z" fill={a} />
        </Badge>
      );
    case 'dal': // Block W with star
      return (
        <Badge common={common} fill={p} rim={s}>
          <text x="32" y="46" textAnchor="middle" fontSize="34" fontWeight="900" fill={s} fontFamily="Arial Black, sans-serif">
            W
          </text>
          <polygon points="32,14 33.5,18.5 38,18.5 34.5,21.5 36,26 32,23.5 28,26 29.5,21.5 26,18.5 30.5,18.5" fill={a} />
        </Badge>
      );
    case 'phi': // Founders shield + liberty bell
      return (
        <svg {...common}>
          <path d="M32 4l22 8v20c0 14-10 24-22 28C20 56 10 46 10 32V12z" fill={p} stroke={s} strokeWidth="2.5" />
          <circle cx="22" cy="22" r="2.3" fill={a} />
          <circle cx="32" cy="18" r="2.3" fill={a} />
          <circle cx="42" cy="22" r="2.3" fill={a} />
          <path d="M24 30h16c1 0 2 1 2 2v6c0 6-20 6-20 0v-6c0-1 1-2 2-2z" fill={a} />
          <rect x="30" y="28" width="4" height="4" fill={s} />
          <path d="M28 40h8" stroke={s} strokeWidth="1.5" />
        </svg>
      );
    case 'was': // Spartan / sentinel helmet
      return (
        <Badge common={common} fill={p} rim={s}>
          <path d="M16 38c0-16 32-16 32 0v8H16z" fill={s} />
          <path d="M20 30c4-12 20-12 24 0" fill="none" stroke={s} strokeWidth="4" />
          <path d="M28 14h8l2 8H26z" fill={a} />
          <rect x="30" y="20" width="4" height="16" fill={a} />
          <path d="M22 40h20" stroke={p} strokeWidth="2" opacity="0.5" />
        </Badge>
      );
    case 'ric': // R with speed lines
      return (
        <Badge common={common} fill={p} rim={s}>
          <path d="M8 22h10M6 28h12M8 34h10" stroke={a} strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
          <text x="36" y="44" textAnchor="middle" fontSize="34" fontWeight="800" fill={s} fontFamily="Georgia, serif">
            R
          </text>
        </Badge>
      );
    case 'sea': // Faceted emerald
      return (
        <Badge common={common} fill={s} rim={p}>
          <path d="M32 8l18 16-18 32L14 24z" fill={p} />
          <path d="M32 8l18 16H14z" fill={a} opacity="0.35" />
          <path d="M14 24h36L32 56z" fill="#000" opacity="0.18" />
          <path d="M32 8l-8 16h16z" fill="#fff" opacity="0.2" />
        </Badge>
      );
    case 'cal': // Condor head
      return (
        <Badge common={common} fill={p} rim={s}>
          <path d="M8 36c14-12 24-10 28-4 4-6 14-10 28-2-12 6-18 12-28 12S18 42 8 36z" fill={s} />
          <path d="M34 28c6-2 12 0 16 4l-8 4z" fill={a} />
          <circle cx="38" cy="30" r="2.8" fill={a} />
          <path d="M20 34c4 2 8 4 14 4" stroke={a} strokeWidth="2" fill="none" />
          <path d="M14 40l-6 6" stroke={s} strokeWidth="2" strokeLinecap="round" />
        </Badge>
      );
    case 'la': // Five-point star
      return (
        <Badge common={common} fill={p} rim={s}>
          <polygon
            points="32,10 36.5,24 51,24 39.5,33 43.5,47 32,38 20.5,47 24.5,33 13,24 27.5,24"
            fill={s}
            stroke={a}
            strokeWidth="1.2"
          />
        </Badge>
      );
    case 'ari': // Scorpion
      return (
        <Badge common={common} fill={p} rim={s}>
          <path d="M16 42c8-4 12-12 14-18 2 8 8 16 18 18-10 3-18 5-24 2-5 5-10 5-14 0 2-1 4-2 6-2z" fill={s} />
          <path d="M30 24c0-10 5-16 10-18" stroke={a} strokeWidth="3.2" fill="none" strokeLinecap="round" />
          <circle cx="42" cy="8" r="3.2" fill={a} />
          <path d="M18 36c-4-2-8-2-10 2M48 40c4 0 8 2 10 5" stroke={a} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </Badge>
      );
    case 'atl': // Phoenix rising
      return (
        <Badge common={common} fill={p} rim={s}>
          <path d="M32 50c-5-12-16-16-20-26 12 2 16 10 20 10 4 0 8-8 20-10-4 10-15 14-20 26z" fill={s} />
          <path d="M18 20c8 0 12 5 14 10 2-5 6-10 14-10-8 8-10 14-14 14s-6-6-14-14z" fill={a} />
          <path d="M26 48c2 4 6 6 6 6s4-2 6-6" stroke={a} strokeWidth="2" fill="none" />
        </Badge>
      );
    case 'car': // Ocean wave
      return (
        <Badge common={common} fill={p} rim={s}>
          <path d="M6 42c10-16 20-16 28-4 8-12 18-12 28 4-12 5-20 7-28 4-10 5-20 5-28-4z" fill={s} />
          <path d="M10 38c8-8 14-8 20-2" stroke={a} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M34 34c6-6 12-6 18-1" stroke={a} strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.7" />
        </Badge>
      );
    case 'tb': // Trident
      return (
        <Badge common={common} fill={s} rim={p}>
          <path
            d="M18 14v12c0 5 5 8 10 8h-3v20h6V34h3c5 0 10-3 10-8V14h-5v10c0 2.5-2.5 4-5 4h-3V14h-5v14h-3c-2.5 0-5-1.5-5-4V14z"
            fill={p}
          />
          <circle cx="32" cy="34" r="3" fill={a} />
        </Badge>
      );
    case 'no': // Voodoo skull + top hat
      return (
        <Badge common={common} fill={p} rim={s}>
          <rect x="24" y="6" width="16" height="10" rx="1" fill={s} />
          <rect x="20" y="14" width="24" height="4" fill={s} />
          <path d="M36 6c4-4 10-2 12 2-4 1-8 2-12 0z" fill={a} />
          <circle cx="32" cy="34" r="14" fill={s} />
          <ellipse cx="26" cy="32" rx="3.2" ry="3.8" fill={p} />
          <ellipse cx="38" cy="32" rx="3.2" ry="3.8" fill={p} />
          <path d="M28 40h8v3.5c0 2-8 2-8 0z" fill={p} />
          <path d="M22 48h20" stroke={a} strokeWidth="2.5" strokeLinecap="round" />
        </Badge>
      );
    default:
      return (
        <Badge common={common} fill={p} rim={s}>
          <text x="32" y="40" textAnchor="middle" fontSize="18" fontWeight="700" fill={s}>
            {team.abbrev.slice(0, 2)}
          </text>
        </Badge>
      );
  }
}
