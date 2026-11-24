/**
 * First-screen photo, art-directed (brief.md §6, «Изображения»):
 * - phones (≤767 px): a 3:5 portrait crop, so a ~390×780 hero does not pull a
 *   landscape file three times wider than the screen;
 * - wider screens: the full 3:2 frame.
 * Built with astro:assets getImage (not <Picture>) because <Picture> has no
 * per-media sources and does not expose the URLs needed for <link rel="preload">.
 */
import { getImage } from 'astro:assets';
import hero from '../assets/img/hero.jpg';

export const HERO_MOBILE_MEDIA = '(max-width: 767px)';
// `sizes`: the photo is object-fit: cover in a hero ≈ one screen tall. On screens narrower
// than the frame (wide: below 3:2, e.g. a 1024×768 tablet) it renders wider than 100vw.
// Phones keep 100vw to stay inside the 200 KB budget; the 3:5 crop is close to their shape.
const MOBILE = { width: 960, height: 1600, widths: [480, 640, 800, 960], sizes: '100vw' };
const WIDE = { width: 2400, height: 1600, widths: [1024, 1280, 1600, 1920, 2400], sizes: '(max-aspect-ratio: 3/2) 150vh, 100vw' };
const FORMATS = ['avif', 'webp', 'jpeg'] as const;
const QUALITY = { avif: 55, webp: 70, jpeg: 72 } as const;

type Format = (typeof FORMATS)[number];
type Variant = typeof MOBILE;

export interface HeroSource {
  media: string | undefined;
  type: `image/${Format}`;
  srcset: string;
  sizes: string;
  width: number;
  height: number;
}

function variant(v: Variant, format: Format) {
  return getImage({
    src: hero,
    format,
    width: v.width,
    height: v.height,
    widths: v.widths,
    fit: 'cover',
    position: 'center',
    quality: QUALITY[format],
  });
}

export async function getHeroImage() {
  const sources: HeroSource[] = [];
  const plan: Array<[Variant, string | undefined]> = [
    [MOBILE, HERO_MOBILE_MEDIA],
    [WIDE, undefined],
  ];
  for (const [v, media] of plan) {
    for (const format of FORMATS) {
      // The wide JPEG is the <img> fallback itself, not a <source>.
      if (!media && format === 'jpeg') continue;
      const img = await variant(v, format);
      sources.push({ media, type: `image/${format}`, srcset: img.srcSet.attribute, sizes: v.sizes, width: v.width, height: v.height });
    }
  }
  const fallback = await variant(WIDE, 'jpeg');
  const mobileAvif = sources[0]!;
  return {
    sources,
    img: { src: fallback.src, srcset: fallback.srcSet.attribute, sizes: WIDE.sizes, width: WIDE.width, height: WIDE.height },
    preload: { srcset: mobileAvif.srcset, sizes: mobileAvif.sizes, type: mobileAvif.type, media: HERO_MOBILE_MEDIA },
  };
}
