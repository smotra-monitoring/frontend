# Project description

This project is a distributed monitoring system designed to track reachability and performance of agents installed on various hosts. It consists of a central server that collects data from multiple agents deployed across different machines. The system provides real-time monitoring, alerting, and reporting capabilities to ensure the health and performance of the monitored infrastructure.

# Repository Purpose

The repository serves as the GUI frontend for the monitoring system, providing a user-friendly interface for administrators to visualize data, configure agents, and manage alerts. It is built using vanilla TypeScript and styled with Bulma CSS framework to ensure a responsive and modern design. The frontend communicates with the backend server via RESTful APIs and WebSocket for real-time updates, allowing users to monitor their infrastructure effectively.

# Design Principles

- **Single Page Application (SPA)**: The frontend is designed as a single-page application to provide a seamless user experience without the need for page reloads.
- **Simplicity**: The system is designed to be straightforward and easy to use, with a focus on essential features that provide value to users without unnecessary complexity.
- **Modularity**: The architecture is modular, allowing for easy maintenance and extensibility. New features can be added without affecting existing functionality.
- **Performance**: The system is optimized for performance, ensuring that it can handle a large number of agents and hosts without significant degradation in responsiveness.
- **Security**: The system incorporates security best practices to protect sensitive data and ensure secure communication between the frontend and backend components.
- **Responsive Design**: Mobile-first approach with progressive enhancement. Efficient space utilization on desktop (NO narrow centered layouts). Fluid full-width layouts that adapt from mobile to ultra-wide displays. Smooth scrolling for enhanced navigation.
- **Accessibility**: WCAG 2.1 AA compliance with support for keyboard navigation, touch interactions, screen readers, and user preferences (reduced motion, high contrast).
- **Design Inspiration**: Modern monitoring aesthetics inspired by Linear.app (clean, keyboard-centric), Better Stack (uptime dashboards), Tailscale (node management), Vercel/Cloudflare (Bento layouts), and Grafana (dark mode, charts).

# Non-Negotiable Rules

## Feature Completeness

A feature is **not complete** until all of the following exist and pass:
- Unit tests covering all new functions, classes, utilities, and components (`tests/unit/`)
- At least one integration test covering the primary end-to-end flow (`tests/integration/`)
- A `docs/features/<feature-name>.md` documentation file
- A `CHANGELOG.md` entry under `[Unreleased]`
- Updated `docs/README.md` linking the new feature doc

## Bug Fix Requirements

A bug fix is **not complete** until:
- A regression test (unit or integration) that reproduces the bug and confirms it is fixed
- A `CHANGELOG.md` entry under `[Unreleased]` describing what was fixed and the root cause

## Core Design Rules

- **Mobile-first**: Base styles for mobile, enhance at larger breakpoints. NO max-width constraints on desktop.
- **Full-width on desktop**: Sidebar fixed at 200px, main content uses `calc(100vw - 200px)`.
- **Accessibility**: WCAG 2.1 AA — all touch targets 44px+, ARIA labels on all interactive elements, respect `prefers-reduced-motion`.
- **No CSS-in-JS**: All styles in `public/css/` plain CSS files.
- **No raw fetch**: All API calls via the generated OpenAPI client (`src/api/`). Never manually edit `*.gen.ts` files.
- **TypeScript classes**: Components are classes extending `BaseComponent`, not functions.
- **PKCE required**: All OAuth flows must use PKCE. No tokens in URL query parameters.

## Detailed Instructions Index

Detailed rules are in `.github/instructions/` with `applyTo` targeting:

| File | Applies To |
|------|-----------|
| `project-overview.instructions.md` | `**` (always) |
| `ui-design.instructions.md` | `src/components/**, src/pages/**, public/css/**` |
| `responsive.instructions.md` | CSS, components, viewport utils |
| `theme.instructions.md` | Theme CSS, theme-manager, theme-toggle |
| `accessibility.instructions.md` | `src/components/**, src/pages/**, public/**` |
| `html-structure.instructions.md` | `public/index.html, src/pages/**` |
| `css-architecture.instructions.md` | `public/css/**` |
| `components.instructions.md` | `src/components/**, src/pages/**` |
| `auth.instructions.md` | `src/auth/**, src/pages/login.ts, oauth-callback.ts` |
| `api.instructions.md` | `src/api/**, api/**` |
| `typescript.instructions.md` | `src/**/*.ts, tsconfig*.json` |
| `testing.instructions.md` | `tests/**, vitest.config.js` |
| `documentation.instructions.md` | `docs/**, CHANGELOG.md` |
| `performance.instructions.md` | `src/**, public/**` |

# Visualization

The frontend provides a dashboard that visualizes the collected data in an intuitive manner. Key performance metrics such as reachability and response time are displayed using charts and graphs, allowing administrators to quickly assess the health of their infrastructure. The dashboard also includes features for filtering and sorting data, as well as detailed views for individual agents and hosts.

Visually site should be simple, clean and modern with a focus on usability and clarity. The use of Bulma CSS framework ensures that the design is responsive and works well across different devices and screen sizes.

**Motion:** Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states.

**Backgrounds & Visual Details:** Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, layered transparencies, smooth shadows.

## The "Bento-Box" Dashboard

For a monitoring system, "Bento" layouts are king. Instead of a long list of agents, group them into rounded, distinct cards.

- **The UX Win:** It prevents "Data Fatigue." By boxing metrics (CPU, latency, reachability) into discrete tiles, the admin's eye knows exactly where to look.
- **Implementation Tip:** Use Bulma’s .box class but add a custom `border-radius: 12px;` and a very subtle `border: 1px solid #eee;` instead of heavy shadows.
- **Inspiration:** Vercel’s Dashboard or Cloudflare. They handle massive amounts of data without feeling cluttered.

## Status "Pulse" Indicators

Since you are tracking reachability via WebSockets, use motion to indicate health rather than just a static green dot.

- **The UX Win:** A "pulsing" animation on an active agent feels "live" and reassures the user that the WebSocket is actually connected.
- **Implementation Tip:** 
```css
.status-pulse {
  width: 8px;
  height: 8px;
  background: #48c78e; /* Bulma Success */
  border-radius: 50%;
  box-shadow: 0 0 0 rgba(72, 199, 142, 0.4);
  animation: pulse 2s infinite;
}
```

## Neumorphic "Command Center" (Dark Mode)

Infrastructure tools are often used in "NOC" (Network Operations Center) environments. A refined Dark Mode is essential.

- **The Look:** Use deep charcoal backgrounds (`#0b0e14`) instead of pure black. Use Bulma's `$dark` variables to create high-contrast text for metrics.
- **Inspiration:** Grafana 11+ or Chronosphere. They use "glowing" lines for sparkline charts that look incredible against dark backgrounds.

## Modern Table UX: "The Expandable Row"

Monitoring systems often have too many columns (IP, OS, Version, Latency, Last Seen).
- **The UX Win:** Keep the main table hyper-simple (Name, Status, Primary Metric). Use a "Chevron" to expand the row for the technical details. This maintains the "clean" look you want.
- **Inspiration:** Stripe’s Dashboard. They are the masters of the "clean but data-heavy" table.

Recommended Layout Structure for your SPA

Component,UI Strategy,Bulma Tip
Sidebar,"Slim, icon-only until hover.",Use `.is-narrow` on a side column.
Global Search,"A ""Command Palette"" (Cmd+K).",Use a Modal with a single clean input field.
Charts,"Sparklines (small, no axes).",Keep these inside your Bento boxes.
Alerts,"""Toast"" notifications (top-right).",Use Bulma's `.notification` with fixed positioning.

## Visual Style Reference: "The Monitoring Aesthetic"

- Linear.app: High-performance, keyboard-centric, and arguably the cleanest UI in tech right now.
- Better Stack: This is exactly what you are building. Look at their "Uptime" dashboards for how they visualize agent reachability.
- Tailscale: Notice how they manage a list of "Nodes" (agents). It is incredibly clean and utilizes white space perfectly.

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

- **Tablet**: 768px - 1023px
  - 2-column Bento-Box grid layout
  - Hamburger navigation or collapsible sidebar
  - Tables can display with horizontal scrolling or card view
  - Command palette as centered overlaymodal (larger than mobile)

- **Desktop**: 1024px - 1439px
  - 3-4 column Bento-Box grid layout
  - Fixed 200px sidebar with labels (not icon-only)
  - Full-width tables with all columns visible
  - Command palette as 600px centered modal

- **Desktop Wide**: 1440px - 1919px
  - 4-5 column Bento-Box grid layout
  - Full-width content utilization
  - Enhanced information density

- **Ultra-wide**: 1920px+
  - 5-6+ column Bento-Box grid layout
  - Maximum information density for monitoring
  - No artificial width constraints

## Layout Philosophy

**Desktop content must utilize full screen width** - no narrow centered strips. The dashboard grid uses CSS Grid with `repeat(auto-fit, minmax(300px, 1fr))` to automatically scale column count based on available viewport width. Sidebar is fixed at 200px, main content area fills remaining space: `calc(100vw - 200px)`.

## Touch Considerations

- Minimum **44px touch targets** for all interactive elements on mobile/tablet
- Adequate spacing between touch targets (minimum 8px)
- Thumb-friendly zones: bottom 1/3 of mobile screen for primary actions
- Swipe gestures with keyboard/button fallbacks for accessibility

## Smooth Scroll

Apply `scroll-behavior: smooth;` to the root HTML element for enhanced navigation. Respect `prefers-reduced-motion: reduce` media query to disable smooth scrolling for users who prefer reduced motion.

# Theme Management

The application supports **three theme states**: system (default), light, and dark. Theme preference is stored in localStorage and persists across sessions.

## System Preference Detection

By default, the theme follows the user's operating system preference using `window.matchMedia('(prefers-color-scheme: dark)')`. A MediaQueryList listener monitors for system theme changes and updates the UI automatically.

## Manual Override

Users can manually select light or dark mode via a theme toggle button, overriding the system preference. The manual selection is saved to localStorage and takes precedence over system settings.

## Implementation

Theme is applied via CSS classes on the `<html>` element: `theme-light`, `theme-dark`. Theme manager must initialize **synchronously before any DOM rendering** to prevent FOUC (flash of unstyled content).

## Color Palettes

**Dark Theme** (#0b0e14 background):
- Background: #0b0e14 (deep charcoal, not pure black)
- Text: High-contrast whites and light grays
- Success: #48c78e (Bulma success green)
- Accents: Subtle glowing effects for status indicators
- Shadows: Neumorphic subtle shadows

**Light Theme**:
- Background: Clean whites and very light grays
- Text: Dark grays for readability
- Success: #48c78e (consistent across themes)
- Accents: Subtle borders (#eee)
- Shadows: Minimal, subtle shadows

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
- Adequate spacing between touch targets
- No hover-only interactions (hover is enhancement only)
- Swipe gestures have keyboard/button alternatives

## ARIA Labels

- Status indicators have aria-labels describing state
- Loading states announced with aria-live regions
- Toast notifications announced to screen readers
- Expandable table rows have aria-expanded attributes
- Theme toggle button has aria-label describing current theme

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

# HTML Structure

The application uses a **semantic HTML5** structure within a single-page application architecture.

## Root HTML Shell

`public/index.html` serves as the SPA shell:
- Viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1">`
- Theme initialization script **inline** (before CSS loads) to prevent FOUC
- CSS files loaded in order: base → variables → themes → layout → components → animations → utilities
- Main application container: `<div id="app"></div>`
- TypeScript bundle loaded with `defer` attribute

## Semantic Structure

Components generate semantic HTML:
- `<main>` for primary content area
- `<nav>` for navigation sidebar/header
- `<section>` for dashboard regions
- `<article>` for individual agent cards (Bento boxes)
- `<table>` for tabular data (with responsive card fallback)
- `<form>` for login and search inputs
- `<button>` for all interactive actions (not `<div>` with click handlers)

## No Constraining Wrappers

Avoid nested container divs that artificially limit content width. Exception: login page can have centered constrained card for better UX.

# CSS Architecture

CSS follows a **mobile-first approach** with no CSS-in-JS. All styling is in plain CSS files in `public/css/`.

## File Organization

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

## Naming Convention

Use **BEM-lite** for clarity:
- `.agent-card` (block)
- `.agent-card__status` (element)
- `.agent-card--offline` (modifier)

Avoid deep nesting; keep specificity low.

## Performance

- Use `contain: layout style` on cards for better scroll performance
- Avoid expensive properties in animations (use only transform/opacity)
- Use `will-change` sparingly and only when needed

# Component Architecture

Components are implemented as **TypeScript classes** (not functions) inheriting from a base component class. This provides encapsulation, lifecycle management, and state handling without a framework.

## Base Component Pattern

```typescript
abstract class BaseComponent {
  protected root: HTMLElement;
  protected state: any;
  
  constructor(root: HTMLElement) {
    this.root = root;
  }
  
  abstract render(): void;
  
  onMount?(): void;
  onUpdate?(prevState: any): void;
  onDestroy?(): void;
  
  setState(newState: Partial<any>): void {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...newState };
    this.render();
    this.onUpdate?.(prevState);
  }
}
```

## Viewport-Aware Rendering

Components can access current viewport state (mobile/tablet/desktop/wide/ultrawide) to make intelligent rendering decisions. Use ResizeObserver to react to viewport changes.

## WebSocket Integration

Dashboard components subscribe to WebSocket events for real-time updates. Components update their DOM efficiently using targeted element updates rather than full re-renders.

## Event Handling

Components manage their own event listeners:
- Add listeners in `onMount()`
- Remove listeners in `onDestroy()` to prevent memory leaks
- Use event delegation where appropriate

## Example: Agent Card Component

```typescript
class AgentCard extends BaseComponent {
  private agent: Agent;
  
  render(): void {
    this.root.innerHTML = `
      <article class="agent-card">
        <div class="agent-card__status">
          <span class="status-pulse status-pulse--${this.agent.status}"></span>
          <span>${this.agent.name}</span>
        </div>
        <div class="agent-card__metrics">
          <span>Latency: ${this.agent.latency}ms</span>
        </div>
      </article>
    `;
  }
  
  onMount(): void {
    // Subscribe to WebSocket updates for this agent
    websocket.on(`agent:${this.agent.id}`, (data) => {
      this.setState({ agent: { ...this.agent, ...data } });
    });
  }
}
```

# Authentication

Authentication is implemented using **OAuth2 with PKCE** (Proof Key for Code Exchange) for enhanced security. The application supports multiple OAuth providers: Okta, Auth0, Azure AD, Google, and generic OIDC.

## OAuth2 Flow

1. User clicks login
2. Generate PKCE code_verifier and code_challenge
3. Generate random state parameter (CSRF protection)
4. Redirect to OAuth provider with client_id, redirect_uri, code_challenge, state
5. Provider authenticates user and redirects back with authorization code
6. Exchange code for access_token and refresh_token using code_verifier
7. Store tokens in localStorage
8. Use access_token for API requests

## Token Management

- **Access tokens** stored in localStorage with expiration timestamp
- **Refresh tokens** stored in localStorage (secure contexts only)
- Automatic token refresh before expiration
- Token revocation on logout
- 401 responses trigger token refresh attempt, then re-login if refresh fails

## Storage Strategy

Using **localStorage** for token persistence across sessions (as requested):
```typescript
{
  "auth": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_at": 1234567890,
    "user_info": { ... }
  }
}
```

## Security Considerations

- PKCE required for all OAuth flows
- State parameter validates to prevent CSRF
- Tokens only sent over HTTPS
- XSS protection via CSP headers
- No tokens in URL query parameters

For detailed OAuth implementation, see `docs/features/oauth-authentication.md`.

# Desktop Considerations

Desktop layouts (1024px+) must **utilize full screen width** for maximum information density.

## Full-Width Layouts

- **NO** max-width constraints on main content areas
- Dashboard grid expands to fill available width (3-6 columns)
- Sidebar fixed at 200px, main content uses remaining space
- Tables display all columns without horizontal scrolling
- Command palette 600px width (larger than mobile's full-screen)

## Multi-Column Grids

- 1024px-1439px: 3-4 columns
- 1440px-1919px: 4-5 columns
- 1920px+: 5-6+ columns
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

# Visual Design Specification

## Typography

- **Font Stack**: System fonts for performance and native feel
  - `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif`
- **Fluid Sizing**: Use `clamp()` for responsive typography
  - Base: `clamp(14px, 2vw, 16px)`
  - Headings: Scale appropriately for each breakpoint
- **Line Height**: 1.5 for body text, 1.2 for headings
- **Readability**: Maximum 75 characters per line for body text

## Color Palette

Defined in CSS custom properties for easy theming.

**Dark Theme**:
- Background: `#0b0e14`
- Surface: `#1a1f29`
- Text primary: `#e6e6e6`
- Text secondary: `#9ca3af`
- Success: `#48c78e`
- Warning: `#ffe08a`
- Error: `#f14668`
- Info: `#3e8ed0`

**Light Theme**:
- Background: `#ffffff`
- Surface: `#f5f5f5`
- Text primary: `#363636`
- Text secondary: `#7a7a7a`
- Success: `#48c78e`
- Warning: `#ffe08a`
- Error: `#f14668`
- Info: `#3e8ed0`

## Spacing Scale

Based on 4px unit:
- 0.25rem (4px)
- 0.5rem (8px)
- 0.75rem (12px)
- 1rem (16px)
- 1.5rem (24px)
- 2rem (32px)
- 3rem (48px)

## Border Radius

- Cards/Boxes: 12px
- Buttons: 6px
- Inputs: 6px
- Status indicators: 50% (circular)

## Shadows

**Light Theme**:
- Subtle: `0 1px 3px rgba(0, 0, 0, 0.1)`
- Medium: `0 4px 6px rgba(0, 0, 0, 0.1)`

**Dark Theme** (Neumorphic):
- Subtle: `0 1px 3px rgba(0, 0, 0, 0.5)`
- Inset for depth: `inset 0 1px 2px rgba(0, 0, 0, 0.3)`

## Touch Target Sizes

- Minimum: 44px × 44px
- Comfortable: 48px × 48px
- Large primary actions: 56px × 56px

# Performance

## Mobile-First Budget

- First Contentful Paint: < 1.5s on 3G
- Time to Interactive: < 3.5s on 3G
- Lighthouse Performance Score: 90+ on mobile
- Bundle size: < 200KB gzipped for main bundle

## Optimization Techniques

- **Code Splitting**: Route-based splitting (login, dashboard, settings)
- **Lazy Loading**: Load agent cards on scroll (Intersection Observer)
- **CSS Containment**: `contain: layout style` on agent cards
- **Image Optimization**: WebP format with PNG fallback, responsive images with `srcset`
- **WebSocket Efficiency**: Delta updates only (not full state), debounce rapid updates
- **Efficient Rendering**: Update only changed DOM elements, not full re-renders

## Desktop Performance

- 60fps scrolling with 5-6 column grid
- Smooth animations (transform/opacity only)
- Efficient WebSocket handling for hundreds of agents
- Virtualization for large lists (if > 1000 agents)

# Key Features

- **Agent-Based Monitoring**: Lightweight agents installed on hosts to collect metrics and send them to the central server.
- **Centralized Data Collection**: A server that aggregates data from all agents for analysis and reporting.
- **Real-Time Alerts**: Configurable alerts based on predefined thresholds to notify administrators of potential issues via toast notifications.
- **Performance Metrics**: Collection of various performance metrics such as reachability, response time and potentially other system metrics that can be extended via plugins.
- **Scalability**: Designed to handle a large number of agents and hosts efficiently.
- **Extensible Architecture**: Support for plugins to extend monitoring capabilities and integrate with other systems.
- **Navigation**: Responsive navigation - hamburger menu with bottom nav on mobile/tablet, fixed 200px sidebar with labels on desktop. Smooth scroll navigation links.
- **Search Functionality**: Command palette (Cmd+K) - full-screen modal on mobile, 600px centered modal on desktop, with fuzzy search across agents and actions.
- **User Authentication**: OAuth2 with PKCE supporting multiple providers (Okta, Auth0, Azure AD, Google, generic OIDC), secure token storage in localStorage, automatic token refresh.
- **Dashboard**: Bento-Box layout fills entire screen width on desktop, responsive grid (1-6 columns based on viewport), real-time WebSocket updates, status pulse indicators.
- **Theme Switching**: Three-state theme system (system preference as default, manual light/dark override), localStorage persistence, smooth transitions, accessible toggle button.
- **User-Friendly Interface**: Clean, modern design inspired by Linear.app, Better Stack, and Tailscale, with focus on usability and clarity.
- **APIs for Integration**: RESTful APIs to allow integration with other systems and automation tools.

# Documentation

- API specification provided in OpenAPI format for easy integration and client generation available in the `api/openapi/api/spec.yaml`.
- Guides and documentation for every feature located in the `docs/` directory, including setup instructions, usage guides, and troubleshooting tips.
- After every major feature implementation, a detailed changelog entry should be added to the `CHANGELOG.md` file to keep track of changes and updates.
- After every major feature implementation, a detailed feature description should be added to the dedicated markdown file in the `docs/features/` directory to provide in-depth information about the feature, its usage, and any relevant details.
- Refer to the `docs/README.md` file for an overview of the project and instructions for getting started.
- Refer to the `docs/features/` directory for detailed descriptions and guides for each feature implemented in the project.

## Documentation Requirements

**New features MUST include:**
- A dedicated markdown file in `docs/features/<feature-name>.md` describing the feature, its design decisions, API, and usage examples.
- A `CHANGELOG.md` entry under `[Unreleased]` with the feature and a short description.
- Updated `docs/README.md` if a new feature doc is added (add link in the Feature Guides section).

**Bug fixes MUST include:**
- A `CHANGELOG.md` entry under `[Unreleased]` describing what was fixed and the root cause.

These documentation steps are non-negotiable — a feature is not complete until its docs exist.


