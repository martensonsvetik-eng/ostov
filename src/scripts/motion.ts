/**
 * Motion layer (brief.md §6, §9). Quiet by design: motion sets a rhythm, never a show.
 *
 * Reveal — CSS + IntersectionObserver, no library. Elements marked `data-reveal` that
 * start below the fold get `is-pending` (opacity 0, 20 px lower; global.css) and turn
 * `is-in` once, when they come into view. Anything already on screen at start-up is
 * never touched, so the first screen and the LCP image never wait for JS. Without JS
 * or with reduced motion nothing is hidden at all.
 *
 * Parallax — GSAP + ScrollTrigger, desktop only (≥ 1024 px, motion allowed). The
 * library is imported dynamically on the reader's first scroll, so it never weighs on
 * the first screen and is never requested on phones. Only `transform` is written.
 */

const PARALLAX_MEDIA = '(min-width: 1024px) and (prefers-reduced-motion: no-preference)';
/** Delay between siblings that come into view together; capped so a long row stays brisk. */
const STAGGER_MS = 90;
const STAGGER_MAX = 3;

export function initReveal(): void {
  const items = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
  if (!items.length) return;
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const io = new IntersectionObserver(
    (entries) => {
      const entering = entries.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement);
      entering.forEach((el, i) => {
        io.unobserve(el);
        el.style.setProperty('--reveal-delay', `${Math.min(i, STAGGER_MAX) * STAGGER_MS}ms`);
        el.classList.add('is-in');
      });
    },
    // Start a little before the bottom edge so the rise ends where the eye is.
    { rootMargin: '0px 0px -8% 0px' },
  );

  const vh = window.innerHeight;
  for (const el of items) {
    const r = el.getBoundingClientRect();
    if (r.top < vh && r.bottom > 0) continue; // on screen at start-up: shown as is
    el.classList.add('is-pending');
    io.observe(el);
  }
}

export async function initParallax(): Promise<void> {
  const hero = document.querySelector<HTMLElement>('.hero [data-parallax]');
  const scenes = [...document.querySelectorAll<HTMLElement>('#materials [data-parallax]')];
  if (!hero && !scenes.length) return;

  const mq = matchMedia(PARALLAX_MEDIA);
  let loaded = false;

  const load = async () => {
    if (loaded) return;
    loaded = true;
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
    gsap.registerPlugin(ScrollTrigger);

    // gsap.matchMedia builds the tweens while the query matches and reverts them (kills the
    // ScrollTriggers, removes the inline transforms) as soon as it stops matching.
    gsap.matchMedia().add(PARALLAX_MEDIA, () => {
      // scrub: a short catch-up instead of a hard lock to the wheel — reads as weight, not lag.
      const scrub = 0.6;
      if (hero) {
        // The photo drifts down at a fraction of the scroll speed. Its top edge stays above
        // the viewport the whole way and the section clips the bottom, so no gap ever shows.
        gsap.fromTo(
          hero,
          { yPercent: 0 },
          {
            yPercent: 8,
            ease: 'none',
            scrollTrigger: { trigger: hero.closest('section') ?? hero, start: 'top top', end: 'bottom top', scrub },
          },
        );
      }
      for (const img of scenes) {
        // The frame clips the photo; CSS pre-scales it (1.12) so ±4 % never shows an edge.
        gsap.fromTo(
          img,
          { yPercent: -4 },
          {
            yPercent: 4,
            ease: 'none',
            scrollTrigger: { trigger: img.parentElement ?? img, start: 'top bottom', end: 'bottom top', scrub },
          },
        );
      }
    });
  };

  // Lazy: the library is fetched on the first scroll, never for a reader who only sees the
  // first screen, and never at all on phones or with reduced motion.
  const onScroll = () => {
    window.removeEventListener('scroll', onScroll);
    void load();
  };
  const sync = () => {
    if (loaded) {
      mq.removeEventListener('change', sync); // from here on gsap.matchMedia follows the query
    } else if (!mq.matches) {
      window.removeEventListener('scroll', onScroll);
    } else if (window.scrollY > 0) {
      void load(); // already scrolled (reload mid-page, window widened): no reason to wait
    } else {
      window.addEventListener('scroll', onScroll, { passive: true });
    }
  };
  mq.addEventListener('change', sync);
  sync();
}
