'use client';

import { useLang, type Lang } from '../lib/i18n';

export default function LangToggle({ dark = false }: { dark?: boolean }) {
  const { lang, setLang } = useLang();

  const option = (value: Lang) => (
    <button
      type="button"
      onClick={() => setLang(value)}
      aria-pressed={lang === value}
      style={{
        border: 'none',
        background: 'none',
        padding: '0.2rem 0.35rem',
        fontSize: '0.78rem',
        fontWeight: 600,
        letterSpacing: '0.12em',
        color:
          lang === value
            ? dark
              ? 'var(--cream)'
              : 'var(--ink)'
            : 'var(--sage)',
        textDecoration: lang === value ? 'underline' : 'none',
        textUnderlineOffset: '4px',
      }}
    >
      {value.toUpperCase()}
    </button>
  );

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.1rem',
        border: dark
          ? '1px solid rgba(243,239,230,0.25)'
          : '1px solid var(--line)',
        borderRadius: '999px',
        padding: '0.25rem 0.5rem',
        background: dark ? 'transparent' : 'var(--surface)',
        width: 'fit-content',
      }}
    >
      {option('es')}
      <span style={{ color: dark ? 'rgba(243,239,230,0.3)' : 'var(--line)' }}>
        ·
      </span>
      {option('en')}
    </span>
  );
}
