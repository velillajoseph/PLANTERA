'use client';

import { useEffect, useState } from 'react';

/**
 * Matches the 900px breakpoint used throughout `globals.css`.
 *
 * Starts false and only flips after mount, so the server and first client
 * render agree (no hydration mismatch); components must therefore treat the
 * desktop layout as the default.
 */
export function useIsMobile(query = '(max-width: 900px)') {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);

  return isMobile;
}
