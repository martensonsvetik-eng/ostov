/**
 * First screen, desktop only (brief.md §6, «Анимация»): «morning light». A soft warm radial
 * glow follows the pointer over the photo. Only with a mouse-like pointer and motion allowed
 * (`(hover: hover) and (pointer: fine)`, no reduced motion); elsewhere nothing is bound.
 *
 * - The glow sits under both scrim layers (Hero.astro), so it never lowers text contrast
 *   (tests/unit/hero-scrim.test.ts).
 * - The photo itself never moves with the pointer: only the glow overlay's `transform` and
 *   `opacity` are written (the <img> transform belongs to the GSAP scroll parallax, motion.ts).
 * - One rAF loop eases towards the target and stops as soon as it has settled; leaving the
 *   photo eases the glow out and clears its inline styles.
 */

const MEDIA = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';
/** Share of the remaining distance covered per 60 Hz frame. */
const EASE = 0.09;
const EPS = 0.002;

export function initHeroLight(): void {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const light = hero?.querySelector<HTMLElement>('[data-hero-light]');
  if (!hero || !light) return;

  const mq = matchMedia(MEDIA);
  // Pointer position in the hero, px; glow strength 0…1.
  const cur = { x: 0, y: 0, o: 0 };
  const tgt = { x: 0, y: 0, o: 0 };
  let raf = 0;
  let last = 0;

  const paint = () => {
    light.style.transform = `translate3d(${cur.x.toFixed(1)}px, ${cur.y.toFixed(1)}px, 0)`;
    light.style.opacity = cur.o.toFixed(3);
  };
  const clear = () => {
    light.style.transform = light.style.opacity = '';
  };

  const tick = (now: number) => {
    const k = 1 - Math.pow(1 - EASE, Math.min(now - (last || now - 16.7), 100) / 16.7);
    last = now;
    let moving = false;
    for (const key of ['x', 'y', 'o'] as const) {
      const d = tgt[key] - cur[key];
      // Position settles to a tenth of a pixel, strength to EPS.
      if (Math.abs(d) > (key === 'o' ? EPS : 0.1)) {
        cur[key] += d * k;
        moving = true;
      } else cur[key] = tgt[key];
    }
    if (moving) {
      paint();
      raf = requestAnimationFrame(tick);
    } else {
      raf = last = 0;
      if (cur.o === 0) clear();
      else paint();
    }
  };
  const run = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    const r = hero.getBoundingClientRect();
    tgt.x = Math.max(0, Math.min(r.width, e.clientX - r.left));
    tgt.y = Math.max(0, Math.min(r.height, e.clientY - r.top));
    tgt.o = 1;
    // Entering: start the glow under the pointer instead of sliding in from elsewhere.
    if (cur.o < EPS) {
      cur.x = tgt.x;
      cur.y = tgt.y;
    }
    run();
  };
  // Leaving: the glow stays where it was and fades out.
  const onLeave = () => {
    tgt.x = cur.x;
    tgt.y = cur.y;
    tgt.o = 0;
    run();
  };

  const bind = () => {
    if (mq.matches) {
      hero.addEventListener('pointermove', onMove, { passive: true });
      hero.addEventListener('pointerleave', onLeave);
    } else {
      hero.removeEventListener('pointermove', onMove);
      hero.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(raf);
      raf = last = 0;
      cur.o = tgt.o = 0;
      clear();
    }
  };
  mq.addEventListener('change', bind);
  bind();
}
