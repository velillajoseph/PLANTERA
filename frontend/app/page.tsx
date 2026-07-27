import PlantCard from './components/PlantCard';
import { plants } from './lib/plants';

// Número de demostración — reemplazar con el WhatsApp Business real de Plantera.
const WHATSAPP_NUMBER = '17875550123';
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  '¡Hola Plantera! Quiero más información.',
)}`;

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1545241047-6083a3684587?w=1000&q=80';
const VIVEROS_IMAGE =
  'https://images.unsplash.com/photo-1470058869958-2a77ade41c02?w=1000&q=80';

export default function HomePage() {
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
            <span className="eyebrow">
              Marketplace de plantas · Puerto Rico
            </span>
            <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 3.6rem)' }}>
              Plantas excepcionales, de los viveros de la isla.
            </h1>
            <p className="lead" style={{ maxWidth: '32rem' }}>
              Plantera conecta a compradores con los mejores viveros locales —
              con fotografía profesional, guías de cuidado y entrega coordinada
              hasta tu puerta.
            </p>
            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
              <a href="#coleccion" className="btn">
                Explorar la colección
              </a>
              <a href="#para-viveros" className="btn btn--ghost">
                Para viveros
              </a>
            </div>
          </div>
          <div className="frame frame--45" style={{ maxHeight: '540px' }}>
            <img
              src={HERO_IMAGE}
              alt="Monstera deliciosa en un interior luminoso"
            />
          </div>
        </div>
      </section>

      <section id="coleccion" className="section" style={{ paddingTop: '2rem' }}>
        <div className="container" style={{ display: 'grid', gap: '2.5rem' }}>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <span className="eyebrow">La colección</span>
            <h2 style={{ fontSize: '2.1rem' }}>Plantas destacadas</h2>
            <p className="lead" style={{ maxWidth: '36rem' }}>
              Una muestra del inventario de nuestros viveros aliados. Cada
              planta incluye su guía de cuidado completa.
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
            <span className="eyebrow">Para viveros</span>
            <h2 style={{ fontSize: '2.3rem' }}>
              Tu vivero, en línea — sin complicaciones.
            </h2>
            <p className="lead">
              Plantera lleva compradores a tu vivero sin que tengas que
              administrar una tienda en línea. Cobramos una comisión simple y
              transparente por venta, y nos encargamos del resto:
            </p>
            <div style={{ display: 'grid' }}>
              {[
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
              ].map((item) => (
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
                    className="serif"
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
              <a href="/dashboard" className="btn btn--cream">
                Ver el panel de demostración
              </a>
            </div>
          </div>
          <div className="frame frame--45" style={{ maxHeight: '560px' }}>
            <img
              src={VIVEROS_IMAGE}
              alt="Follaje tropical en un vivero"
            />
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
          <span className="eyebrow">Contacto</span>
          <h2 style={{ fontSize: '2.1rem' }}>Hablemos</h2>
          <p className="lead">
            ¿Eres comprador con preguntas, o un vivero interesado en unirse a
            Plantera? Escríbenos y te respondemos pronto.
          </p>
          <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
            >
              Escríbenos por WhatsApp
            </a>
            <a href="mailto:hola@plantera.pr" className="btn btn--ghost">
              Envíanos un correo
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
