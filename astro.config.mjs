import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://USER.github.io',
  base: '/ostov/',
  i18n: {
    locales: ['ru', 'en'],
    defaultLocale: 'ru',
    routing: { prefixDefaultLocale: false },
  },
});
