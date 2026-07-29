'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useLang } from '../../lib/i18n';

const POSTS = [
  {
    image: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800&q=80',
    category: { es: 'Propagación', en: 'Propagation' },
    title: {
      es: 'Cómo propagar tu Monstera en agua, paso a paso',
      en: 'How to propagate your Monstera in water, step by step',
    },
    excerpt: {
      es: 'Un nodo, un frasco y paciencia: la forma más simple de multiplicar la planta que ya amas.',
      en: 'One node, a jar, and patience: the simplest way to multiply the plant you already love.',
    },
    readTime: { es: '5 min de lectura', en: '5 min read' },
  },
  {
    image: 'https://images.unsplash.com/photo-1470058869958-2a77ade41c02?w=800&q=80',
    category: { es: 'Viveros', en: 'Viveros' },
    title: {
      es: 'Un día en Vivero Verde Valle, Caguas',
      en: 'A day at Vivero Verde Valle, Caguas',
    },
    excerpt: {
      es: 'Tres generaciones cultivando tropicales en la montaña. Fuimos a conocerlos.',
      en: 'Three generations growing tropicals in the mountains. We went to meet them.',
    },
    readTime: { es: '8 min de lectura', en: '8 min read' },
  },
  {
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80',
    category: { es: 'Temporada', en: 'Seasonal' },
    title: {
      es: 'Tu plan de riego para la temporada de lluvia',
      en: 'Your watering plan for the rainy season',
    },
    excerpt: {
      es: 'Cuando llueve todos los días, casi todo lo que sabías sobre riego cambia.',
      en: 'When it rains daily, almost everything you knew about watering changes.',
    },
    readTime: { es: '4 min de lectura', en: '4 min read' },
  },
  {
    image: 'https://images.unsplash.com/photo-1615671524827-c1fe3973b648?w=800&q=80',
    category: { es: 'Principiantes', en: 'Beginners' },
    title: {
      es: 'Cinco plantas que sobreviven un apartamento sin balcón',
      en: 'Five plants that survive an apartment with no balcony',
    },
    excerpt: {
      es: 'Poca luz no significa que no puedas tener plantas. Significa elegir bien.',
      en: 'Low light does not mean no plants. It means choosing well.',
    },
    readTime: { es: '6 min de lectura', en: '6 min read' },
  },
];

const COPY = {
  es: {
    eyebrow: 'Comunidad',
    title: 'Historias, guías y la gente que cultiva la isla.',
    lead: 'Un espacio para aprender de otros jardineros puertorriqueños, conocer los viveros por dentro y compartir lo que te está funcionando.',
    soonBadge: 'Próximamente',
    soonTitle: 'Estamos preparando la comunidad',
    soonCopy:
      'Pronto podrás comentar, publicar fotos de tus plantas y hacerle preguntas directamente a los viveros. Mientras tanto, así se verá.',
    previewLabel: 'Vista previa',
    read: 'Leer',
    newsletterTitle: 'Sé la primera persona en entrar',
    newsletterCopy:
      'Déjanos tu correo y te avisamos cuando la comunidad abra sus puertas.',
    emailLabel: 'Tu correo',
    emailPlaceholder: 'tu@correo.com',
    submit: 'Avísame',
    thanks: '¡Gracias! Te escribiremos pronto.',
    careCta: 'Mientras tanto, lee nuestras guías de cuidado →',
  },
  en: {
    eyebrow: 'Community',
    title: 'Stories, guides, and the people growing the island.',
    lead: 'A place to learn from other Puerto Rican gardeners, see inside the viveros, and share what is working for you.',
    soonBadge: 'Coming soon',
    soonTitle: 'We are building the community',
    soonCopy:
      'Soon you will be able to comment, post photos of your plants, and ask growers questions directly. In the meantime, here is how it will look.',
    previewLabel: 'Preview',
    read: 'Read',
    newsletterTitle: 'Be the first one in',
    newsletterCopy: 'Leave your email and we will tell you when the community opens.',
    emailLabel: 'Your email',
    emailPlaceholder: 'you@email.com',
    submit: 'Notify me',
    thanks: 'Thank you! We will be in touch soon.',
    careCta: 'In the meantime, read our care guides →',
  },
};

export default function CommunityPage() {
  const { lang } = useLang();
  const copy = COPY[lang];
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    // Placeholder until the community backend exists.
    setSent(true);
    setEmail('');
  };

  return (
    <div>
      <section className="section" style={{ paddingBottom: '1.5rem' }}>
        <div className="container" style={{ display: 'grid', gap: '1.25rem', maxWidth: '46rem' }}>
          <span className="eyebrow">{copy.eyebrow}</span>
          <h1 className="page-title">{copy.title}</h1>
          <p className="lead" style={{ fontSize: '1.05rem' }}>
            {copy.lead}
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div
            className="card"
            style={{
              display: 'grid',
              gap: '0.6rem',
              justifyItems: 'center',
              textAlign: 'center',
              background: 'var(--cream)',
            }}
          >
            <span className="pill">{copy.soonBadge}</span>
            <h2 style={{ fontSize: '1.4rem' }}>{copy.soonTitle}</h2>
            <p className="lead" style={{ fontSize: '0.95rem', maxWidth: '34rem' }}>
              {copy.soonCopy}
            </p>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="container" style={{ display: 'grid', gap: '1.5rem' }}>
          <span className="eyebrow eyebrow--sage">{copy.previewLabel}</span>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
              gap: '2rem 1.5rem',
            }}
          >
            {POSTS.map((post, index) => (
              <article
                key={post.title.en}
                className="stagger-in"
                style={{ display: 'grid', gap: '0.7rem', '--i': index } as React.CSSProperties}
              >
                <div className="frame frame--32">
                  <img src={post.image} alt="" loading="lazy" />
                </div>
                <span className="product-card__vivero">{post.category[lang]}</span>
                <h3 style={{ fontSize: '1.12rem', lineHeight: 1.35 }}>{post.title[lang]}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.6 }}>
                  {post.excerpt[lang]}
                </p>
                <span style={{ fontSize: '0.8rem', color: 'var(--sage)' }}>
                  {post.readTime[lang]}
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="dark-section section">
        <div
          className="container"
          style={{
            display: 'grid',
            gap: '1.25rem',
            justifyItems: 'center',
            textAlign: 'center',
            maxWidth: '36rem',
          }}
        >
          <h2 className="section-title">{copy.newsletterTitle}</h2>
          <p className="lead">{copy.newsletterCopy}</p>
          {sent ? (
            <p style={{ color: 'var(--sage)', fontWeight: 600 }} role="status">
              {copy.thanks}
            </p>
          ) : (
            <form
              onSubmit={submit}
              style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center' }}
            >
              <input
                className="input"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-label={copy.emailLabel}
                placeholder={copy.emailPlaceholder}
                style={{ width: 'min(280px, 70vw)' }}
              />
              <button type="submit" className="btn btn--cream">
                {copy.submit}
              </button>
            </form>
          )}
          <Link href="/care" style={{ fontSize: '0.9rem', color: 'var(--sage)', fontWeight: 600 }}>
            {copy.careCta}
          </Link>
        </div>
      </section>
    </div>
  );
}
