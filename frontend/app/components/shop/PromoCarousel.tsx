'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLang } from '../../lib/i18n';
import { useReducedMotion } from '../../lib/use-reduced-motion';
import {
  getPromotions,
  recordPromotionEvent,
  type Promotion,
} from '../../lib/promotions';

/**
 * Six seconds: long enough to read a headline, a line of body copy, and decide
 * about the CTA; short enough that a three-slide loop comes back around before
 * someone has scrolled past. Under ~5s the carousel feels twitchy, over ~8s a
 * paid vivero waits too long for its turn.
 */
const ADVANCE_MS = 6000;

/** Horizontal travel, in px, before a swipe counts as a swipe. */
const SWIPE_THRESHOLD = 48;

const COPY = {
  es: {
    featured: 'Destacado',
    goTo: (n: number) => `Ir al anuncio ${n}`,
  },
  en: {
    featured: 'Featured',
    goTo: (n: number) => `Go to slide ${n}`,
  },
};

/** Shown when no promotion is running, so the homepage never opens on nothing. */
export type PromoFallback = {
  eyebrow: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
};

type Slide = {
  key: string;
  promotionId: number | null;
  eyebrow: string;
  headline: string;
  body: string | null;
  ctaLabel: string;
  ctaHref: string;
  image: string | null;
};

export default function PromoCarousel({
  variant = 'band',
  fallback,
}: {
  /** `hero` leads the page: taller, and its headline is the page's h1. */
  variant?: 'hero' | 'band';
  fallback?: PromoFallback;
}) {
  const { lang } = useLang();
  const copy = COPY[lang];
  const reducedMotion = useReducedMotion();

  const [promos, setPromos] = useState<Promotion[]>([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const seen = useRef(new Set<number>());
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    getPromotions()
      .then((data) => {
        if (active) setPromos(data);
      })
      // A promo slot is decoration: if it fails, the page is unaffected and the
      // fallback slide keeps the layout intact.
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const slides: Slide[] = promos.length
    ? promos.map((promo) => ({
        key: `promo-${promo.id}`,
        promotionId: promo.id,
        eyebrow: `${copy.featured} · ${promo.store_name}`,
        headline: lang === 'es' ? promo.headline_es : promo.headline_en,
        body: lang === 'es' ? promo.body_es : promo.body_en,
        ctaLabel: lang === 'es' ? promo.cta_label_es : promo.cta_label_en,
        ctaHref: promo.cta_href,
        image: promo.image_url,
      }))
    : fallback
      ? [{ key: 'fallback', promotionId: null, ...fallback, body: fallback.body }]
      : [];

  const count = slides.length;
  const current = Math.min(index, Math.max(count - 1, 0));
  const active = slides[current];

  // One impression per promotion per page view, not per re-render.
  useEffect(() => {
    if (!active?.promotionId || seen.current.has(active.promotionId)) return;
    seen.current.add(active.promotionId);
    recordPromotionEvent(active.promotionId, 'impression');
  }, [active]);

  const advance = useCallback(
    (delta: number) => {
      setIndex((value) => (count ? (value + delta + count) % count : 0));
    },
    [count],
  );

  useEffect(() => {
    // Someone who asked for less motion gets a slot they page through by hand,
    // not a slower carousel.
    if (reducedMotion || paused || count < 2) return;
    const timer = window.setInterval(() => advance(1), ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [reducedMotion, paused, count, advance]);

  if (!active) return null;

  // Only the visible slide gets the real heading tag. All slides stay
  // mounted for the cross-fade, so tagging each one would put three h1s
  // on the page.
  const HeadingTag = variant === 'hero' ? 'h1' : 'h2';

  return (
    <section
      className={`promo-wrap${variant === 'hero' ? ' promo-wrap--hero' : ''}`}
      aria-roledescription="carousel"
      aria-label={copy.featured}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0].clientX;
      }}
      onTouchEnd={(event) => {
        const start = touchStartX.current;
        touchStartX.current = null;
        if (start === null) return;
        const delta = event.changedTouches[0].clientX - start;
        if (Math.abs(delta) > SWIPE_THRESHOLD) advance(delta < 0 ? 1 : -1);
      }}
    >
      <div className="container">
        <div className="promo">
          {/* Every slide stays mounted and cross-fades. Swapping a single node
              would restart image decoding on each turn and flash. */}
          {slides.map((slide, position) => {
            const isActive = position === current;
            const side = position < current ? 'left' : 'right';
            return (
              <div
                key={slide.key}
                className={`promo__slide promo__slide--${side}${
                  isActive ? ' promo__slide--active' : ''
                }`}
                aria-hidden={!isActive}
              >
                {slide.image && (
                  <div className="promo__media">
                    <img
                      src={slide.image}
                      alt=""
                      loading={position === 0 ? 'eager' : 'lazy'}
                    />
                  </div>
                )}

                <div className="promo__body">
                  <span className="eyebrow eyebrow--sage">{slide.eyebrow}</span>
                  {isActive ? (
                    <HeadingTag className="promo__headline display">
                      {slide.headline}
                    </HeadingTag>
                  ) : (
                    <p className="promo__headline display" aria-hidden>
                      {slide.headline}
                    </p>
                  )}
                  {slide.body && <p className="promo__copy">{slide.body}</p>}
                  <Link
                    href={slide.ctaHref}
                    className="btn"
                    style={{ width: 'fit-content' }}
                    // Off-screen slides stay mounted for the cross-fade, so keep
                    // them out of the tab order until they're the visible one.
                    tabIndex={isActive ? 0 : -1}
                    onClick={() =>
                      slide.promotionId &&
                      recordPromotionEvent(slide.promotionId, 'click')
                    }
                  >
                    {slide.ctaLabel}
                  </Link>
                </div>
              </div>
            );
          })}

          {count > 1 && (
            <div className="promo__dots">
              {slides.map((slide, position) => (
                <button
                  key={slide.key}
                  type="button"
                  className={`promo__dot${position === current ? ' promo__dot--active' : ''}`}
                  aria-label={copy.goTo(position + 1)}
                  aria-current={position === current}
                  onClick={() => setIndex(position)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Announced separately so a screen reader hears slide changes without
          the visually-hidden text competing with the slide markup. */}
      <span className="visually-hidden" aria-live="polite">
        {active.headline}
      </span>
    </section>
  );
}
