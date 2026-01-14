// Theme management utility
import { getStorageItem, setStorageItem } from './storage';

export interface Theme {
  id: string;
  name: string;
  description: string;
}

export interface ThemeConfig {
  themes: Theme[];
  default: string;
}

const THEME_STORAGE_KEY = 'theme';

let themes: Theme[] = [];
let currentTheme: string = 'catppuccin';

export async function loadThemes(): Promise<Theme[]> {
  try {
    const response = await fetch('/themes.json');
    const config: ThemeConfig = await response.json();
    themes = config.themes;

    // Load saved theme or use default
    const savedTheme = getStorageItem<string>(THEME_STORAGE_KEY, config.default);
    const validTheme = themes.find(t => t.id === savedTheme);
    currentTheme = validTheme ? savedTheme : config.default;

    applyTheme(currentTheme);
    return themes;
  } catch (error) {
    console.error('Failed to load themes:', error);
    // Fallback themes
    themes = [
      { id: 'catppuccin', name: 'Catppuccin Mocha', description: 'Warm, cozy, and dark' },
      { id: 'gruvbox', name: 'Gruvbox Dark', description: 'Retro, earthy tones' },
      { id: 'nord', name: 'Nord', description: 'Arctic, elegant, minimal' },
      { id: 'tokyo-night', name: 'Tokyo Night', description: 'Cyberpunk neon vibes' },
      { id: 'dracula', name: 'Dracula', description: 'Gothic purple and pink' }
    ];
    applyTheme('catppuccin');
    return themes;
  }
}

export function getThemes(): Theme[] {
  return themes;
}

export function getCurrentTheme(): string {
  return currentTheme;
}

export function setTheme(themeId: string): void {
  const theme = themes.find(t => t.id === themeId);
  if (!theme) {
    console.warn(`Theme "${themeId}" not found`);
    return;
  }

  currentTheme = themeId;
  setStorageItem(THEME_STORAGE_KEY, themeId);
  applyTheme(themeId);
}

export function applyTheme(themeId: string): void {
  document.documentElement.setAttribute('data-theme', themeId);

  // Update theme-color meta tag
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    const colors: Record<string, string> = {
      'catppuccin': '#1e1e2e',
      'gruvbox': '#282828',
      'nord': '#2e3440',
      'tokyo-night': '#1a1b26',
      'dracula': '#282a36'
    };
    themeColorMeta.setAttribute('content', colors[themeId] || colors['catppuccin']);
  }
}

export function cycleTheme(): void {
  const currentIndex = themes.findIndex(t => t.id === currentTheme);
  const nextIndex = (currentIndex + 1) % themes.length;
  setTheme(themes[nextIndex].id);
}
