/**
 * Projects block, client round 3 (brief.md §6).
 *
 * Hotspots — three disclosure buttons on the lead photo («Дом у сосен»). A tooltip card
 * opens on hover (mouse), focus, click or tap; one at a time; Esc, a tap outside or
 * leaving with the mouse closes it, and so does a tap on the card itself. A click pins it open until clicked again. Each card is
 * placed inside the photo frame: above the dot, or below when there is no room, and
 * shifted sideways near the edges.
 *
 * Tilt — the three cards below lean towards the pointer (±3.5°), the photo inside drifts
 * the other way and a soft glare follows. Fine pointer and allowed motion only; touch and
 * reduced motion keep the cards still. Only transform (and the glare's opacity) change.
 */

const FINE = '(hover: hover) and (pointer: fine)';
const REDUCE = '(prefers-reduced-motion: reduce)';
/** Space kept between a tooltip and the photo edge, and between it and the dot. */
const EDGE = 8;
const GAP = 22;
const CLOSE_DELAY = 140;

export function initHotspots(root: HTMLElement): void {
  const layer = root.querySelector<HTMLElement>('[data-hotspots]');
  const frame = layer?.parentElement;
  if (!layer || !frame) return;
  const spots = [...layer.querySelectorAll<HTMLElement>('[data-hotspot]')];
  const parts = spots.map((spot) => ({
    spot,
    btn: spot.querySelector<HTMLButtonElement>('[data-hotspot-toggle]')!,
    tip: spot.querySelector<HTMLElement>('[data-hotspot-tip]')!,
  }));
  let current = -1;
  let pinned = false;
  let timer = 0;

  function place(tip: HTMLElement, spot: HTMLElement): void {
    const f = frame!.getBoundingClientRect();
    const s = spot.getBoundingClientRect();
    tip.style.width = `${Math.min(240, f.width - 2 * EDGE)}px`;
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    const above = s.top - f.top;
    const below = f.bottom - s.top;
    const need = h + GAP + EDGE;
    const side = above >= need ? 'top' : below >= need ? 'bottom' : above >= below ? 'top' : 'bottom';
    let top = side === 'top' ? -GAP - h : GAP;
    // Clamp into the frame (coordinates are relative to the dot).
    top = Math.min(f.bottom - EDGE - h - s.top, Math.max(f.top + EDGE - s.top, top));
    const left = Math.min(f.right - EDGE - w - s.left, Math.max(f.left + EDGE - s.left, -w / 2));
    tip.style.left = `${Math.round(left)}px`;
    tip.style.top = `${Math.round(top)}px`;
    tip.dataset.side = side;
  }

  function open(i: number, pin: boolean): void {
    window.clearTimeout(timer);
    if (current !== i) close();
    const { btn, tip, spot } = parts[i]!;
    current = i;
    pinned = pin;
    btn.setAttribute('aria-expanded', 'true');
    tip.hidden = false;
    place(tip, spot);
  }

  function close(): void {
    window.clearTimeout(timer);
    if (current < 0) return;
    const { btn, tip } = parts[current]!;
    btn.setAttribute('aria-expanded', 'false');
    tip.hidden = true;
    current = -1;
    pinned = false;
  }

  const fine = window.matchMedia(FINE);

  parts.forEach(({ spot, btn, tip }, i) => {
    // The card holds only text: a tap on it puts it away (on a phone it may cover a dot).
    tip.addEventListener('click', close);
    btn.addEventListener('click', () => {
      if (current === i && pinned) close();
      else open(i, true);
    });
    // Keyboard focus opens without pinning; a mouse/touch press is followed by click.
    btn.addEventListener('focus', () => {
      if (current !== i && btn.matches(':focus-visible')) open(i, false);
    });
    spot.addEventListener('focusout', (e) => {
      const next = e.relatedTarget as Node | null;
      if (current === i && !(next && spot.contains(next))) close();
    });
    spot.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse' || !fine.matches) return;
      if (current === i) window.clearTimeout(timer);
      else open(i, false);
    });
    spot.addEventListener('pointerleave', (e) => {
      if (e.pointerType !== 'mouse' || current !== i || pinned) return;
      timer = window.setTimeout(close, CLOSE_DELAY);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || current < 0) return;
    const { spot, btn } = parts[current]!;
    const inside = spot.contains(document.activeElement);
    close();
    if (inside) btn.focus();
  });
  document.addEventListener('pointerdown', (e) => {
    if (current >= 0 && !parts[current]!.spot.contains(e.target as Node)) close();
  });
  window.addEventListener('resize', () => {
    if (current >= 0) place(parts[current]!.tip, parts[current]!.spot);
  });

  // Three slow pulses the first time the photo is in view, then the dots rest.
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        layer.classList.add('is-pulsing');
      },
      { threshold: 0.4 },
    );
    io.observe(frame);
  }
}

const MAX_DEG = 3.5;
const SHIFT = 8;
const ZOOM = 1.04;
const LERP = 0.12;

export function initTilt(root: HTMLElement): void {
  const fine = window.matchMedia(FINE);
  const reduce = window.matchMedia(REDUCE);
  const allowed = () => fine.matches && !reduce.matches;

  for (const item of root.querySelectorAll<HTMLElement>('[data-tilt]')) {
    const card = item.querySelector<HTMLElement>('.card');
    const media = item.querySelector<HTMLElement>('.card__media');
    const pic = media?.querySelector<HTMLElement>('picture');
    if (!card || !media || !pic) continue;

    // Current and target: rotateX, rotateY, photo shift x/y, zoom, glare x/y.
    const cur = { rx: 0, ry: 0, px: 0, py: 0, z: 1, gx: 0, gy: 0 };
    const tgt = { ...cur };
    let raf = 0;

    const write = () => {
      card.style.transform = `rotateX(${cur.rx.toFixed(2)}deg) rotateY(${cur.ry.toFixed(2)}deg)`;
      pic.style.transform = `translate3d(${cur.px.toFixed(1)}px, ${cur.py.toFixed(1)}px, 0) scale(${cur.z.toFixed(3)})`;
      card.style.setProperty('--gx', `${cur.gx.toFixed(0)}px`);
      card.style.setProperty('--gy', `${cur.gy.toFixed(0)}px`);
    };
    const reset = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      Object.assign(cur, { rx: 0, ry: 0, px: 0, py: 0, z: 1, gx: 0, gy: 0 });
      Object.assign(tgt, cur);
      card.classList.remove('is-tilting');
      card.style.removeProperty('transform');
      pic.style.removeProperty('transform');
    };
    const step = () => {
      let moving = false;
      for (const k of Object.keys(cur) as (keyof typeof cur)[]) {
        cur[k] += (tgt[k] - cur[k]) * LERP;
        if (Math.abs(tgt[k] - cur[k]) > (k === 'z' ? 0.0005 : 0.02)) moving = true;
        else cur[k] = tgt[k];
      }
      write();
      if (moving) {
        raf = requestAnimationFrame(step);
      } else {
        raf = 0;
        // Back at rest after leaving: drop the inline styles altogether.
        if (!card.classList.contains('is-tilting')) reset();
      }
    };
    const run = () => {
      if (!raf) raf = requestAnimationFrame(step);
    };

    // The <li> does not tilt, so its box is a steady reference for the pointer.
    item.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || !allowed()) return;
      const r = item.getBoundingClientRect();
      const m = media.getBoundingClientRect();
      const nx = Math.min(0.5, Math.max(-0.5, (e.clientX - r.left) / r.width - 0.5));
      const ny = Math.min(0.5, Math.max(-0.5, (e.clientY - r.top) / r.height - 0.5));
      card.classList.add('is-tilting');
      Object.assign(tgt, {
        rx: -ny * 2 * MAX_DEG,
        ry: nx * 2 * MAX_DEG,
        px: -nx * 2 * SHIFT,
        py: -ny * 2 * SHIFT,
        z: ZOOM,
        // Glare centre relative to the photo centre.
        gx: e.clientX - m.left - m.width / 2,
        gy: e.clientY - m.top - m.height / 2,
      });
      run();
    });
    item.addEventListener('pointerleave', () => {
      if (!card.classList.contains('is-tilting')) return;
      card.classList.remove('is-tilting');
      Object.assign(tgt, { rx: 0, ry: 0, px: 0, py: 0, z: 1 });
      run();
    });
    reduce.addEventListener('change', () => reduce.matches && reset());
  }
}
