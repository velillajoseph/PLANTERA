'use client';

import { useState } from 'react';
import Link from 'next/link';
import { careGuides } from '../../lib/care-guides';
import { useLang } from '../../lib/i18n';

const COPY = {
  es: {
    eyebrow: 'Guías de cuidado',
    title: 'Cuida tus plantas como quien las cultivó.',
    lead: 'Guías escritas para el clima de Puerto Rico —humedad alta, sol fuerte, temporada de lluvia— no copiadas de un blog de clima templado.',
    basicsTitle: 'Las tres reglas que salvan más plantas',
    basics: [
      {
        title: 'Riega menos de lo que crees',
        copy: 'El exceso de agua mata más plantas que la sequía. Mete el dedo: si la tierra está húmeda a una pulgada, espera.',
      },
      {
        title: 'La luz importa más que el fertilizante',
        copy: 'Una planta con luz correcta perdona casi todo lo demás. Muévela antes de comprarle abono.',
      },
      {
        title: 'El drenaje no es opcional',
        copy: 'Toda maceta necesita hueco. Sin salida para el agua, las raíces se pudren aunque riegues bien.',
      },
    ],
    guidesTitle: 'Guías por género',
    guidesLead: 'Selecciona un género para ver su guía completa.',
    difficulty: 'Dificultad',
    petSafe: 'Mascotas',
    petSafeYes: 'Segura',
    petSafeNo: 'Fuera de alcance',
    light: 'Luz',
    water: 'Riego',
    soil: 'Sustrato',
    issues: 'Problemas comunes',
    shopGenus: (genus: string) => `Comprar ${genus} →`,
    ctaTitle: '¿Dudas con una planta?',
    ctaCopy: 'Escríbenos y te ayudamos a diagnosticarla — aunque no la hayas comprado aquí.',
    ctaButton: 'Escríbenos',
  },
  en: {
    eyebrow: 'Care guides',
    title: 'Care for your plants like the person who grew them.',
    lead: 'Guides written for Puerto Rico’s climate — high humidity, strong sun, rainy season — not copied from a temperate-climate blog.',
    basicsTitle: 'The three rules that save the most plants',
    basics: [
      {
        title: 'Water less than you think',
        copy: 'Overwatering kills more plants than drought. Test with a finger: if the soil is damp an inch down, wait.',
      },
      {
        title: 'Light matters more than fertilizer',
        copy: 'A plant with the right light forgives almost everything else. Move it before you buy it food.',
      },
      {
        title: 'Drainage is not optional',
        copy: 'Every pot needs a hole. With no way out for water, roots rot even when you water correctly.',
      },
    ],
    guidesTitle: 'Guides by genus',
    guidesLead: 'Pick a genus to read its full guide.',
    difficulty: 'Difficulty',
    petSafe: 'Pets',
    petSafeYes: 'Safe',
    petSafeNo: 'Keep out of reach',
    light: 'Light',
    water: 'Water',
    soil: 'Soil',
    issues: 'Common issues',
    shopGenus: (genus: string) => `Shop ${genus} →`,
    ctaTitle: 'Struggling with a plant?',
    ctaCopy: 'Write to us and we will help you diagnose it — even if you did not buy it here.',
    ctaButton: 'Get in touch',
  },
};

export default function CarePage() {
  const { lang } = useLang();
  const copy = COPY[lang];
  const [activeGenus, setActiveGenus] = useState(careGuides[0].genus);

  const guide = careGuides.find((entry) => entry.genus === activeGenus)!;

  return (
    <div>
      <section className="section" style={{ paddingBottom: '2rem' }}>
        <div className="container" style={{ display: 'grid', gap: '1.25rem', maxWidth: '46rem' }}>
          <span className="eyebrow">{copy.eyebrow}</span>
          <h1 className="page-title">{copy.title}</h1>
          <p className="lead" style={{ fontSize: '1.05rem' }}>
            {copy.lead}
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container" style={{ display: 'grid', gap: '1.5rem' }}>
          <h2 className="section-title">{copy.basicsTitle}</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 100%), 1fr))',
              gap: '1.25rem',
            }}
          >
            {copy.basics.map((basic, index) => (
              <div key={basic.title} className="card" style={{ display: 'grid', gap: '0.55rem' }}>
                <span className="display" style={{ color: 'var(--gold)', fontSize: '1.1rem' }}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 style={{ fontSize: '1.08rem' }}>{basic.title}</h3>
                <p style={{ fontSize: '0.92rem', color: 'var(--muted)', lineHeight: 1.65 }}>
                  {basic.copy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <h2 className="section-title">{copy.guidesTitle}</h2>
            <p className="lead" style={{ fontSize: '0.95rem' }}>
              {copy.guidesLead}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {careGuides.map((entry) => (
              <button
                key={entry.genus}
                type="button"
                className={`chip${entry.genus === activeGenus ? ' chip--active' : ''}`}
                onClick={() => setActiveGenus(entry.genus)}
              >
                {entry.genus}
              </button>
            ))}
          </div>

          <div key={guide.genus} className="card reveal" style={{ display: 'grid', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <span className="eyebrow eyebrow--sage">{guide.common[lang]}</span>
              <h3 className="section-title">{guide.genus}</h3>
              <p className="lead" style={{ fontSize: '0.98rem' }}>
                {guide.summary[lang]}
              </p>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>
                  <strong style={{ color: 'var(--ink)' }}>{copy.difficulty}:</strong>{' '}
                  {guide.difficulty[lang]}
                </span>
                <span style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>
                  <strong style={{ color: 'var(--ink)' }}>{copy.petSafe}:</strong>{' '}
                  {guide.petSafe ? copy.petSafeYes : copy.petSafeNo}
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(230px, 100%), 1fr))',
                gap: '0 2.5rem',
              }}
            >
              {(
                [
                  ['light', copy.light],
                  ['water', copy.water],
                  ['soil', copy.soil],
                  ['commonIssues', copy.issues],
                ] as const
              ).map(([key, label]) => (
                <div
                  key={key}
                  style={{
                    padding: '1.15rem 0',
                    borderTop: '1px solid var(--line)',
                    display: 'grid',
                    gap: '0.4rem',
                    alignContent: 'start',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: 'var(--gold)',
                    }}
                  >
                    {label}
                  </span>
                  <p style={{ color: 'var(--muted)', lineHeight: 1.65, fontSize: '0.93rem' }}>
                    {guide[key][lang]}
                  </p>
                </div>
              ))}
            </div>

            <div>
              <Link
                href={`/shop?genus=${encodeURIComponent(guide.genus)}`}
                className="btn btn--small"
              >
                {copy.shopGenus(guide.genus)}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div
          className="container"
          style={{
            display: 'grid',
            gap: '1rem',
            justifyItems: 'center',
            textAlign: 'center',
            maxWidth: '36rem',
          }}
        >
          <h2 className="section-title">{copy.ctaTitle}</h2>
          <p className="lead">{copy.ctaCopy}</p>
          <Link href="/contact" className="btn btn--ghost">
            {copy.ctaButton}
          </Link>
        </div>
      </section>
    </div>
  );
}
