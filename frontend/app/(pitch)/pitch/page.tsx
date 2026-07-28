'use client';

import PlantCard from '../../components/PlantCard';
import { plants } from '../../lib/plants';
import { useLang } from '../../lib/i18n';

// Número de demostración — reemplazar con el WhatsApp Business real de Plantera.
const WHATSAPP_NUMBER = '17875550123';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1545241047-6083a3684587?w=1000&q=80';
const VIVEROS_IMAGE =
  'https://images.unsplash.com/photo-1470058869958-2a77ade41c02?w=1000&q=80';

const COPY = {
  es: {
    whatsappMessage: '¡Hola Plantera! Quiero más información.',
    heroEyebrow: 'Marketplace de plantas · Puerto Rico',
    heroTitle: 'Plantas excepcionales, de los viveros de la isla.',
    heroLead:
      'Plantera conecta a compradores con los mejores viveros locales — con fotografía profesional, guías de cuidado y entrega coordinada hasta tu puerta.',
    heroCta: 'Explorar la colección',
    heroCtaSecondary: 'Para viveros',
    heroAlt: 'Monstera deliciosa en un interior luminoso',
    collectionEyebrow: 'La colección',
    collectionTitle: 'Plantas destacadas',
    collectionLead:
      'Una muestra del inventario de nuestros viveros aliados. Cada planta incluye su guía de cuidado completa.',
    viverosEyebrow: 'Para viveros',
    viverosTitle: 'Tu vivero, en línea — sin complicaciones.',
    viverosLead:
      'Plantera lleva compradores a tu vivero sin que tengas que administrar una tienda en línea. Cobramos una comisión simple y transparente por venta, y nos encargamos del resto:',
    viverosItems: [
      {
        num: '01',
        title: 'Fotografía profesional',
        copy: 'Cada planta fotografiada para que tu inventario luzca como merece.',
      },
      {
        num: '02',
        title: 'Entregas coordinadas',
        copy: 'Nosotros manejamos la logística con el comprador; tú te dedicas a cultivar.',
      },
      {
        num: '03',
        title: 'Nuevos clientes',
        copy: 'Compradores de toda la isla descubren tu vivero a través de Plantera.',
      },
    ],
    viverosCta: 'Ver el panel de demostración',
    viverosAlt: 'Follaje tropical en un vivero',
    contactEyebrow: 'Contacto',
    contactTitle: 'Hablemos',
    contactLead:
      '¿Eres comprador con preguntas, o un vivero interesado en unirse a Plantera? Escríbenos y te respondemos pronto.',
    contactWhatsapp: 'Escríbenos por WhatsApp',
    contactEmail: 'Envíanos un correo',
  },
  en: {
    whatsappMessage: 'Hi Plantera! I’d like more information.',
    heroEyebrow: 'Plant marketplace · Puerto Rico',
    heroTitle: 'Exceptional plants, from the island’s viveros.',
    heroLead:
      'Plantera connects buyers with the best local viveros — with professional photography, care guides, and coordinated delivery to your door.',
    heroCta: 'Explore the collection',
    heroCtaSecondary: 'For viveros',
    heroAlt: 'Monstera deliciosa in a bright interior',
    collectionEyebrow: 'The collection',
    collectionTitle: 'Featured plants',
    collectionLead:
      'A sample of our partner viveros’ inventory. Every plant includes its full care guide.',
    viverosEyebrow: 'For viveros',
    viverosTitle: 'Your vivero, online — without the hassle.',
    viverosLead:
      'Plantera brings buyers to your vivero without you having to run an online store. We charge a simple, transparent commission per sale, and we handle the rest:',
    viverosItems: [
      {
        num: '01',
        title: 'Professional photography',
        copy: 'Every plant photographed so your inventory looks the way it deserves.',
      },
      {
        num: '02',
        title: 'Coordinated deliveries',
        copy: 'We handle buyer logistics; you focus on growing.',
      },
      {
        num: '03',
        title: 'New customers',
        copy: 'Buyers across the island discover your vivero through Plantera.',
      },
    ],
    viverosCta: 'See the demo dashboard',
    viverosAlt: 'Tropical foliage in a greenhouse',
    contactEyebrow: 'Contact',
    contactTitle: 'Let’s talk',
    contactLead:
      'A buyer with questions, or a vivero interested in joining Plantera? Write to us and we’ll get back to you soon.',
    contactWhatsapp: 'Message us on WhatsApp',
    contactEmail: 'Send us an email',
  },
};

export default function HomePage() {
  const { lang } = useLang();
  const copy = COPY[lang];
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    copy.whatsappMessage,
  )}`;

  return (
    <div>
      <section id="inicio" className="section">
        <div
          className="container"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '3rem',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <span className="eyebrow">{copy.heroEyebrow}</span>
            <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 3.4rem)' }}>
              {copy.heroTitle}
            </h1>
            <p className="lead" style={{ maxWidth: '32rem' }}>
              {copy.heroLead}
            </p>
            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
              <a href="#coleccion" className="btn">
                {copy.heroCta}
              </a>
              <a href="#para-viveros" className="btn btn--ghost">
                {copy.heroCtaSecondary}
              </a>
            </div>
          </div>
          <div className="frame frame--45" style={{ maxHeight: '540px' }}>
            <img src={HERO_IMAGE} alt={copy.heroAlt} />
          </div>
        </div>
      </section>

      <section id="coleccion" className="section" style={{ paddingTop: '2rem' }}>
        <div className="container" style={{ display: 'grid', gap: '2.5rem' }}>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <span className="eyebrow">{copy.collectionEyebrow}</span>
            <h2 style={{ fontSize: '2.1rem' }}>{copy.collectionTitle}</h2>
            <p className="lead" style={{ maxWidth: '36rem' }}>
              {copy.collectionLead}
            </p>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
              gap: '2rem 1.5rem',
            }}
          >
            {plants.map((plant) => (
              <PlantCard key={plant.slug} plant={plant} />
            ))}
          </div>
        </div>
      </section>

      <section id="para-viveros" className="dark-section section">
        <div
          className="container"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '3rem',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <span className="eyebrow">{copy.viverosEyebrow}</span>
            <h2 style={{ fontSize: '2.2rem' }}>{copy.viverosTitle}</h2>
            <p className="lead">{copy.viverosLead}</p>
            <div style={{ display: 'grid' }}>
              {copy.viverosItems.map((item) => (
                <div
                  key={item.num}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '3rem 1fr',
                    gap: '1rem',
                    padding: '1.25rem 0',
                    borderTop: '1px solid rgba(243,239,230,0.15)',
                  }}
                >
                  <span
                    className="display"
                    style={{ color: 'var(--gold)', fontSize: '1.1rem' }}
                  >
                    {item.num}
                  </span>
                  <div style={{ display: 'grid', gap: '0.25rem' }}>
                    <h3 style={{ fontSize: '1.15rem' }}>{item.title}</h3>
                    <p className="lead" style={{ fontSize: '0.95rem' }}>
                      {item.copy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <a href="/pitch/dashboard" className="btn btn--cream">
                {copy.viverosCta}
              </a>
            </div>
          </div>
          <div className="frame frame--45" style={{ maxHeight: '560px' }}>
            <img src={VIVEROS_IMAGE} alt={copy.viverosAlt} />
          </div>
        </div>
      </section>

      <section id="contacto" className="section">
        <div
          className="container"
          style={{
            display: 'grid',
            gap: '1.25rem',
            justifyItems: 'center',
            textAlign: 'center',
            maxWidth: '640px',
          }}
        >
          <span className="eyebrow">{copy.contactEyebrow}</span>
          <h2 style={{ fontSize: '2.1rem' }}>{copy.contactTitle}</h2>
          <p className="lead">{copy.contactLead}</p>
          <div
            style={{
              display: 'flex',
              gap: '0.85rem',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
            >
              {copy.contactWhatsapp}
            </a>
            <a href="mailto:hola@plantera.pr" className="btn btn--ghost">
              {copy.contactEmail}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
