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
}
