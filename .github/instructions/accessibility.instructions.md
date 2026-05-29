---
description: "Accessibility requirements: WCAG 2.1 AA, keyboard navigation, touch navigation, ARIA labels, reduced motion support, screen reader support. Use when building any interactive UI element, component, or page."
applyTo: "src/components/**, src/pages/**, public/**"
---

# Accessibility

The application must meet **WCAG 2.1 AA standards** for accessibility.

## Keyboard Navigation

- All interactive elements accessible via Tab key
- Enter/Space to activate buttons and links
- Escape to close modals and cancel actions
- **Cmd+K (or Ctrl+K)** to open command palette
- Arrow keys for navigation within lists and grids
- Focus indicators visible and high-contrast

## Touch Navigation

- All touch targets minimum 44px × 44px
- Adequate spacing between touch targets (minimum 8px)
- No hover-only interactions (hover is enhancement only)
- Swipe gestures have keyboard/button alternatives

## ARIA Labels

- Status indicators have `aria-label` describing state
- Loading states announced with `aria-live` regions
- Toast notifications announced to screen readers
- Expandable table rows have `aria-expanded` attributes
- Theme toggle button has `aria-label` describing current theme

## Reduced Motion

Respect `prefers-reduced-motion: reduce` media query:
- Disable smooth scroll
- Disable pulse animations
- Use instant transitions instead of animated ones
- Maintain functionality while reducing motion

## Screen Reader Support

- Semantic HTML5 structure (`<main>`, `<nav>`, `<section>`, `<article>`)
- Descriptive alt text for status indicators and icons
- Skip links for keyboard users
- Proper heading hierarchy (h1 → h2 → h3)
