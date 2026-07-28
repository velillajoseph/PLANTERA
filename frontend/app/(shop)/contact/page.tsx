'use client';

import { useState, type FormEvent } from 'react';
import { useLang } from '../../lib/i18n';

// Demo number — replace with Plantera's real WhatsApp Business line before launch.
const WHATSAPP_NUMBER = '17875550123';

const COPY = {
  es: {
    eyebrow: 'Contacto',
    title: 'Hablemos de plantas.',
    lead: '¿Preguntas sobre un pedido, una planta que no encuentras, o tienes un vivero? Estamos del otro lado.',
    whatsappTitle: 'WhatsApp',
    whatsappCopy: 'La forma más rápida. Respondemos de lunes a sábado.',
    whatsappCta: 'Escribir por WhatsApp',
    whatsappMessage: '¡Hola Plantera! Tengo una pregunta.',
    emailTitle: 'Correo',
    emailCopy: 'Para pedidos, facturas o temas de viveros.',
    viveroTitle: '¿Tienes un vivero?',
    viveroCopy:
      'Si cultivas y quieres vender en Plantera, cuéntanos de tu vivero y coordinamos una visita.',
    formTitle: 'Envíanos un mensaje',
    name: 'Nombre',
    email: 'Correo',
    subject: 'Asunto',
    subjects: {
      order: 'Mi pedido',
      plant: 'Una planta',
      vivero: 'Soy un vivero',
      other: 'Otro tema',
    },
    message: 'Mensaje',
    send: 'Enviar mensaje',
    sending: 'Enviando…',
    sent: '¡Gracias! Te responderemos pronto.',
    hoursTitle: 'Horario de respuesta',
    hours: 'Lunes a sábado, 9:00 am – 6:00 pm AST',
  },
  en: {
    eyebrow: 'Contact',
    title: 'Let’s talk plants.',
    lead: 'Questions about an order, a plant you cannot find, or you run a vivero? We are on the other side.',
    whatsappTitle: 'WhatsApp',
    whatsappCopy: 'The fastest way. We reply Monday through Saturday.',
    whatsappCta: 'Message on WhatsApp',
    whatsappMessage: 'Hi Plantera! I have a question.',
    emailTitle: 'Email',
    emailCopy: 'For orders, invoices, or vivero matters.',
    viveroTitle: 'Run a vivero?',
    viveroCopy:
      'If you grow and want to sell on Plantera, tell us about your nursery and we will arrange a visit.',
    formTitle: 'Send us a message',
    name: 'Name',
    email: 'Email',
    subject: 'Subject',
    subjects: {
      order: 'My order',
      plant: 'A plant',
      vivero: 'I run a vivero',
      other: 'Something else',
    },
    message: 'Message',
    send: 'Send message',
    sending: 'Sending…',
    sent: 'Thank you! We will get back to you soon.',
    hoursTitle: 'Response hours',
    hours: 'Monday to Saturday, 9:00 am – 6:00 pm AST',
  },
};

export default function ContactPage() {
  const { lang } = useLang();
  const copy = COPY[lang];
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: 'order',
    message: '',
  });

  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    copy.whatsappMessage,
  )}`;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    // Presentation only for now — wiring to the backend comes with accounts.
    setSent(true);
    setForm({ name: '', email: '', subject: 'order', message: '' });
  };

  return (
    <div className="container section" style={{ display: 'grid', gap: '2.5rem' }}>
      <div style={{ display: 'grid', gap: '1rem', maxWidth: '42rem' }}>
        <span className="eyebrow">{copy.eyebrow}</span>
        <h1 style={{ fontSize: 'clamp(2rem, 4.5vw, 2.9rem)' }}>{copy.title}</h1>
        <p className="lead" style={{ fontSize: '1.05rem' }}>
          {copy.lead}
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: '2rem',
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <div className="card" style={{ display: 'grid', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.15rem' }}>{copy.whatsappTitle}</h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--muted)', lineHeight: 1.6 }}>
              {copy.whatsappCopy}
            </p>
            <div>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--small"
              >
                {copy.whatsappCta}
              </a>
            </div>
          </div>

          <div className="card" style={{ display: 'grid', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.15rem' }}>{copy.emailTitle}</h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--muted)', lineHeight: 1.6 }}>
              {copy.emailCopy}
            </p>
            <a
              href="mailto:hola@plantera.pr"
              style={{ fontWeight: 600, color: 'var(--green-700)' }}
            >
              hola@plantera.pr
            </a>
          </div>

          <div
            className="card"
            style={{ display: 'grid', gap: '0.6rem', background: 'var(--cream)' }}
          >
            <h2 style={{ fontSize: '1.15rem' }}>{copy.viveroTitle}</h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--muted)', lineHeight: 1.6 }}>
              {copy.viveroCopy}
            </p>
          </div>

          <div style={{ display: 'grid', gap: '0.3rem' }}>
            <span className="panel__heading">{copy.hoursTitle}</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>{copy.hours}</span>
          </div>
        </div>

        <form onSubmit={submit} className="card" style={{ display: 'grid', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem' }}>{copy.formTitle}</h2>

          <label className="field">
            {copy.name}
            <input
              className="input"
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </label>

          <label className="field">
            {copy.email}
            <input
              className="input"
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </label>

          <label className="field">
            {copy.subject}
            <select
              className="input"
              value={form.subject}
              onChange={(event) => setForm({ ...form, subject: event.target.value })}
            >
              {Object.entries(copy.subjects).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            {copy.message}
            <textarea
              className="input"
              rows={5}
              required
              value={form.message}
              onChange={(event) => setForm({ ...form, message: event.target.value })}
              style={{ resize: 'vertical' }}
            />
          </label>

          {sent && (
            <p role="status" style={{ color: 'var(--green-700)', fontWeight: 600 }}>
              {copy.sent}
            </p>
          )}

          <div>
            <button type="submit" className="btn btn--small">
              {copy.send}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
