/**
 * Collections «Подробнее»: disclosure buttons (aria-expanded / aria-controls) that show
 * the details panel in place. From 768 px the panels share the full-width row under the
 * cards, so opening one closes the others there; on phones each panel sits right under
 * its own card and they open independently (closing one above would shift the page).
 */
const WIDE = '(min-width: 768px)';

export function initCollections(root: HTMLElement): void {
  const toggles = [...root.querySelectorAll<HTMLButtonElement>('[data-collection-toggle]')];
  const wide = window.matchMedia(WIDE);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  const panelOf = (btn: HTMLButtonElement) => document.getElementById(btn.getAttribute('aria-controls') ?? '');
  const isOpen = (btn: HTMLButtonElement) => btn.getAttribute('aria-expanded') === 'true';

  function setOpen(btn: HTMLButtonElement, open: boolean): void {
    const panel = panelOf(btn);
    if (!panel) return;
    btn.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
    const label = btn.querySelector('.btn__label');
    const text = open ? btn.dataset.labelLess : btn.dataset.labelMore;
    if (label && text) label.textContent = text;
    const badge = btn.closest('[data-collection]')?.querySelector('[data-collection-badge]');
    if (badge && text) badge.textContent = text;
  }

  /** If the opened panel starts low on the screen, bring its top into view. */
  function reveal(panel: HTMLElement): void {
    const top = panel.getBoundingClientRect().top;
    if (top > window.innerHeight * 0.8) {
      window.scrollBy({ top: top - window.innerHeight * 0.35, behavior: reduce.matches ? 'auto' : 'smooth' });
    }
  }

  toggles.forEach((btn) => {
    btn.addEventListener('click', () => {
      const open = !isOpen(btn);
      if (open && wide.matches) toggles.forEach((other) => other !== btn && setOpen(other, false));
      setOpen(btn, open);
      const panel = panelOf(btn);
      if (open && panel) reveal(panel);
    });
  });

  // Phone → wide with several panels open: keep only the last one.
  wide.addEventListener('change', () => {
    if (!wide.matches) return;
    const open = toggles.filter(isOpen);
    open.slice(0, -1).forEach((btn) => setOpen(btn, false));
  });

  toggles.forEach((btn) => {
    const media = btn.closest('[data-collection]')?.querySelector<HTMLElement>('[data-collection-media]');
    if (!media) return;
    // The photo is a large pointer target for the same disclosure; the button stays the
    // keyboard and screen-reader path, so the photo itself is not focusable.
    media.addEventListener('click', () => btn.click());
    const cursor = media.querySelector<HTMLElement>('[data-collection-cursor]');
    if (cursor) followPointer(media, cursor, reduce);
  });
}

const FINE = '(hover: hover) and (pointer: fine)';
/** Share of the remaining distance covered per frame: a soft, unhurried follow. */
const LERP = 0.14;
const EDGE = 8;

/**
 * The «Подробнее» badge trails the mouse inside the photo: translate3d only, eased with
 * requestAnimationFrame and kept inside the frame. Its fade/scale is pure CSS (:hover).
 * Touch, pen-less coarse pointers and reduced motion get no following: the badge either
 * never shows (touch) or sits still in the centre (reduced motion).
 */
function followPointer(media: HTMLElement, cursor: HTMLElement, reduce: MediaQueryList): void {
  const fine = window.matchMedia(FINE);
  let x = 0;
  let y = 0;
  let tx = 0;
  let ty = 0;
  let raf = 0;

  const write = () => {
    cursor.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  };
  const frame = () => {
    x += (tx - x) * LERP;
    y += (ty - y) * LERP;
    if (Math.abs(tx - x) < 0.2 && Math.abs(ty - y) < 0.2) {
      x = tx;
      y = ty;
      raf = 0;
    } else {
      raf = requestAnimationFrame(frame);
    }
    write();
  };
  const target = (e: PointerEvent) => {
    const r = media.getBoundingClientRect();
    const half = cursor.offsetWidth / 2;
    const maxX = Math.max(0, r.width / 2 - half - EDGE);
    const maxY = Math.max(0, r.height / 2 - half - EDGE);
    tx = Math.min(maxX, Math.max(-maxX, e.clientX - r.left - r.width / 2));
    ty = Math.min(maxY, Math.max(-maxY, e.clientY - r.top - r.height / 2));
  };
  const active = (e: PointerEvent) => e.pointerType === 'mouse' && fine.matches && !reduce.matches;

  media.addEventListener('pointerenter', (e) => {
    if (!active(e)) return;
    // Appear where the pointer is, then follow from there.
    target(e);
    x = tx;
    y = ty;
    write();
  });
  media.addEventListener('pointermove', (e) => {
    if (!active(e)) return;
    target(e);
    if (!raf) raf = requestAnimationFrame(frame);
  });
  reduce.addEventListener('change', () => {
    if (!reduce.matches) return;
    cancelAnimationFrame(raf);
    raf = 0;
    cursor.style.removeProperty('transform');
  });
}
