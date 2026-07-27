import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPlant, plants } from '../../lib/plants';
import { getVendor } from '../../lib/vendors';

const WHATSAPP_NUMBER = '17875550123';

export function generateStaticParams() {
  return plants.map((plant) => ({ slug: plant.slug }));
}

const careLabels: { key: keyof (typeof plants)[number]['care']; label: string }[] = [
  { key: 'light', label: 'Luz' },
  { key: 'water', label: 'Riego' },
  { key: 'soil', label: 'Sustrato' },
  { key: 'commonIssues', label: 'Problemas comunes' },
];

export default function PlantDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const plant = getPlant(params.slug);

  if (!plant) {
    notFound();
  }

  const vendor = getVendor(plant.vendorId);
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `¡Hola! Me interesa la ${plant.name} de ${vendor?.name ?? 'Plantera'}.`,
  )}`;

  return (
    <div className="container section" style={{ display: 'grid', gap: '3rem' }}>
      <Link
        href="/#coleccion"
        style={{
          fontSize: '0.85rem',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}
      >
        ← Volver a la colección
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
            className="serif"
            style={{ fontSize: '1.9rem', color: 'var(--green-700)' }}
          >
            ${plant.price.toFixed(2)}
          </span>
          <p className="lead">{plant.description}</p>
          <hr className="hairline" />
          <p style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
            Disponibilidad: {plant.stock} en inventario
          </p>
          <div>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
            >
              Pregunta por esta planta
            </a>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <span className="eyebrow">Guía de cuidado</span>
          <h2 style={{ fontSize: '1.9rem' }}>Cómo cuidar esta planta</h2>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '0 2.5rem',
          }}
        >
          {careLabels.map((item) => (
            <div
              key={item.key}
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
                {item.label}
              </span>
              <p style={{ color: 'var(--muted)', lineHeight: 1.65 }}>
                {plant.care[item.key]}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
