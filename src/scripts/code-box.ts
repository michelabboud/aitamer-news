/**
 * Code-box behaviour. The explanation is already in the page (a details element). This script
 * opens the same copy in a dialog, returns focus to the button that opened it, and copies the
 * highlighted code. Esc and the Close button leave the dialog. Without this script the details
 * element stays readable.
 */
function statusOf(button: Element): HTMLElement | null {
  const status = button.closest('.codebox')?.querySelector('.codebox__status');
  return status instanceof HTMLElement ? status : null;
}

function preOf(button: Element): HTMLElement | null {
  const pre = button.closest('.codebox')?.querySelector('.codebox__main pre');
  return pre instanceof HTMLElement ? pre : null;
}

async function copyCode(button: HTMLButtonElement): Promise<void> {
  const pre = preOf(button);
  const status = statusOf(button);
  const text = pre?.textContent ?? '';
  try {
    await navigator.clipboard.writeText(text);
    if (status) status.textContent = 'Copied';
  } catch {
    if (status) status.textContent = 'Select the code and copy it';
  }
  if (status) window.setTimeout(() => { status.textContent = ''; }, 2000);
}

function openDialog(button: HTMLButtonElement): void {
  const id = button.getAttribute('aria-controls');
  const dialog = id ? document.getElementById(id) : null;
  if (!(dialog instanceof HTMLDialogElement) || dialog.open) return;
  dialog.showModal();
  const close = dialog.querySelector('[data-codebox-close]');
  if (close instanceof HTMLElement) close.focus();
  else dialog.focus();
  dialog.addEventListener('close', () => { button.focus(); }, { once: true });
}

document.querySelectorAll('[data-codebox-copy]').forEach((node) => {
  if (!(node instanceof HTMLButtonElement)) return;
  node.addEventListener('click', () => { void copyCode(node); });
});

document.querySelectorAll('[data-codebox-open]').forEach((node) => {
  if (!(node instanceof HTMLButtonElement)) return;
  node.addEventListener('click', () => { openDialog(node); });
});

document.querySelectorAll('.codebox__dialog').forEach((node) => {
  if (!(node instanceof HTMLDialogElement)) return;
  node.addEventListener('click', (event) => {
    if (event.target === node) node.close();
  });
  node.querySelectorAll('[data-codebox-close]').forEach((close) => {
    close.addEventListener('click', () => { node.close(); });
  });
});
