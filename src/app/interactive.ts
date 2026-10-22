/**
 * Элементы, клик по которым НЕ должен переключать сцену.
 * Сцены могут помечать свои интерактивные блоки атрибутом data-interactive.
 */
export const INTERACTIVE_SELECTOR = [
  'a',
  'button',
  'input',
  'select',
  'textarea',
  'label',
  'summary',
  '[role="button"]',
  '[role="tab"]',
  '[role="link"]',
  '[role="switch"]',
  '[role="slider"]',
  '[role="menuitem"]',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
  '[data-interactive]',
  '.recharts-wrapper',
  'svg [data-interactive]',
].join(',');

export function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return target.closest(INTERACTIVE_SELECTOR) !== null;
}

export function hasTextSelection(): boolean {
  const selection = window.getSelection();
  return Boolean(selection && !selection.isCollapsed && selection.toString().trim().length > 0);
}
