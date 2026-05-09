# UI Design System

This document describes the visual design patterns, component library, and responsive strategies used in the Smotra frontend.

## Design Philosophy

The Smotra UI follows these core principles:

1. **Simplicity**: Clean, uncluttered interfaces focused on essential information
2. **Clarity**: Information hierarchy that guides the eye naturally
3. **Performance**: Smooth animations and responsive interactions
4. **Accessibility**: WCAG 2.1 AA compliance for all users
5. **Responsiveness**: Seamless experience from 320px mobile to 2560px+ ultra-wide

## Design Inspiration

### Linear.app
- High-performance keyboard-centric design
- Clean typography and spacing
- Subtle animations that enhance rather than distract

### Better Stack
- Clear uptime dashboard visualization
- Effective use of status indicators
- Information density without clutter

### Tailscale
- Clean node/agent management UI
- Excellent use of white space
- Card-based layouts

### Vercel/Cloudflare
- Bento-box layouts for organizing metrics
- Responsive grid systems
- Modern color palettes

### Grafana
- Dark mode optimized for monitoring
- Chart and graph visualization
- Real-time data presentation

## The Bento-Box Dashboard

### Concept

"Bento-Box" layouts group related metrics into discrete, rounded cards, preventing data fatigue:

```css
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}
```

### Benefits

- **Visual Organization**: Each card represents one agent or metric group
- **Scannable**: Admin's eye knows exactly where to look
- **Scalable**: Automatically adjusts from 1-6+ columns
- **Modern**: Rounded corners (12px) and subtle shadows

### Agent Card Anatomy

```
┌─────────────────────────────────┐
│ ● Agent Name              [▼]   │ ← Status pulse + toggle
├─────────────────────────────────┤
│ Latency: 45ms                   │ ← Primary metrics
│ Uptime: 12d 4h                  │
│ Last Seen: 2m ago               │
├─────────────────────────────────┤
│ ID: abc-123                     │ ← Expandable details
│ Hostname: server-01             │
│ IP: 192.168.1.100               │
└─────────────────────────────────┘
```

### Responsive Behavior

- **Mobile** (< 768px): 1 column, full-width cards
- **Tablet** (768-1023px): 2 columns
- **Desktop** (1024-1439px): 3-4 columns
- **Wide** (1440-1919px): 4-5 columns
- **Ultra-wide** (1920px+): 5-6+ columns

## Status Pulse Indicators

### Visual Design

```css
.status-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-success);
  box-shadow: 0 0 0 rgba(72, 199, 142, 0.4);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(72, 199, 142, 0.4);
  }
  50% {
    opacity: 0.7;
    box-shadow: 0 0 0 10px rgba(72, 199, 142, 0);
  }
}
```

### Status Colors

- **Online** (`#48c78e`): Green, pulsing
- **Offline** (`#f14668`): Red, static
- **Warning** (`#ffe08a`): Yellow, pulsing
- **Error** (`#f14668`): Red, rapid pulse
- **Unknown** (`#7a7a7a`): Gray, static

### Accessibility

```html
<span 
  class="status-pulse status-pulse--online"
  role="img"
  aria-label="Online - Agent is reachable"
  title="Online - Agent is reachable"
></span>
```

## Expandable Tables

### Concept

Keep main table hyper-simple, use chevron to expand rows for technical details:

```
[ Name         ] [ Status ] [ Latency ] [▼]
[ agent-01     ] [ ● Online] [ 45ms   ] [▼]
  ├ Hostname: server-01
  ├ IP: 192.168.1.100
  └ Version: 1.2.3
```

### Responsive Strategy

- **Desktop**: Full table with expandable rows
- **Mobile/Tablet**: Card view with collapsible sections

### Implementation

```typescript
<li class="agent-card__item ${expanded ? 'agent-card__item--expanded' : ''}">
  <button 
    aria-expanded="${expanded}"
    aria-label="Toggle details"
  >
    <i class="fas fa-chevron-${expanded ? 'up' : 'down'}"></i>
  </button>
</li>
```

## Command Palette (Cmd+K)

### Design

```
┌─────────────────────────────────────┐
│ 🔍 Search agents or actions...   ✕ │
├─────────────────────────────────────┤
│ 🖥  agent-01 · server-01.local      │ ← Selected
│ 🖥  agent-02 · server-02.local      │
│ ⚡ Add new agent                    │
│ ⚡ View logs                        │
└─────────────────────────────────────┘
  ↑↓ Navigate  ↵ Select  Esc Close
```

### Responsive Behavior

- **Mobile**: Full-screen modal
- **Tablet**: Centered 80% width overlay
- **Desktop**: 600px centered modal

### Fuzzy Search

Search across agent names, hostnames, IP addresses, and actions:

```typescript
const lowerQuery = query.toLowerCase();
const results = agents.filter(agent =>
  agent.name.toLowerCase().includes(lowerQuery) ||
  agent.hostname?.toLowerCase().includes(lowerQuery) ||
  agent.ipAddress?.toLowerCase().includes(lowerQuery)
);
```

### Keyboard Shortcuts

- **Cmd+K / Ctrl+K**: Open palette
- **↑ / ↓**: Navigate results
- **Enter**: Select result
- **Escape**: Close palette

## Toast Notifications

### Placement

- **Desktop**: Bottom-right corner (out of the way)
- **Mobile**: Bottom center (thumb-friendly zone)

### Types

```typescript
toast.success('Agent connected successfully');
toast.error('Failed to reach agent');
toast.warning('Agent latency high');
toast.info('New agent detected');
```

### Auto-Dismiss

- **Success**: 5 seconds
- **Info**: 5 seconds
- **Warning**: 5 seconds
- **Error**: Manual dismiss only (critical info)

### Animation

```css
.toast {
  animation: slide-in 0.3s ease;
}

.toast--exiting {
  animation: slide-out 0.3s ease;
}

@keyframes slide-in {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

## Sidebar Navigation

### Desktop (1024px+)

- Fixed 200px width
- Always visible
- Icon + label for each nav item
- User info at bottom

### Tablet (768-1023px)

- Hamburger menu
- Overlay sidebar on open
- Backdrop overlay
- Swipe to close

### Mobile (< 768px)

- Hamburger menu in header
- Full-screen overlay sidebar
- Bottom navigation bar for primary actions
- Thumb-friendly zone

### Layout

```css
.sidebar {
  width: 200px;
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
}

.dashboard__main {
  margin-left: 200px; /* Desktop */
  margin-left: 0;     /* Mobile/Tablet */
}
```

## Typography

### Font Stack

System fonts for performance and native feel:

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
             Oxygen, Ubuntu, Cantarell, sans-serif;
```

### Fluid Sizing

Responsive typography using `clamp()`:

```css
/* Base text */
font-size: clamp(14px, 2vw, 16px);

/* Headings */
h1 { font-size: clamp(24px, 4vw, 32px); }
h2 { font-size: clamp(20px, 3vw, 24px); }
h3 { font-size: clamp(16px, 2.5vw, 20px); }
```

### Line Height

- Body text: `1.5`
- Headings: `1.2`
- Code: `1.4`

## Color System

### CSS Custom Properties

All colors defined as CSS custom properties for easy theming:

```css
:root {
  /* Brand */
  --color-primary: #3e8ed0;
  
  /* Semantic */
  --color-success: #48c78e;
  --color-warning: #ffe08a;
  --color-error: #f14668;
  --color-info: #3e8ed0;
  
  /* Neutrals */
  --color-bg: #ffffff;
  --color-surface: #f5f5f5;
  --color-border: #dbdbdb;
  --color-text: #363636;
  --color-text-muted: #7a7a7a;
}
```

### Dark Theme

```css
html.theme-dark {
  --color-bg: #0b0e14;
  --color-surface: #1a1f29;
  --color-border: #2a2f39;
  --color-text: #e6e6e6;
  --color-text-muted: #9ca3af;
}
```

## Spacing Scale

Based on 4px unit (0.25rem):

```css
--spacing-xs: 0.25rem;  /* 4px */
--spacing-sm: 0.5rem;   /* 8px */
--spacing-md: 0.75rem;  /* 12px */
--spacing-lg: 1rem;     /* 16px */
--spacing-xl: 1.5rem;   /* 24px */
--spacing-2xl: 2rem;    /* 32px */
--spacing-3xl: 3rem;    /* 48px */
```

## Border Radius

```css
--radius-sm: 6px;   /* Buttons, inputs */
--radius-md: 12px;  /* Cards, boxes */
--radius-lg: 16px;  /* Modals */
--radius-full: 50%; /* Status indicators */
```

## Shadows

### Light Theme

```css
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
```

### Dark Theme (Neumorphic)

```css
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.5);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.5);
--shadow-inset: inset 0 1px 2px rgba(0, 0, 0, 0.3);
```

## Touch Targets

All interactive elements meet minimum touch target sizes:

```css
.button, .link, .input {
  min-width: 44px;
  min-height: 44px;
  padding: 0.75rem 1.5rem;
}
```

### Spacing Between Targets

Minimum 8px gap between touch targets:

```css
.button-group > * + * {
  margin-left: 0.5rem; /* 8px */
}
```

## Animations

### Principles

- Use sparingly—enhance, don't distract
- Respect `prefers-reduced-motion`
- Only animate `transform` and `opacity` for performance

### Duration

```css
--duration-fast: 0.15s;
--duration-normal: 0.3s;
--duration-slow: 0.5s;
```

### Easing

```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Responsive Breakpoints

```css
/* Mobile first approach */
@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1440px) { /* Wide */ }
@media (min-width: 1920px) { /* Ultra-wide */ }
```

## Layout Strategy

### Full-Width Philosophy

Desktop content must utilize full screen width—NO artificial max-width constraints:

```css
/* ❌ Bad: Artificially constraining content */
.dashboard__main {
  max-width: 1200px;
  margin: 0 auto;
}

/* ✅ Good: Full-width utilization */
.dashboard__main {
  width: 100%;
  padding: 1.5rem;
}
```

### CSS Grid Auto-Fit

Responsive grid that automatically scales columns:

```css
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}
```

This creates:
- 1 column on 320px mobile
- 2 columns on 768px tablet
- 3-4 columns on 1280px desktop
- 5-6+ columns on 1920px ultra-wide

## Accessibility

### Focus Indicators

Visible focus indicators for keyboard navigation:

```css
:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

:focus:not(:focus-visible) {
  outline: none;
}
```

### ARIA Labels

All interactive elements have descriptive ARIA labels:

```html
<button aria-label="Close notification">
  <i class="fas fa-times"></i>
</button>
```

### Semantic HTML

Use semantic HTML5 elements:

```html
<main>
  <nav>
  <section>
  <article>
  <aside>
</main>
```

## Component Library

### Agent Card

- Status pulse indicator
- Primary metrics display
- Expandable details section
- WebSocket real-time updates

### Dashboard Grid

- Auto-fit responsive grid
- Lazy loading with Intersection Observer
- Optimal column calculation

### Command Palette

- Fuzzy search
- Keyboard navigation
- Result highlighting

### Theme Toggle

- Three-state switcher
- Icon indicates current mode
- Smooth transitions

### Sidebar

- Responsive (fixed desktop, overlay mobile)
- User info display
- Active route highlighting

### Toast Notifications

- Multiple types (success, error, warning, info)
- Auto-dismiss with timers
- Stacking support

### Status Indicator

- Pulsing animation
- Color-coded status
- ARIA labels

## Performance Optimizations

### CSS Containment

Improve scroll performance:

```css
.agent-card {
  contain: layout style;
}
```

### Will-Change

For animated elements:

```css
.status-pulse {
  will-change: transform, opacity;
}
```

### Lazy Loading

Load agent cards as user scrolls:

```typescript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadAgentCard(entry.target);
    }
  });
});
```

## Testing

Components should be tested for:

- Visual appearance at all breakpoints
- Keyboard navigation
- Screen reader compatibility
- Reduced motion preference
- Touch interactions (44px targets)
- Theme switching
- Real-time updates

## Best Practices

1. **Mobile-first CSS**: Start with mobile styles, add complexity at larger breakpoints
2. **Use CSS Grid**: Modern, powerful, responsive
3. **Semantic HTML**: Better accessibility and SEO
4. **Minimal JavaScript**: CSS for styling, JS for behavior
5. **Performance**: Contain layouts, lazy load, optimize animations
6. **Accessibility**: WCAG 2.1 AA compliance
7. **Consistency**: Use design tokens (CSS custom properties)
8. **Test**: All breakpoints, themes, and accessibility features

## Design Checklist

- [ ] Component works at all breakpoints (375px to 2560px)
- [ ] Touch targets are 44px minimum
- [ ] Keyboard navigation supported
- [ ] ARIA labels present
- [ ] Reduced motion respected
- [ ] Works in light and dark themes
- [ ] Semantic HTML used
- [ ] Focus indicators visible
- [ ] Performance optimized
- [ ] Tested with screen reader
