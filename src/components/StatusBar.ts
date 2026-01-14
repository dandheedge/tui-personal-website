// Status Bar Component

export function createStatusBar(currentSection: string): HTMLElement {
  const footer = document.createElement('footer');
  footer.className = 'status-bar';

  footer.innerHTML = `
    <div class="status-left">
      <span class="status-prompt">dandhi@portfolio:~$</span>
      <span class="status-section" id="status-section">${currentSection}</span>
    </div>
    <div class="status-center">
      <span class="status-hint"><kbd>[?]</kbd> Help  <kbd>[t]</kbd> Theme</span>
    </div>
    <div class="status-right">
      <span class="status-time" id="status-time"></span>
      <span class="status-mode">-- NORMAL --</span>
    </div>
  `;

  // Start time updates
  const timeElement = footer.querySelector('#status-time') as HTMLElement;
  updateTime(timeElement);
  setInterval(() => updateTime(timeElement), 1000);

  return footer;
}

function updateTime(element: HTMLElement): void {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Jakarta'
  });
  element.textContent = `${timeStr} GMT+7`;
}

export function updateStatusSection(statusBar: HTMLElement, section: string): void {
  const sectionElement = statusBar.querySelector('#status-section');
  if (sectionElement) {
    sectionElement.textContent = section;
  }
}
