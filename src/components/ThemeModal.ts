// Theme Modal Component
import { getThemes, getCurrentTheme, setTheme, type Theme } from '../utils/theme';

let modalElement: HTMLElement | null = null;
let activeKeydownHandler: ((e: KeyboardEvent) => void) | null = null;

// Vim-style shortcuts for themes
const themeShortcuts: Record<string, string> = {
  'catppuccin': 'c',
  'gruvbox': 'g',
  'nord': 'n',
  'tokyo-night': 'y',
  'dracula': 'd'
};

function getShortcutForTheme(themeId: string): string {
  return themeShortcuts[themeId] || themeId[0];
}

export function showThemeModal(onClose: () => void, onThemeChange?: () => void): void {
  if (modalElement) return;

  const themes = getThemes();
  const currentTheme = getCurrentTheme();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'theme-modal-title');

  const modal = document.createElement('div');
  modal.className = 'modal-content';

  modal.innerHTML = `
    <div class="modal-header">
      <span class="modal-title" id="theme-modal-title">Select Theme</span>
    </div>
    <div class="modal-body">
      <ul class="theme-list" role="listbox" aria-label="Available themes">
        ${themes.map((theme) => `
          <li class="theme-item${theme.id === currentTheme ? ' active' : ''}"
              role="option"
              aria-selected="${theme.id === currentTheme}"
              data-theme-id="${theme.id}"
              tabindex="0">
            <span class="theme-shortcut">[${getShortcutForTheme(theme.id)}]</span>
            <span class="theme-indicator">${theme.id === currentTheme ? '●' : '○'}</span>
            <span class="theme-name">${theme.name}</span>
            <span class="theme-description">${theme.description}</span>
          </li>
        `).join('')}
      </ul>
    </div>
    <div class="modal-footer">
      Press <kbd>c/g/n/y/d</kbd> to select or <kbd>Esc</kbd> to close
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  modalElement = overlay;

  // Handle theme selection
  const themeItems = modal.querySelectorAll('.theme-item');
  themeItems.forEach(item => {
    item.addEventListener('click', () => {
      const themeId = (item as HTMLElement).dataset.themeId;
      if (themeId) {
        selectTheme(themeId, themes, onThemeChange);
        updateActiveTheme(modal, themeId);
      }
    });
  });

  // Cleanup function
  const cleanup = () => {
    if (activeKeydownHandler) {
      document.removeEventListener('keydown', activeKeydownHandler);
      activeKeydownHandler = null;
    }
  };

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      cleanup();
      closeThemeModal();
      onClose();
    }
  });

  // Handle keyboard navigation
  const handleKeydown = (e: KeyboardEvent) => {
    // Letter keys to select theme (vim-style)
    const key = e.key.toLowerCase();
    const themeId = Object.entries(themeShortcuts).find(([, shortcut]) => shortcut === key)?.[0];

    if (themeId && themes.some(t => t.id === themeId)) {
      e.preventDefault();
      selectTheme(themeId, themes, onThemeChange);
      updateActiveTheme(modal, themeId);
      return;
    }

    // Escape to close
    if (e.key === 'Escape') {
      cleanup();
      closeThemeModal();
      onClose();
    }
  };

  activeKeydownHandler = handleKeydown;
  document.addEventListener('keydown', handleKeydown);
}

function selectTheme(themeId: string, _themes: Theme[], onThemeChange?: () => void): void {
  setTheme(themeId);
  if (onThemeChange) {
    onThemeChange();
  }
}

function updateActiveTheme(modal: HTMLElement, activeThemeId: string): void {
  const items = modal.querySelectorAll('.theme-item');
  items.forEach(item => {
    const itemEl = item as HTMLElement;
    const isActive = itemEl.dataset.themeId === activeThemeId;
    itemEl.classList.toggle('active', isActive);
    itemEl.setAttribute('aria-selected', isActive.toString());

    const indicator = itemEl.querySelector('.theme-indicator');
    if (indicator) {
      indicator.textContent = isActive ? '●' : '○';
    }
  });
}

export function closeThemeModal(): void {
  if (activeKeydownHandler) {
    document.removeEventListener('keydown', activeKeydownHandler);
    activeKeydownHandler = null;
  }
  if (modalElement) {
    modalElement.remove();
    modalElement = null;
  }
}

export function isThemeModalOpen(): boolean {
  return modalElement !== null;
}
