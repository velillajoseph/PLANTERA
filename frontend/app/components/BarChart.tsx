'use client';

import { useState } from 'react';
import { formatMoney } from '../lib/format';

type BarChartProps = {
  data: { month: string; revenue: number }[];
  selectedIndex?: number | null;
  onSelect?: (index: number | null) => void;
};

export default function BarChart({ data, selectedIndex = null, onSelect }: BarChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...data.map((point) => point.revenue));

  return (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '0.9rem',
          height: 160,
          padding: '0 0.25rem',
        }}
      >
        {data.map((point, index) => {
          const heightPct = Math.max((point.revenue / max) * 100, 4);
          const isHovered = hovered === index;
          const isSelected = selectedIndex === index;
          return (
            <button
              key={point.month}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${point.month}: ${formatMoney(point.revenue)}`}
              onClick={() => onSelect?.(isSelected ? null : index)}
              style={{
                position: 'relative',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                height: '100%',
                background: 'none',
                border: 'none',
                padding: 0,
              }}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
            >
              {isHovered && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: `calc(${heightPct}% + 10px)`,
                    background: 'var(--ink)',
                    color: 'var(--cream)',
                    padding: '0.3rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    zIndex: 1,
                  }}
                >
                  {formatMoney(point.revenue)}
                </span>
              )}
              <span
                style={{
                  width: '100%',
                  maxWidth: 32,
                  height: `${heightPct}%`,
                  background: isSelected
                    ? 'var(--gold)'
                    : isHovered
                      ? 'var(--ink)'
                      : 'var(--green-700)',
                  borderRadius: '4px 4px 0 0',
                  transition: 'background 0.15s ease',
                }}
              />
            </button>
          );
        })}
      </div>
      <div
        style={{
          display: 'flex',
          gap: '0.9rem',
          padding: '0.4rem 0.25rem 0',
          borderTop: '1px solid var(--line)',
        }}
      >
        {data.map((point, index) => (
          <span
            key={point.month}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: '0.75rem',
              color: selectedIndex === index ? 'var(--ink)' : 'var(--muted)',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {point.month}
          </span>
        ))}
      </div>
    </div>
  );
}
