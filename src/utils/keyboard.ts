// Keyboard navigation handler

type KeyHandler = () => void;

interface KeyBindings {
  [key: string]: KeyHandler;
}

let bindings: KeyBindings = {};
let enabled = true;

// Leader key state for vim-style sequences (e.g., 'gg', 'ge')
let leaderKey: string | null = null;
let leaderTimeout: number | null = null;
const LEADER_TIMEOUT_MS = 500;

export function initKeyboardNavigation(handlers: KeyBindings): void {
  bindings = handlers;

  document.addEventListener('keydown', handleKeyDown);
}

function clearLeaderKey(): void {
  leaderKey = null;
  if (leaderTimeout !== null) {
    clearTimeout(leaderTimeout);
    leaderTimeout = null;
  }
}

function handleKeyDown(event: KeyboardEvent): void {
  // Don't handle if keyboard navigation is disabled
  if (!enabled) return;

  // Don't handle if user is typing in an input
  if (event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement) {
    return;
  }

  const key = event.key;

  // Handle leader key sequences (e.g., 'gg', 'ge', 'gh')
  if (leaderKey !== null) {
    const sequence = leaderKey + key;
    clearLeaderKey();

    if (bindings[sequence]) {
      event.preventDefault();
      bindings[sequence]();
      return;
    }
    // If no sequence match, fall through to check single key
  }

  // Check if this key starts a sequence (currently 'g' is our leader)
  if (key === 'g' && !event.shiftKey) {
    // Check if there are any sequences starting with 'g'
    const hasSequences = Object.keys(bindings).some(k => k.startsWith('g') && k.length > 1);
    if (hasSequences) {
      event.preventDefault();
      leaderKey = 'g';
      leaderTimeout = window.setTimeout(() => {
        // Timeout: execute single 'g' if bound, then clear
        if (bindings['g']) {
          bindings['g']();
        }
        clearLeaderKey();
      }, LEADER_TIMEOUT_MS);
      return;
    }
  }

  // Check for exact key match
  if (bindings[key]) {
    event.preventDefault();
    bindings[key]();
    return;
  }

  // Check for key with shift modifier
  if (event.shiftKey && bindings[`Shift+${key}`]) {
    event.preventDefault();
    bindings[`Shift+${key}`]();
    return;
  }
}

export function setKeyboardEnabled(value: boolean): void {
  enabled = value;
}

export function isKeyboardEnabled(): boolean {
  return enabled;
}

export function updateBindings(newBindings: KeyBindings): void {
  bindings = { ...bindings, ...newBindings };
}

// Vim-style scroll functions
export function scrollDown(): void {
  window.scrollBy({ top: 100, behavior: 'smooth' });
}

export function scrollUp(): void {
  window.scrollBy({ top: -100, behavior: 'smooth' });
}

export function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function scrollToBottom(): void {
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

// Content scroll functions (for panel content)
export function scrollContentDown(element: HTMLElement): void {
  element.scrollBy({ top: 50, behavior: 'smooth' });
}

export function scrollContentUp(element: HTMLElement): void {
  element.scrollBy({ top: -50, behavior: 'smooth' });
}
