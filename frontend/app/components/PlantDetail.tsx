'use client';

import Link from 'next/link';
import type { Plant } from '../lib/plants';
import { getVendor } from '../lib/vendors';
import { formatMoney } from '../lib/format';
import { useLang } from '../lib/i18n';

const WHATSAPP_NUMBER = '17875550123';

const COPY = {
  es: {
    back: '← Volver a la colección',
    availability: (stock: number) => `Disponibilidad: ${stock} en inventario`,
    cta: 'Pregunta por esta planta',
    careEyebrow: 'Guía de cuidado',
    careTitle: 'Cómo cuidar esta planta',
    careLabels: {
      light: 'Luz',
      water: 'Riego',
      soil: 'Sustrato',
      commonIssues: 'Problemas comunes',
    },
    whatsapp: (plant: string, vendor: string) =>
      `¡Hola! Me interesa la ${plant} de ${vendor}.`,
  },
  en: {
    back: '← Back to the collection',
    availability: (stock: number) => `Availability: ${stock} in stock`,
    cta: 'Ask about this plant',
    careEyebrow: 'Care guide',
    careTitle: 'How to care for this plant',
    careLabels: {
      light: 'Light',
      water: 'Water',
      soil: 'Soil',
      commonIssues: 'Common issues',
    },
    whatsapp: (plant: string, vendor: string) =>
      `Hi! I'm interested in the ${plant} from ${vendor}.`,
  },
};

const CARE_KEYS = ['light', 'water', 'soil', 'commonIssues'] as const;

export default function PlantDetail({ plant }: { plant: Plant }) {
  const { lang } = useLang();
  const copy = COPY[lang];
  const vendor = getVendor(plant.vendorId);
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    copy.whatsapp(plant.name, vendor?.name ?? 'Plantera'),
  )}`;

  return (
    <div className="container section" style={{ display: 'grid', gap: '3rem' }}>
      <Link
        href="/pitch#coleccion"
        style={{
          fontSize: '0.85rem',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}
      >
        {copy.back}
      </Link>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '3rem',
          alignItems: 'start',
        }}
      >
        <div className="frame frame--45">
          <img src={plant.image} alt={plant.name} />
        </div>

        <div style={{ display: 'grid', gap: '1.25rem', alignContent: 'start' }}>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <span className="eyebrow eyebrow--sage">
              {vendor?.name} · {vendor?.location}
            </span>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}>
              {plant.name}
            </h1>
          </div>
          <span
            className="display"
            style={{ fontSize: '1.9rem', color: 'var(--green-700)' }}
          >
            {formatMoney(plant.price)}
          </span>
          <p className="lead">{plant.description[lang]}</p>
          <hr className="hairline" />
          <p style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
            {copy.availability(plant.stock)}
          </p>
          <div>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
            >
              {copy.cta}
            </a>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <span className="eyebrow">{copy.careEyebrow}</span>
          <h2 style={{ fontSize: '1.9rem' }}>{copy.careTitle}</h2>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '0 2.5rem',
          }}
        >
          {CARE_KEYS.map((key) => (
            <div
              key={key}
              style={{
                padding: '1.25rem 0',
                borderTop: '1px solid var(--line)',
                display: 'grid',
                gap: '0.4rem',
                alignContent: 'start',
              }}
            >
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--gold)',
                }}
              >
                {copy.careLabels[key]}
              </span>
              <p style={{ color: 'var(--muted)', lineHeight: 1.65 }}>
                {plant.care[key][lang]}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
