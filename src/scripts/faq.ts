/**
 * FAQ accordion: native <button>s with aria-expanded / aria-controls, so Enter and Space
 * work without extra key handling. Answers open independently (closing one above the
 * reader would shift the page). Height is never animated: the answer appears at full
 * height at once and only its content fades in (CSS).
 */
export function initFaq(root: HTMLElement): void {
  root.querySelectorAll<HTMLButtonElement>('[data-faq-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const panel = document.getElementById(btn.getAttribute('aria-controls') ?? '');
      if (!panel) return;
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      panel.hidden = !open;
    });
  });
}
