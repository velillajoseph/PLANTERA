import Link from 'next/link';

export function LeafMark({
  size = 22,
  color = 'var(--green-700)',
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={(size * 30) / 48}
      viewBox="0 0 48 30"
      fill="none"
      aria-hidden
    >
      <path
        d="M23.5 30 C23.5 25 24 21 25 16"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M25 16 C25 7 32 1 42 1 C42 10 35 17 25 16 Z"
        fill={color}
      />
      <path
        d="M24 19 C24 12 18 7 10 7 C10 15 16 20 24 19 Z"
        fill={color}
      />
    </svg>
  );
}

export default function Logo({
  leafColor = 'var(--green-700)',
  textColor = 'inherit',
  fontSize = '1.05rem',
  href = '/',
}: {
  leafColor?: string;
  textColor?: string;
  fontSize?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className="logo"
      // Size travels as a custom property, not an inline font-size: an inline
      // value outranks every stylesheet rule, so narrow phones could never
      // shrink the wordmark and the header refused to fit below 377px.
      style={{ '--logo-size': fontSize } as React.CSSProperties}
      aria-label="Plantera"
    >
      <LeafMark color={leafColor} />
      <span className="display logo__word" style={{ color: textColor }}>
        PLANTERA
      </span>
    </Link>
  );
}
