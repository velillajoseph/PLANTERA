'use client';

import { useEffect, useState } from 'react';

/**
 * The CSS `prefers-reduced-motion` block in globals.css covers every stylesheet
 * transition, but it cannot reach JS-driven motion — smooth scrolling, carousel
 * autoplay. Those need to ask directly.
 *
 * Starts false to match the server render, then corrects after mount.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the media query once mounted
    setReduced(query.matches);

    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
