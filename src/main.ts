// Main Application Entry Point
import './styles/main.css';

import { createHeader } from './components/Header';
import { createTabBar, updateActiveTab, getTabByShortcut, tabs } from './components/TabBar';
import { createStatusBar, updateStatusSection } from './components/StatusBar';
import { createPanel, updatePanelContent } from './components/Panel';
import { showHelpModal, closeHelpModal, isHelpModalOpen } from './components/HelpModal';
import { showThemeModal, closeThemeModal, isThemeModalOpen } from './components/ThemeModal';

import { createAboutSection } from './sections/About';
import { createSkillsSection } from './sections/Skills';
import { createExperienceSection } from './sections/Experience';
import { createProjectsSection } from './sections/Projects';
import { createContactSection } from './sections/Contact';

import { initKeyboardNavigation, scrollContentDown, scrollContentUp, scrollToTop, scrollToBottom, setKeyboardEnabled } from './utils/keyboard';
import { loadThemes } from './utils/theme';

// Section creators map
const sectionCreators: Record<string, () => HTMLElement> = {
  about: createAboutSection,
  skills: createSkillsSection,
  experience: createExperienceSection,
  projects: createProjectsSection,
  contact: createContactSection
};

// State
let currentTab = 'about';
let tabBarElement: HTMLElement;
let statusBarElement: HTMLElement;
let panelElement: HTMLElement;

// Navigation function
function navigateToTab(tabId: string): void {
  if (!sectionCreators[tabId] || tabId === currentTab) return;

  currentTab = tabId;

  // Update tab bar
  updateActiveTab(tabBarElement, tabId);

  // Update content panel
  const content = sectionCreators[tabId]();
  updatePanelContent(panelElement, content);

  // Update status bar
  updateStatusSection(statusBarElement, tabId);

  // Update URL hash
  history.replaceState(null, '', `#${tabId}`);
}

// Modal handlers
function handleOpenHelp(): void {
  setKeyboardEnabled(false);
  showHelpModal(() => {
    setKeyboardEnabled(true);
  });
}

function handleOpenTheme(): void {
  setKeyboardEnabled(false);
  showThemeModal(
    () => setKeyboardEnabled(true),
    () => {
      // Theme changed callback - could update UI if needed
    }
  );
}

function handleCloseModals(): void {
  if (isHelpModalOpen()) {
    closeHelpModal();
    setKeyboardEnabled(true);
  }
  if (isThemeModalOpen()) {
    closeThemeModal();
    setKeyboardEnabled(true);
  }
}

// Initialize application
async function initApp(): Promise<void> {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) return;

  // Clear any prerendered content to avoid duplication
  app.replaceChildren();

  // Load themes
  await loadThemes();

  // Get initial tab from URL hash
  const hash = window.location.hash.slice(1);
  if (hash && sectionCreators[hash]) {
    currentTab = hash;
  }

  // Create main structure
  const container = document.createElement('div');
  container.className = 'app-container';

  // Create header
  const header = createHeader();
  container.appendChild(header);

  // Create terminal window
  const terminalWindow = document.createElement('div');
  terminalWindow.className = 'terminal-window';

  // Create tab bar
  tabBarElement = createTabBar(currentTab, navigateToTab);
  terminalWindow.appendChild(tabBarElement);

  // Create content panel
  const initialContent = sectionCreators[currentTab]();
  panelElement = createPanel(currentTab, initialContent);
  terminalWindow.appendChild(panelElement);

  container.appendChild(terminalWindow);

  // Create status bar
  statusBarElement = createStatusBar(currentTab);
  container.appendChild(statusBarElement);

  // Append to app
  app.appendChild(container);

  // Initialize keyboard navigation
  initKeyboardNavigation({
    // Tab navigation
    '1': () => navigateToTab('about'),
    '2': () => navigateToTab('skills'),
    '3': () => navigateToTab('experience'),
    '4': () => navigateToTab('projects'),
    '5': () => navigateToTab('contact'),

    // Vim-style scrolling
    'j': () => scrollContentDown(panelElement),
    'k': () => scrollContentUp(panelElement),
    'gg': () => {
      panelElement.scrollTop = 0;
    },
    'G': () => {
      panelElement.scrollTop = panelElement.scrollHeight;
    },
    'Shift+G': () => {
      panelElement.scrollTop = panelElement.scrollHeight;
    },

    // Contact shortcuts (vim-style: g + key)
    'ge': () => window.open('mailto:dandhee.damarrama@gmail.com', '_self'),
    'gh': () => window.open('https://github.com/damarrama', '_blank'),
    'gl': () => window.open('https://linkedin.com/in/damarrama', '_blank'),
    'gx': () => window.open('https://x.com/dandheedge', '_blank'),

    // Page scroll
    'Shift+j': () => scrollToBottom(),
    'Shift+k': () => scrollToTop(),

    // Modals
    '?': handleOpenHelp,
    't': handleOpenTheme,
    'Escape': handleCloseModals,

    // Tab cycling
    'Tab': () => {
      const currentIndex = tabs.findIndex(t => t.id === currentTab);
      const nextIndex = (currentIndex + 1) % tabs.length;
      navigateToTab(tabs[nextIndex].id);
    }
  });

  // Handle hash changes
  window.addEventListener('hashchange', () => {
    const newHash = window.location.hash.slice(1);
    if (newHash && sectionCreators[newHash] && newHash !== currentTab) {
      navigateToTab(newHash);
    }
  });

  // Handle number key shortcuts for tabs (alternative binding)
  document.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    const tab = getTabByShortcut(e.key);
    if (tab && !isHelpModalOpen() && !isThemeModalOpen()) {
      navigateToTab(tab.id);
    }
  });
}

// Start the application
// Check if document is already ready (important for prerendered pages)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
