import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Two hosts build the same site:
// - GitHub Pages serves it from a sub-folder (user.github.io/ostov/); CI sets SITE_URL from the
//   repository owner (.github/workflows/deploy.yml).
// - Vercel serves it from the domain root (ostov.vercel.app/). Vercel sets VERCEL=1 and the
//   production host in VERCEL_PROJECT_PRODUCTION_URL during its build.
// Local builds and tests keep the GitHub Pages layout (/ostov/).
const onVercel = process.env.VERCEL === '1';
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export default defineConfig({
  // Origin for hreflang, Open Graph and sitemap.xml. A custom domain later changes only SITE_URL (and base).
  site: process.env.SITE_URL || (onVercel && vercelHost ? `https://${vercelHost}` : 'https://USER.github.io'),
  base: onVercel ? '/' : '/ostov/',
  integrations: [sitemap({ filter: (page) => !/\/ui\/?$/.test(page) && !/\/404\/?$/.test(page) })],
  vite: {
    build: {
      rollupOptions: {
        output: {
          // GSAP gets its own lazily imported chunk (motion.ts): named so it is easy to spot
          // in the network panel and in the size report, and kept out of the first-screen bundle.
          manualChunks(id) {
            if (id.includes('node_modules/gsap')) return 'gsap';
          },
        },
      },
    },
  },
  i18n: {
    locales: ['ru', 'en'],
    defaultLocale: 'ru',
    routing: { prefixDefaultLocale: false },
  },
});
