/**
 * Theme toggle component
 * Three-state theme switcher: system → light → dark
 */

import { BaseComponent } from './base-component.js';
import type { ComponentState } from '../types/component-types.js';
import type { ThemePreference, ThemeState } from '../types/theme-types.js';
import { getThemePreference, setTheme, subscribeToThemeChanges } from '../state/theme-manager.js';

interface ThemeToggleState extends ComponentState {
  theme: ThemePreference;
}

/**
 * Theme toggle button component
 */
export class ThemeToggle extends BaseComponent<ThemeToggleState> {
  constructor(root: HTMLElement) {
    super(root, {
      theme: getThemePreference(),
    });
    
    // Subscribe to theme changes (from other sources)
    this.addSubscription(
      subscribeToThemeChanges((themeState: ThemeState) => {
        this.setState({ theme: themeState.preference });
      })
    );
  }
  
  render(): void {
    const { theme } = this.state;
    
    this.root.innerHTML = `
      <button 
        class="theme-toggle button is-ghost"
        aria-label="Toggle theme (current: ${theme})"
        title="Toggle theme"
      >
        <span class="icon">
          ${this.getThemeIcon(theme)}
        </span>
        ${!this.isMobile() ? `<span class="theme-toggle__label">${this.getThemeLabel(theme)}</span>` : ''}
      </button>
    `;
    
    // Attach event listener
    const button = this.query('.theme-toggle');
    if (button) {
      this.addEventListener(button, 'click', () => this.cycleTheme());
    }
  }
  
  private cycleTheme(): void {
    const { theme } = this.state;
    
    // Cycle through: system → light → dark → system
    const nextTheme: ThemePreference = 
      theme === 'system' ? 'light' :
      theme === 'light' ? 'dark' :
      'system';
    
    setTheme(nextTheme);
  }
  
  private getThemeIcon(theme: ThemePreference): string {
    switch (theme) {
      case 'light':
        return '<i class="fas fa-sun"></i>';
      case 'dark':
        return '<i class="fas fa-moon"></i>';
      case 'system':
        return '<i class="fas fa-circle-half-stroke"></i>';
    }
  }
  
  private getThemeLabel(theme: ThemePreference): string {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'Auto';
    }
  }
}
