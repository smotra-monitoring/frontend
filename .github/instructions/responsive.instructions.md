---
description: "Responsive design strategy, breakpoints, layout philosophy, touch considerations, desktop and mobile specific rules. Use when working on layouts, CSS, viewport logic, or any component that adapts across screen sizes."
applyTo: "public/css/**, src/components/**, src/pages/**, src/state/viewport-state.ts, src/utils/viewport-utils.ts, src/types/viewport-types.ts"
---

# Responsive Design Strategy

The frontend follows a **mobile-first approach** with progressive enhancement for larger screens. Content must be fully functional and visually appealing on all device sizes from 320px mobile phones to 2560px+ ultra-wide desktop monitors.

## Breakpoints

- **Mobile**: < 768px (320px minimum width)
  - Single column layout
  - Stack all content vertically
  - Hamburger navigation menu
  - Bottom navigation bar for primary actions (thumb-friendly)
  - Cards display full-width
  - Tables collapse to card views
  - Command palette full-screen modal

- **Tablet**: 768px – 1023px
  - 2-column Bento-Box grid layout
  - Hamburger navigation or collapsible sidebar
  - Tables can display with horizontal scrolling or card view
  - Command palette as centered overlay modal (larger than mobile)

- **Desktop**: 1024px – 1439px
  - 3–4 column Bento-Box grid layout
  - Fixed 200px sidebar with labels (not icon-only)
  - Full-width tables with all columns visible
  - Command palette as 600px centered modal

- **Desktop Wide**: 1440px – 1919px
  - 4–5 column Bento-Box grid layout
  - Full-width content utilization
  - Enhanced information density

- **Ultra-wide**: 1920px+
  - 5–6+ column Bento-Box grid layout
  - Maximum information density for monitoring
  - No artificial width constraints

## Layout Philosophy

**Desktop content must utilize full screen width** — no narrow centered strips. The dashboard grid uses CSS Grid with `repeat(auto-fit, minmax(300px, 1fr))` to automatically scale column count based on available viewport width. Sidebar is fixed at 200px, main content area fills remaining space: `calc(100vw - 200px)`.

## Touch Considerations

- Minimum **44px touch targets** for all interactive elements on mobile/tablet
- Adequate spacing between touch targets (minimum 8px)
- Thumb-friendly zones: bottom 1/3 of mobile screen for primary actions
- Swipe gestures with keyboard/button fallbacks for accessibility

## Smooth Scroll

Apply `scroll-behavior: smooth;` to the root HTML element for enhanced navigation. Respect `prefers-reduced-motion: reduce` media query to disable smooth scrolling for users who prefer reduced motion.

# Desktop Considerations

Desktop layouts (1024px+) must **utilize full screen width** for maximum information density.

## Full-Width Layouts

- **NO** max-width constraints on main content areas
- Dashboard grid expands to fill available width (3–6 columns)
- Sidebar fixed at 200px, main content uses remaining space
- Tables display all columns without horizontal scrolling
- Command palette 600px width (larger than mobile's full-screen)

## Multi-Column Grids

- 1024px–1439px: 3–4 columns
- 1440px–1919px: 4–5 columns
- 1920px+: 5–6+ columns
- Automatically scales via CSS Grid auto-fit

## Keyboard Shortcuts

- **Cmd+K / Ctrl+K**: Open command palette
- **Escape**: Close modals
- **Tab / Shift+Tab**: Navigate focusable elements
- **Arrow keys**: Navigate lists
- **Enter**: Activate focused element

## Hover States

Hover is an enhancement on desktop, not a requirement. All interactions must work without hover (for touch support).

# Mobile Considerations

Mobile layouts (< 768px) prioritize **thumb-friendly interactions** and efficient use of limited screen space.

## Touch Targets

- **Minimum 44px × 44px** for all buttons, links, form controls
- Adequate spacing between targets (8px minimum)
- Bottom navigation bar in thumb zone
- Swipe gestures for sidebar (with button fallback)

## Thumb Zones

Primary actions placed in bottom 1/3 of screen where thumbs naturally rest:
- Bottom navigation for mobile
- Toast notifications at bottom (not top)
- Important buttons near bottom

## Network Resilience

- WebSocket auto-reconnect on network change (WiFi ↔ cellular)
- Offline state indication
- Retry logic for failed API calls
- Loading states for all async operations

## Mobile Browser Considerations

- Handle OAuth redirects correctly in mobile browsers
- Test on iOS Safari and Android Chrome
- Account for browser chrome reducing viewport height
- Use `100vh` carefully (consider `100dvh` for dynamic viewport height)

## Performance on Mobile

- Lazy load agent cards as user scrolls
- CSS containment for smooth scrolling
- Debounce scroll/resize event handlers
- Minimize JavaScript bundle size
- Optimize images
