// Tab Bar Component

export interface Tab {
  id: string;
  label: string;
  shortcut: string;
  command: string;
}

export const tabs: Tab[] = [
  { id: 'about', label: 'About', shortcut: '1', command: 'whoami' },
  { id: 'skills', label: 'Skills', shortcut: '2', command: 'cat skills.md' },
  { id: 'experience', label: 'Experience', shortcut: '3', command: 'ls -la ./exp' },
  { id: 'projects', label: 'Projects', shortcut: '4', command: 'tree ./projects' },
  { id: 'contact', label: 'Contact', shortcut: '5', command: 'cat contact.txt' }
];

export function createTabBar(
  activeTab: string,
  onTabClick: (tabId: string) => void
): HTMLElement {
  const nav = document.createElement('nav');
  nav.className = 'tab-bar';
  nav.setAttribute('role', 'tablist');
  nav.setAttribute('aria-label', 'Portfolio sections');

  tabs.forEach(tab => {
    const button = document.createElement('button');
    button.className = `tab-button${tab.id === activeTab ? ' active' : ''}`;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', tab.id === activeTab ? 'true' : 'false');
    button.setAttribute('aria-controls', `panel-${tab.id}`);
    button.setAttribute('id', `tab-${tab.id}`);
    button.dataset.tabId = tab.id;

    button.innerHTML = `
      <span class="tab-shortcut">[${tab.shortcut}]</span>
      <span class="tab-label">${tab.label}</span>
    `;

    button.addEventListener('click', () => onTabClick(tab.id));

    nav.appendChild(button);
  });

  return nav;
}

export function updateActiveTab(tabBar: HTMLElement, activeTabId: string): void {
  const buttons = tabBar.querySelectorAll('.tab-button');
  buttons.forEach(button => {
    const btn = button as HTMLElement;
    const isActive = btn.dataset.tabId === activeTabId;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}

export function getTabById(tabId: string): Tab | undefined {
  return tabs.find(t => t.id === tabId);
}

export function getTabByShortcut(shortcut: string): Tab | undefined {
  return tabs.find(t => t.shortcut === shortcut);
}
