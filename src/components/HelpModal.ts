// Help Modal Component

interface KeyBinding {
  key: string;
  description: string;
}

const keyBindings: KeyBinding[] = [
  { key: '1-5', description: 'Navigate to section' },
  { key: 'j / k', description: 'Scroll down / up' },
  { key: 'gg / G', description: 'Go to top / bottom' },
  { key: 't', description: 'Open theme picker' },
  { key: '?', description: 'Show this help' },
  { key: 'Esc', description: 'Close modal' },
  { key: 'ge', description: 'Open Email' },
  { key: 'gh', description: 'Open GitHub' },
  { key: 'gl', description: 'Open LinkedIn' },
  { key: 'gx', description: 'Open X (Twitter)' }
];

let modalElement: HTMLElement | null = null;

export function showHelpModal(onClose: () => void): void {
  if (modalElement) return;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'help-modal-title');

  const modal = document.createElement('div');
  modal.className = 'modal-content';

  modal.innerHTML = `
    <div class="modal-header">
      <span class="modal-title" id="help-modal-title">Keyboard Shortcuts</span>
    </div>
    <div class="modal-body">
      <table class="help-table">
        <tbody>
          ${keyBindings.map(binding => `
            <tr>
              <td><kbd>${binding.key}</kbd></td>
              <td>${binding.description}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div class="modal-footer">
      Press <kbd>Esc</kbd> to close
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  modalElement = overlay;

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeHelpModal();
      onClose();
    }
  });

  // Close on Escape key
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeHelpModal();
      onClose();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}

export function closeHelpModal(): void {
  if (modalElement) {
    modalElement.remove();
    modalElement = null;
  }
}

export function isHelpModalOpen(): boolean {
  return modalElement !== null;
}
