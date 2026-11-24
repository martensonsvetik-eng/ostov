import type { APIRoute } from 'astro';

// Concept project: keep crawlers out. The Sitemap line is built from the configured
// site + base, so no placeholder host is hardcoded.
export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL('http://localhost');
  const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  const sitemap = new URL(`${base}sitemap-index.xml`, origin).href;
  const body = ['# Concept project, not for indexing.', 'User-agent: *', 'Disallow: /', '', `Sitemap: ${sitemap}`, ''].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
