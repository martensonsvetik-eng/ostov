/**
 * Header behaviour: phone menu (toggle, Esc, focus trap, close on anchor),
 * current-section highlight via IntersectionObserver, and carrying the URL hash
 * over to the other-language page.
 */
const DESKTOP = '(min-width: 73.75em)';

const focusableSelector = 'a[href], button:not([disabled])';

export function initHeader(root: HTMLElement): void {
  const btn = root.querySelector<HTMLButtonElement>('.site-header__menu-btn');
  const panel = root.querySelector<HTMLElement>('#site-menu');
  if (!btn || !panel) return;

  const desktop = window.matchMedia(DESKTOP);
  const labelOpen = btn.dataset.labelOpen ?? '';
  const labelClose = btn.dataset.labelClose ?? '';
  const outside = () => document.querySelectorAll<HTMLElement>('#main, .skip-link');

  function setOpen(open: boolean, restoreFocus = false): void {
    root.toggleAttribute('data-open', open);
    document.documentElement.classList.toggle('menu-open', open);
    btn!.setAttribute('aria-expanded', String(open));
    btn!.setAttribute('aria-label', open ? labelClose : labelOpen);
    outside().forEach((el) => el.toggleAttribute('inert', open));
    if (open) panel!.querySelector<HTMLElement>('a')?.focus();
    else if (restoreFocus) btn!.focus();
  }
  const isOpen = () => root.hasAttribute('data-open');

  btn.addEventListener('click', () => setOpen(!isOpen(), true));

  panel.addEventListener('click', (e) => {
    if ((e.target as Element).closest('a[href^="#"]')) setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false, true);
      return;
    }
    if (e.key !== 'Tab') return;
    const items = [...root.querySelectorAll<HTMLElement>(focusableSelector)].filter(
      (el) => el.getClientRects().length > 0,
    );
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (!items.includes(active as HTMLElement)) {
      e.preventDefault();
      first.focus();
    } else if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  });

  desktop.addEventListener('change', () => {
    if (desktop.matches && isOpen()) setOpen(false);
  });

  // Language links keep the current hash (#process -> /en/#process).
  const langLinks = [...root.querySelectorAll<HTMLAnchorElement>('a[data-lang-link]')];
  const syncLang = () =>
    langLinks.forEach((a) => {
      a.href = a.dataset.langLink! + window.location.hash;
    });
  syncLang();
  window.addEventListener('hashchange', syncLang);
  langLinks.forEach((a) => a.addEventListener('click', syncLang));

  // Current section: the last section whose top has passed the probe line.
  const links = new Map<string, HTMLAnchorElement>();
  root.querySelectorAll<HTMLAnchorElement>('#site-menu nav a[href^="#"]').forEach((a) => {
    const id = a.getAttribute('href')!.slice(1);
    if (!links.has(id)) links.set(id, a);
  });
  const sections = [...links.keys()]
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => !!el);
  const probe = 0.35;
  const headerH = () => root.getBoundingClientRect().height;

  function update(): void {
    const line = headerH() + window.innerHeight * probe;
    let current: string | null = null;
    for (const s of sections) if (s.getBoundingClientRect().top <= line) current = s.id;
    links.forEach((a, id) => {
      if (id === current) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }

  const io = new IntersectionObserver(update, {
    rootMargin: `-${Math.round(headerH())}px 0px -${(1 - probe) * 100}% 0px`,
    threshold: [0, 1],
  });
  sections.forEach((s) => io.observe(s));
  window.addEventListener('resize', update);
  update();
}
