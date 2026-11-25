/**
 * Projects block, client round 3 (brief.md §6).
 *
 * Hotspots — three disclosure buttons on the lead photo («Дом у сосен»). A tooltip card
 * opens on hover (mouse), focus, click or tap; one at a time; Esc, a tap outside or
 * leaving with the mouse closes it, and so does a tap on the card itself. A click pins it open until clicked again. Each card is
 * placed inside the photo frame: above the dot, or below when there is no room, and
 * shifted sideways near the edges.
 *
 * Tilt — the photo frame of each card below leans with the pointer (±3.5°; the name and
 * meta stay flat, so their text is never re-rasterised), the photo inside drifts
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
    // Coordinates are relative to the dot. Clamp into the frame.
    const minT = f.top + EDGE - s.top;
    const maxT = f.bottom - EDGE - h - s.top;
    const minL = f.left + EDGE - s.left;
    const maxL = f.right - EDGE - w - s.left;
    const clampT = (v: number) => Math.min(maxT, Math.max(minT, v));
    const clampL = (v: number) => Math.min(maxL, Math.max(minL, v));
    // First choice: above (or below) the dot; on a small photo that card may cover a dot,
    // so the frame corners are tried too and the one covering the fewest dots wins.
    const candidates = [
      { left: clampL(-w / 2), top: clampT(side === 'top' ? -GAP - h : GAP) },
      { left: minL, top: minT },
      { left: maxL, top: minT },
      { left: minL, top: maxT },
      { left: maxL, top: maxT },
    ];
    const dots = parts.map(({ spot: d }) => {
      const r = d.getBoundingClientRect();
      return { x: r.left - s.left, y: r.top - s.top };
    });
    const R = GAP + 2;
    // Covering its own dot is worst (the card would lose its anchor); other dots stay
    // visible and tappable above the card (z-index), so they only cost a little.
    const covered = (c: { left: number; top: number }) =>
      dots
        .filter((d) => d.x + R > c.left && d.x - R < c.left + w && d.y + R > c.top && d.y - R < c.top + h)
        .reduce((sum, d) => sum + (d.x === 0 && d.y === 0 ? 100 : 1), 0);
    let best = candidates[0]!;
    let bestScore = covered(best);
    for (const c of candidates.slice(1)) {
      const score = covered(c);
      if (score < bestScore) {
        best = c;
        bestScore = score;
      }
    }
    tip.style.left = `${Math.round(best.left)}px`;
    tip.style.top = `${Math.round(best.top)}px`;
    tip.dataset.side = best.top + h / 2 < 0 ? 'top' : 'bottom';
    // On a small photo some overlap is unavoidable. A dot whose centre lands on the card
    // would sit on its text, so it steps back (fades, not tappable) until the card closes;
    // a tap on the card closes it. Dots only grazing the edge stay above it (z-index).
    parts.forEach(({ spot: other }, k) => {
      const d = dots[k]!;
      const under = other !== spot && d.x > best.left && d.x < best.left + w && d.y > best.top && d.y < best.top + h;
      other.toggleAttribute('data-covered', under);
    });
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
    parts.forEach(({ spot }) => spot.removeAttribute('data-covered'));
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
      // A card opened from the keyboard stays while focus is in it, whatever the mouse does.
      if (e.pointerType !== 'mouse' || current !== i || pinned || spot.querySelector(':focus-visible')) return;
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
      media.style.transform = `rotateX(${cur.rx.toFixed(2)}deg) rotateY(${cur.ry.toFixed(2)}deg)`;
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
      media.style.removeProperty('transform');
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
