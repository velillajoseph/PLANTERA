'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { CartIcon } from './Icons';
import { useCart } from '../../lib/cart';
import { useLang } from '../../lib/i18n';
import { formatMoney } from '../../lib/format';
import { useDropdown } from '../../lib/use-dropdown';
import { useIsMobile } from '../../lib/use-is-mobile';
import { resolveImageUrl } from '../../lib/catalog';

const COPY = {
  es: {
    open: 'Abrir carrito',
    title: 'Tu carrito',
    empty: 'Tu carrito está vacío.',
    emptyCta: 'Explorar plantas',
    subtotal: 'Subtotal',
    shippingNote: 'Envío y coordinación se calculan al finalizar.',
    checkout: 'Finalizar compra',
    viewCart: 'Ver carrito',
    remove: 'Quitar',
    decrease: 'Restar uno',
    increase: 'Sumar uno',
    soon: 'Próximamente',
    close: 'Cerrar carrito',
  },
  en: {
    open: 'Open cart',
    title: 'Your cart',
    empty: 'Your cart is empty.',
    emptyCta: 'Browse plants',
    subtotal: 'Subtotal',
    shippingNote: 'Shipping and coordination are calculated at checkout.',
    checkout: 'Checkout',
    viewCart: 'View cart',
    remove: 'Remove',
    decrease: 'Decrease quantity',
    increase: 'Increase quantity',
    soon: 'Coming soon',
    close: 'Close cart',
  },
};

export default function CartMenu() {
  const { lang } = useLang();
  const copy = COPY[lang];
  const { lines, count, subtotal, lastAddedAt, setQty, remove } = useCart();
  const { open, closeNow, setOpen, containerRef, panelRef, hoverProps } =
    useDropdown();
  const [pop, setPop] = useState(false);
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- portals may only render after mount
    setMounted(true);
  }, []);

  // Pop the badge whenever something lands in the cart.
  useEffect(() => {
    if (!lastAddedAt) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- drives a one-shot badge animation off the cart's add signal
    setPop(true);
    const timer = setTimeout(() => setPop(false), 420);
    return () => clearTimeout(timer);
  }, [lastAddedAt]);

  const overlay = (
    <>
      {/* Mobile-only scrim; the panel below becomes a right drawer via CSS. */}
      <div
        className={`cart-scrim${open ? ' cart-scrim--open' : ''}`}
        onClick={closeNow}
        aria-hidden
      />
  
      <div
        ref={panelRef}
        className={`panel cart-panel${open ? ' panel--open cart-panel--open' : ''}`}
        style={{ top: 'calc(100% + 12px)', right: 0, width: 'min(360px, 90vw)', padding: '1.25rem' }}
      >
        <div className="cart-panel__head">
          <p className="panel__heading" style={{ marginBottom: 0 }}>
            {copy.title}
          </p>
          <button
            type="button"
            className="icon-button cart-panel__close"
            aria-label={copy.close}
            onClick={closeNow}
            style={{ fontSize: '1.4rem', lineHeight: 1 }}
          >
            ×
          </button>
        </div>
  
        {lines.length === 0 ? (
          <div style={{ display: 'grid', gap: '0.9rem' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.92rem' }}>
              {copy.empty}
            </p>
            <Link href="/shop" className="btn btn--small" onClick={closeNow}>
              {copy.emptyCta}
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem', flex: 1, alignContent: 'start' }}>
            <div
              data-cart-list
              style={{
                display: 'grid',
                gap: '0.9rem',
                maxHeight: '46vh',
                overflowY: 'auto',
              }}
            >
              {lines.map((line) => (
                <div
                  key={line.id}
                  style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}
                >
                  <span className="thumb" style={{ width: 56, height: 56 }}>
                    {line.image ? (
                      <img src={resolveImageUrl(line.image) ?? undefined} alt="" />
                    ) : (
                      line.name.charAt(0).toUpperCase()
                    )}
                  </span>
                  <div style={{ flex: 1, display: 'grid', gap: '0.3rem' }}>
                    <Link
                      href={`/plant/${line.id}`}
                      onClick={closeNow}
                      style={{ fontSize: '0.92rem', fontWeight: 600, lineHeight: 1.3 }}
                    >
                      {line.name}
                    </Link>
                    <span style={{ fontSize: '0.75rem', color: 'var(--sage)' }}>
                      {line.vivero}
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          border: '1px solid var(--line)',
                          borderRadius: '999px',
                        }}
                      >
                        <button
                          type="button"
                          aria-label={copy.decrease}
                          onClick={() => setQty(line.id, line.qty - 1)}
                          style={qtyButtonStyle}
                        >
                          −
                        </button>
                        <span style={{ fontSize: '0.85rem', minWidth: 20, textAlign: 'center' }}>
                          {line.qty}
                        </span>
                        <button
                          type="button"
                          aria-label={copy.increase}
                          disabled={line.qty >= line.stock}
                          onClick={() => setQty(line.id, line.qty + 1)}
                          style={{
                            ...qtyButtonStyle,
                            opacity: line.qty >= line.stock ? 0.35 : 1,
                          }}
                        >
                          +
                        </button>
                      </span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                        {formatMoney(line.price * line.qty)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(line.id)}
                    aria-label={`${copy.remove} ${line.name}`}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: 'var(--muted)',
                      fontSize: '1rem',
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
  
            <hr className="hairline" />
  
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}
            >
              <span style={{ fontWeight: 600 }}>{copy.subtotal}</span>
              <span className="display" style={{ fontSize: '1.3rem' }}>
                {formatMoney(subtotal)}
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
              {copy.shippingNote}
            </p>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn--small"
                style={{ justifyContent: 'center' }}
                title={copy.soon}
              >
                {copy.checkout}
              </button>
              <Link
                href="/cart"
                onClick={closeNow}
                className="btn btn--ghost btn--small"
                style={{ justifyContent: 'center' }}
              >
                {copy.viewCart}
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative' }}
      {...hoverProps}
    >
      <button
        type="button"
        className="icon-button"
        aria-label={copy.open}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
      >
        <CartIcon />
        {count > 0 && (
          <span className={`cart-badge${pop ? ' cart-badge--pop' : ''}`}>
            {count}
          </span>
        )}
      </button>

      {isMobile && mounted
        ? createPortal(overlay, document.body)
        : overlay}
    </div>
  );
}

const qtyButtonStyle: React.CSSProperties = {
  border: 'none',
  background: 'none',
  width: 26,
  height: 26,
  fontSize: '0.95rem',
  color: 'var(--ink)',
  lineHeight: 1,
};
