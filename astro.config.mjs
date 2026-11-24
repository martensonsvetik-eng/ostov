import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://USER.github.io',
  base: '/ostov/',
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
