# Theme Management

This document describes the theme system implementation in the Smotra frontend.

## Overview

The application supports a three-state theme system:

1. **System** (default): Follows OS preference
2. **Light**: Manual light mode
3. **Dark**: Manual dark mode

Theme preference is stored in localStorage and persists across sessions.

## Theme States

### System Preference (Default)

By default, the application follows the user's operating system theme preference:

```typescript
// Detects system preference
const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
```

Benefits:
- Respects user's OS-level preference
- Automatically changes with OS theme
- Reduced eye strain during different times of day
- Better battery life on OLED screens (dark mode)

### Manual Override

Users can manually select light or dark mode via the theme toggle button:

```typescript
setTheme('light');  // Force light mode
setTheme('dark');   // Force dark mode
setTheme('system'); // Return to system preference
```

Manual selection takes precedence over system preference and is saved to localStorage.

## Implementation

### Theme Manager

Central theme management in `src/state/theme-manager.ts`:

```typescript
export function initializeTheme(): void {
  const preference = getThemePreference(); // 'system', 'light', or 'dark'
  const effective = getEffectiveTheme(preference);
  applyTheme(effective);
  
  // Listen for system preference changes
  watchSystemPreference();
}
```

### Theme Application

Theme is applied via CSS class on the `<html>` element:

```typescript
function applyTheme(theme: 'light' | 'dark'): void {
  document.documentElement.classList.remove('theme-light', 'theme-dark');
  document.documentElement.classList.add(`theme-${theme}`);
}
```

### FOUC Prevention

Flash of Unstyled Content (FOUC) is prevented by initializing theme **before** CSS loads:

```html
<!-- public/index.html -->
<script>
  // Inline script executes immediately before CSS loads
  (function() {
    const stored = localStorage.getItem('theme_preference') || 'system';
    const isDark = stored === 'dark' || 
                   (stored === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.add(isDark ? 'theme-dark' : 'theme-light');
  })();
</script>

<!-- CSS files load after theme is set -->
<link rel="stylesheet" href="/css/base.css">
```

### System Preference Monitoring

Listen for OS theme changes and update automatically:

```typescript
function watchSystemPreference(): void {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  mediaQuery.addEventListener('change', (e) => {
    const preference = getThemePreference();
    
    // Only update if user hasn't manually overridden
    if (preference === 'system') {
      const effective = e.matches ? 'dark' : 'light';
      applyTheme(effective);
      notifySubscribers();
    }
  });
}
```

## CSS Architecture

### CSS Custom Properties

Theme colors defined as CSS custom properties in `public/css/variables.css`:

```css
:root {
  /* Default (light) theme */
  --color-bg: #ffffff;
  --color-text: #363636;
  --color-surface: #f5f5f5;
  --color-border: #dbdbdb;
  --color-success: #48c78e;
}
```

### Theme Overrides

Dark theme overrides in `public/css/theme-dark.css`:

```css
html.theme-dark {
  --color-bg: #0b0e14;
  --color-text: #e6e6e6;
  --color-surface: #1a1f29;
  --color-border: #2a2f39;
  --color-success: #48c78e;
}
```

Light theme explicit overrides in `public/css/theme-light.css`:

```css
html.theme-light {
  --color-bg: #ffffff;
  --color-text: #363636;
  --color-surface: #f5f5f5;
  --color-border: #dbdbdb;
}
```

### Component Styling

Components use CSS custom properties for theme-aware styling:

```css
.agent-card {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}
```

No JavaScript needed for theme styling—everything is CSS-driven.

## Theme Toggle Component

Interactive theme switcher button:

```typescript
export class ThemeToggle extends BaseComponent {
  private cycleTheme(): void {
    const current = getThemePreference();
    
    // Cycle: system → light → dark → system
    const next = 
      current === 'system' ? 'light' :
      current === 'light' ? 'dark' :
      'system';
    
    setTheme(next);
  }
}
```

### Icons

- **System**: Half-filled circle icon (auto mode)
- **Light**: Sun icon
- **Dark**: Moon icon

### Accessibility

```html
<button 
  aria-label="Toggle theme (current: dark)"
  title="Toggle theme"
>
  <i class="fas fa-moon"></i>
  <span>Dark</span>
</button>
```

## Dark Mode Design

### Color Palette

Dark theme uses deep charcoal instead of pure black:

- **Background**: `#0b0e14` (not `#000000`)
- **Surface**: `#1a1f29`
- **Text Primary**: `#e6e6e6`
- **Text Secondary**: `#9ca3af`

Benefits:
- Reduced eye strain compared to pure black
- Better contrast for UI elements
- More modern aesthetic
- Inspired by Grafana and VS Code

### Neumorphic Effects

Subtle shadows create depth in dark mode:

```css
.agent-card {
  box-shadow: 
    inset 0 1px 2px rgba(0, 0, 0, 0.3),
    0 1px 3px rgba(0, 0, 0, 0.5);
}
```

### Status Indicators

Glowing effect for active agents in dark mode:

```css
.status-pulse {
  box-shadow: 0 0 8px var(--color-success);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
```

## Light Mode Design

### Color Palette

Light theme uses clean whites and subtle grays:

- **Background**: `#ffffff`
- **Surface**: `#f5f5f5`
- **Text Primary**: `#363636`
- **Text Secondary**: `#7a7a7a`

### Shadows

Minimal, subtle shadows:

```css
.agent-card {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

## Responsive Considerations

### Mobile Theme Toggle

On mobile viewports, theme toggle may show icon only (no label):

```typescript
render(): void {
  return `
    <button class="theme-toggle">
      ${this.getIcon(theme)}
      ${!this.isMobile() ? this.getLabel(theme) : ''}
    </button>
  `;
}
```

### Touch Targets

Theme toggle button meets 44px minimum touch target size.

## State Management

### Theme State

```typescript
interface ThemeState {
  preference: ThemePreference;  // 'system', 'light', 'dark'
  effective: 'light' | 'dark';  // Actual theme applied
}
```

### Subscribers

Components can subscribe to theme changes:

```typescript
subscribeToThemeChanges((themeState) => {
  console.log('Theme changed:', themeState.effective);
  // Update component if needed
});
```

### Persistence

Theme preference stored in localStorage:

```typescript
{
  "theme_preference": "dark"
}
```

## Accessibility

### Transitions

Smooth theme transitions with accessibility support:

```css
* {
  transition: 
    background-color 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;
}

/* Disable transitions for reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
```

### ARIA Labels

Theme toggle has descriptive ARIA label:

```html
<button aria-label="Toggle theme (current: dark)">
```

### Keyboard Navigation

Theme toggle is keyboard accessible:

- **Tab**: Focus theme toggle
- **Enter/Space**: Cycle theme

## Testing

### Unit Tests

```typescript
describe('Theme Manager', () => {
  it('initializes with system preference', () => {
    initializeTheme();
    const theme = getThemePreference();
    expect(theme).toBe('system');
  });
  
  it('applies dark theme when system prefers dark', () => {
    mockSystemPreference('dark');
    initializeTheme();
    expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
  });
  
  it('cycles through theme states', () => {
    setTheme('system');
    setTheme(cycleTheme()); // → light
    expect(getThemePreference()).toBe('light');
  });
});
```

### Integration Tests

```typescript
describe('Theme Toggle Component', () => {
  it('changes theme on button click', () => {
    const toggle = new ThemeToggle(element);
    toggle.mount();
    
    const button = element.querySelector('.theme-toggle');
    button.click();
    
    expect(getThemePreference()).not.toBe('system');
  });
});
```

## Performance

### Instant Theme Application

Theme applied synchronously before page render—no flicker or delay.

### Minimal Reflows

CSS custom properties update all themed elements simultaneously without triggering multiple reflows.

### Optimized Transitions

Only animate color properties—no expensive layout thrashing.

## Browser Support

- **CSS Custom Properties**: All modern browsers
- **matchMedia**: All modern browsers
- **classList**: All modern browsers
- **localStorage**: All modern browsers

Graceful degradation: Falls back to light theme if features unavailable.

## Best Practices

1. **Default to system preference**: Respect user's OS choice
2. **Prevent FOUC**: Initialize theme before CSS loads
3. **Use CSS custom properties**: Centralized theme colors
4. **Smooth transitions**: Ease theme changes
5. **Accessibility**: Support reduced motion preference
6. **Persist choice**: Remember manual override
7. **Monitor system changes**: Auto-update when OS theme changes
8. **Test both themes**: Ensure all components look good in light and dark

## Troubleshooting

### Theme Not Persisting

- Check localStorage is enabled
- Verify no errors in console
- Ensure `setTheme()` is called correctly

### Flash of Incorrect Theme

- Verify inline script in `index.html` executes first
- Check theme class is applied to `<html>` element
- Ensure CSS loads after theme initialization

### System Preference Not Detected

- Check browser supports `matchMedia`
- Verify media query syntax: `(prefers-color-scheme: dark)`
- Test in browser developer tools (emulate dark mode)

## Future Enhancements

- **High Contrast Mode**: For accessibility
- **Custom Themes**: User-defined color schemes
- **Auto Dark Mode**: Time-based theme switching
- **Theme Preview**: See theme before applying
