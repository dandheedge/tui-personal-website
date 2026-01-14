// Content Panel Component

export function createPanel(tabId: string, content: HTMLElement): HTMLElement {
  const panel = document.createElement('main');
  panel.className = 'content-panel';
  panel.id = `panel-${tabId}`;
  panel.setAttribute('role', 'tabpanel');
  panel.setAttribute('aria-labelledby', `tab-${tabId}`);
  panel.setAttribute('tabindex', '0');

  panel.appendChild(content);

  return panel;
}

export function updatePanelContent(panel: HTMLElement, content: HTMLElement): void {
  panel.innerHTML = '';
  panel.appendChild(content);
  // Reset scroll position
  panel.scrollTop = 0;
}
