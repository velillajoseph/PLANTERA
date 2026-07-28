'use client';

import Link from 'next/link';
import { useCart } from '../../lib/cart';
import { useLang } from '../../lib/i18n';
import { formatMoney } from '../../lib/format';
import { resolveImageUrl } from '../../lib/catalog';

const COPY = {
  es: {
    title: 'Tu carrito',
    empty: 'Tu carrito está vacío.',
    emptyCopy: 'Cuando encuentres una planta que te guste, la verás aquí.',
    emptyCta: 'Explorar la tienda',
    product: 'Producto',
    price: 'Precio',
    quantity: 'Cantidad',
    total: 'Total',
    remove: 'Quitar',
    clear: 'Vaciar carrito',
    summary: 'Resumen',
    subtotal: 'Subtotal',
    shipping: 'Entrega',
    shippingNote: 'Se coordina contigo',
    estimatedTotal: 'Total estimado',
    checkout: 'Finalizar compra',
    checkoutNote:
      'El pago en línea llega pronto. Mientras tanto, escríbenos y coordinamos tu pedido por WhatsApp.',
    contactCta: 'Coordinar por WhatsApp',
    keepShopping: 'Seguir comprando',
    soldBy: 'Vendido por',
  },
  en: {
    title: 'Your cart',
    empty: 'Your cart is empty.',
    emptyCopy: 'When you find a plant you love, it will show up here.',
    emptyCta: 'Explore the shop',
    product: 'Product',
    price: 'Price',
    quantity: 'Quantity',
    total: 'Total',
    remove: 'Remove',
    clear: 'Empty cart',
    summary: 'Summary',
    subtotal: 'Subtotal',
    shipping: 'Delivery',
    shippingNote: 'Coordinated with you',
    estimatedTotal: 'Estimated total',
    checkout: 'Checkout',
    checkoutNote:
      'Online payment is coming soon. In the meantime, message us and we will coordinate your order on WhatsApp.',
    contactCta: 'Coordinate on WhatsApp',
    keepShopping: 'Keep shopping',
    soldBy: 'Sold by',
  },
};

const WHATSAPP_NUMBER = '17875550123';

export default function CartPage() {
  const { lang } = useLang();
  const copy = COPY[lang];
  const { lines, subtotal, setQty, remove, clear } = useCart();

  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    lang === 'es'
      ? `¡Hola Plantera! Quiero coordinar este pedido:\n${lines
          .map((line) => `· ${line.qty} × ${line.name}`)
          .join('\n')}`
      : `Hi Plantera! I'd like to coordinate this order:\n${lines
          .map((line) => `· ${line.qty} × ${line.name}`)
          .join('\n')}`,
  )}`;

  if (lines.length === 0) {
    return (
      <div
        className="container section"
        style={{ display: 'grid', gap: '1rem', justifyItems: 'center', textAlign: 'center' }}
      >
        <h1 style={{ fontSize: '1.9rem' }}>{copy.empty}</h1>
        <p className="lead">{copy.emptyCopy}</p>
        <Link href="/shop" className="btn">
          {copy.emptyCta}
        </Link>
      </div>
    );
  }

  return (
    <div className="container section" style={{ display: 'grid', gap: '2rem' }}>
      <h1 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.6rem)' }}>{copy.title}</h1>

      <div
        className="cart-layout"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 2fr) minmax(260px, 1fr)',
          gap: '2rem',
          alignItems: 'start',
        }}
      >
        <div className="card" style={{ display: 'grid', gap: '1.25rem' }}>
          {lines.map((line) => (
            <div
              key={line.id}
              style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
                paddingBottom: '1.25rem',
                borderBottom: '1px solid var(--line)',
              }}
            >
              <Link href={`/plant/${line.id}`} className="thumb" style={{ width: 84, height: 84 }}>
                {line.image ? (
                  <img src={resolveImageUrl(line.image) ?? undefined} alt="" />
                ) : (
                  line.name.charAt(0).toUpperCase()
                )}
              </Link>

              <div style={{ flex: 1, display: 'grid', gap: '0.35rem' }}>
                <Link href={`/plant/${line.id}`} style={{ fontWeight: 600 }}>
                  {line.name}
                </Link>
                <span style={{ fontSize: '0.8rem', color: 'var(--sage)' }}>
                  {copy.soldBy} {line.vivero}
                </span>
                <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                  {formatMoney(line.price)}
                </span>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.3rem' }}>
                  <label className="field" style={{ width: 92 }}>
                    <span className="sr-only" style={{ position: 'absolute', left: -9999 }}>
                      {copy.quantity}
                    </span>
                    <input
                      className="input"
                      type="number"
                      min={1}
                      max={line.stock}
                      value={line.qty}
                      aria-label={`${copy.quantity} — ${line.name}`}
                      onChange={(event) => setQty(line.id, Number(event.target.value))}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => remove(line.id)}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: 'var(--muted)',
                      fontSize: '0.85rem',
                      textDecoration: 'underline',
                      textUnderlineOffset: '3px',
                    }}
                  >
                    {copy.remove}
                  </button>
                </div>
              </div>

              <span className="display" style={{ fontSize: '1.15rem', whiteSpace: 'nowrap' }}>
                {formatMoney(line.price * line.qty)}
              </span>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <Link href="/shop" className="btn btn--ghost btn--small">
              {copy.keepShopping}
            </Link>
            <button type="button" onClick={clear} className="btn btn--danger btn--small">
              {copy.clear}
            </button>
          </div>
        </div>

        <div className="card cart-summary" style={{ display: 'grid', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem' }}>{copy.summary}</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted)' }}>{copy.subtotal}</span>
            <span style={{ fontWeight: 600 }}>{formatMoney(subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted)' }}>{copy.shipping}</span>
            <span style={{ fontSize: '0.88rem', color: 'var(--sage)' }}>
              {copy.shippingNote}
            </span>
          </div>
          <hr className="hairline" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontWeight: 600 }}>{copy.estimatedTotal}</span>
            <span className="display" style={{ fontSize: '1.5rem' }}>
              {formatMoney(subtotal)}
            </span>
          </div>
          <button type="button" className="btn" style={{ justifyContent: 'center' }} disabled>
            {copy.checkout}
          </button>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.55 }}>
            {copy.checkoutNote}
          </p>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--ghost btn--small"
            style={{ justifyContent: 'center' }}
          >
            {copy.contactCta}
          </a>
        </div>
      </div>
    </div>
  );
}
