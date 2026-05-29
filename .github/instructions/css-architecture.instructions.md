---
description: "CSS architecture rules: file organization, custom properties, grid system, media queries, Bulma integration, BEM-lite naming, performance. Use when writing or editing any CSS file."
applyTo: "public/css/**"
---

# CSS Architecture

CSS follows a **mobile-first approach** with no CSS-in-JS. All styling is in plain CSS files in `public/css/`.

## File Organization

Load CSS files in this order: base → variables → themes → layout → components → animations → utilities.

1. **base.css**: Root HTML styles, including `scroll-behavior: smooth`, box-sizing reset, font smoothing
2. **variables.css**: CSS custom properties for colors, spacing, typography, breakpoints
3. **theme-dark.css**: Dark theme color overrides
4. **theme-light.css**: Light theme color overrides
5. **layout.css**: Grid systems, flexbox layouts, sidebar, responsive structure
6. **components.css**: Component-specific styles with mobile-first media queries
7. **animations.css**: Keyframes (pulse, transitions) with `prefers-reduced-motion` support
8. **utilities.css**: Helper classes (`.hide-mobile`, `.full-width`, etc.)

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

Override in theme files for dark mode.

## Grid System

Use **CSS Grid with auto-fit** for Bento-Box dashboard:
```css
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}
```

This automatically scales from 1 column (mobile) to 6+ columns (ultra-wide) without media queries.

## Media Queries

Mobile-first means: base styles for mobile, add complexity at larger breakpoints:
```css
/* Mobile base */
.sidebar { display: none; }

/* Tablet and up */
@media (min-width: 768px) {
  .sidebar { display: block; }
}
```

## Integration with Bulma

Extend Bulma's base styles with custom CSS:
- Use Bulma's `.box`, `.button`, `.notification` classes
- Override with custom border-radius (12px), colors, spacing
- Use Bulma's responsive mixins where applicable
- Maintain Bulma's semantic class names

## Naming Convention (BEM-lite)

Use **BEM-lite** for clarity:
- `.agent-card` (block)
- `.agent-card__status` (element)
- `.agent-card--offline` (modifier)

Avoid deep nesting; keep specificity low.

## Performance

- Use `contain: layout style` on cards for better scroll performance
- Avoid expensive properties in animations (use only `transform`/`opacity`)
- Use `will-change` sparingly and only when needed
