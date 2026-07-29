import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The product route moved from /plant/[id] to /product/[id].
 *
 * `next build` will not catch a broken `<Link href>` — typedRoutes is off — and
 * there is no e2e harness, so a stale link would only surface as a 404 in
 * production. This scan is the guard, and it also stops the old path being
 * reintroduced later.
 */
const APP_DIR = join(__dirname, '..', 'app');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx|js|jsx)$/.test(entry) ? [full] : [];
  });
}

describe('product route', () => {
  it('has no links left pointing at the old /plant/ path', () => {
    const offenders = sourceFiles(APP_DIR).filter((file) =>
      readFileSync(file, 'utf8').includes('/plant/'),
    );
    expect(offenders).toEqual([]);
  });

  it('keeps a redirect so already-shared links still resolve', () => {
    const config = readFileSync(join(__dirname, '..', 'next.config.mjs'), 'utf8');
    expect(config).toContain("source: '/plant/:id'");
    expect(config).toContain("destination: '/product/:id'");
    expect(config).toContain('permanent: true');
  });

  it('serves the product page from the renamed directory', () => {
    const page = join(APP_DIR, '(shop)', 'product', '[id]', 'page.tsx');
    expect(readFileSync(page, 'utf8')).toContain('ProductDetailPage');
  });
});
