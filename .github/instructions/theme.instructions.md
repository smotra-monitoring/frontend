---
description: "Theme management rules: three-state theme system (system/light/dark), system preference detection, localStorage persistence, color palettes, CSS class application, FOUC prevention. Use when working on theme logic, CSS variables, or the theme toggle component."
applyTo: "public/css/theme-*.css, public/css/variables.css, src/state/theme-manager.ts, src/utils/theme-utils.ts, src/components/theme-toggle.ts, src/types/theme-types.ts"
---

# Theme Management

The application supports **three theme states**: system (default), light, and dark. Theme preference is stored in localStorage and persists across sessions.

## System Preference Detection

By default, the theme follows the user's operating system preference using `window.matchMedia('(prefers-color-scheme: dark)')`. A MediaQueryList listener monitors for system theme changes and updates the UI automatically.

## Manual Override

Users can manually select light or dark mode via a theme toggle button, overriding the system preference. The manual selection is saved to localStorage and takes precedence over system settings.

## Implementation

Theme is applied via CSS classes on the `<html>` element: `theme-light`, `theme-dark`. Theme manager must initialize **synchronously before any DOM rendering** to prevent FOUC (flash of unstyled content).

## Color Palettes

**Dark Theme** (`#0b0e14` background):
- Background: `#0b0e14` (deep charcoal, not pure black)
- Text: High-contrast whites and light grays
- Success: `#48c78e` (Bulma success green)
- Accents: Subtle glowing effects for status indicators
- Shadows: Neumorphic subtle shadows

**Light Theme**:
- Background: Clean whites and very light grays
- Text: Dark grays for readability
- Success: `#48c78e` (consistent across themes)
- Accents: Subtle borders (`#eee`)
- Shadows: Minimal, subtle shadows

## CSS Custom Properties

Define theme-aware properties in `variables.css`:
```css
:root {
  --color-bg: #ffffff;
  --color-text: #363636;
  --color-success: #48c78e;
  --spacing-unit: 4px;
  --border-radius: 12px;
  --touch-target-size: 44px;
}
```

Override in `theme-dark.css` and `theme-light.css` for each theme.

## Storage Strategy

Theme preference stored in localStorage under a dedicated key. On initialization, read localStorage first; if absent, fall back to `prefers-color-scheme`.

## Accessibility

- Theme toggle button must have `aria-label` describing the current theme and the action (e.g., "Switch to dark mode")
- Respect `prefers-reduced-motion: reduce` — disable transition animations when toggling themes
- Ensure sufficient color contrast in both themes (WCAG 2.1 AA)
