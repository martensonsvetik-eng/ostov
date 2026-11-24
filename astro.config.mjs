import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://USER.github.io',
  base: '/ostov/',
  integrations: [sitemap({ filter: (page) => !/\/ui\/?$/.test(page) && !/\/404\/?$/.test(page) })],
  i18n: {
    locales: ['ru', 'en'],
    defaultLocale: 'ru',
    routing: { prefixDefaultLocale: false },
  },
});
