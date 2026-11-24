/**
 * Modal windows (brief.md §8.2) on native <dialog data-modal="<id>"> (Modal.astro).
 * Any [data-open-modal="<id>"] element opens its dialog — triggers added later (block 8,
 * footer) work through one delegated listener. showModal() makes the page behind inert;
 * Tab is additionally wrapped so focus never leaves the window for the browser UI.
 * Esc (native cancel), «×» and a click on the backdrop close it; focus returns to the
 * opener and the page scroll lock (html.modal-open) is released.
 */
export type ModalId = 'catalog' | 'samples' | 'questionnaire';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let current: { dialog: HTMLDialogElement; opener: HTMLElement | null } | null = null;

const dialogOf = (id: string) => document.querySelector<HTMLDialogElement>(`dialog[data-modal="${CSS.escape(id)}"]`);

function focusables(dialog: HTMLDialogElement): HTMLElement[] {
  return [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => el.getClientRects().length > 0 && !el.closest('[hidden], [inert]'),
  );
}

export function openModal(id: ModalId, opener: HTMLElement): void {
  const dialog = dialogOf(id);
  if (!dialog) return; // e.g. the questionnaire before Task 11 ships it
  if (current) closeModal();
  current = { dialog, opener };
  document.documentElement.classList.add('modal-open');
  dialog.showModal();
  dialog.scrollTop = 0;
}

export function closeModal(): void {
  if (current?.dialog.open) current.dialog.close(); // → 'close' event → cleanup
}

function onClosed(dialog: HTMLDialogElement): void {
  if (current?.dialog !== dialog) return;
  const { opener } = current;
  current = null;
  document.documentElement.classList.remove('modal-open');
  if (opener?.isConnected) opener.focus();
}

let ready = false;

export function initModals(): void {
  if (ready) return;
  ready = true;

  document.addEventListener('click', (e) => {
    const trigger = (e.target as Element | null)?.closest<HTMLElement>('[data-open-modal]');
    if (!trigger) return;
    e.preventDefault();
    openModal(trigger.dataset.openModal as ModalId, trigger);
  });

  for (const dialog of document.querySelectorAll<HTMLDialogElement>('dialog[data-modal]')) {
    dialog.addEventListener('close', () => onClosed(dialog));
    dialog.querySelector('[data-modal-close]')?.addEventListener('click', () => closeModal());
    // A click whose target is the <dialog> itself landed on the backdrop: its content
    // (head and body) fills the whole box. Needs mousedown there too, so a text
    // selection dragged out of a field does not close the window.
    let downOnBackdrop = false;
    dialog.addEventListener('mousedown', (e) => {
      downOnBackdrop = e.target === dialog;
    });
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog && downOnBackdrop) closeModal();
      downOnBackdrop = false;
    });
    dialog.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const items = focusables(dialog);
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const active = document.activeElement as HTMLElement | null;
      if (!active || !dialog.contains(active)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }
}
