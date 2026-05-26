Let me update the plan to include comprehensive testing and HTML/CSS design:

## Plan: Frontend Structure & OAuth Implementation Guide (Updated v2)

Added Jest unit/integration testing for all components and services per copilot-instructions.md guidelines. Added HTML structure with semantic markup and CSS design implementing Bento-Box layouts, pulse animations, neumorphic dark mode, expandable tables, and command palette inspired by Linear.app, Better Stack, and Tailscale.

**Steps**

1. **Create base HTML structure** in `public/`:
   - `index.html` - Main SPA shell with semantic HTML5 structure, theme class initialization script inline (prevents FOUC), CSS/JS loading order optimized
   - `favicon.svg` - Icon for browser tab

2. **Create CSS architecture** in `public/css/`:
   - `variables.css` - CSS custom properties for both themes (light/dark), color tokens, spacing scale, typography scale
   - `theme-dark.css` - Dark mode overrides (#0b0e14 background, high-contrast text, glowing accents)
   - `theme-light.css` - Light mode styles (clean whites, subtle grays)
   - `components.css` - Component-specific styles (bento-box cards, pulse indicators, expandable tables, command palette, toast notifications, theme toggle button)
   - `layout.css` - Grid and flexbox layouts for dashboard, sidebar, responsive breakpoints
   - `animations.css` - Pulse animation keyframes, smooth theme transitions, micro-interactions
   - `utilities.css` - Helper classes for spacing, visibility, text truncation

3. **Create OAuth file structure** in src/auth:
   - `oauth-manager.ts` - OAuth2 flow orchestration with PKCE generation, state management, and multi-provider support
   - `token-manager.ts` - Token lifecycle management
   - `auth-state.ts` - Authentication state with pub/sub events
   - `auth-guard.ts` - Route protection utilities

4. **Create theme management** in src/state:
   - `theme-manager.ts` - Theme state with system preference detection, manual override, localStorage persistence, CSS class application

5. **Create supporting service layer** in src/services:
   - `auth-service.ts` - High-level authentication API using generated SDK
   - `websocket-service.ts` - WebSocket connection management for real-time agent updates

6. **Create state management** in src/state:
   - `global-state.ts` - Lightweight state manager with pub/sub pattern
   - `auth-state.ts` - Authentication state module
   - `agent-state.ts` - Agent/host monitoring data state

7. **Create utility functions** in src/utils:
   - `storage.ts` - Type-safe localStorage wrapper
   - `url-utils.ts` - OAuth callback parameter parsing
   - `dom-helpers.ts` - DOM manipulation utilities
   - `theme-utils.ts` - System preference detection, CSS class toggling

8. **Create component architecture** in src/components:
   - `base-component.ts` - Base class with lifecycle hooks, event handling, DOM update patterns
   - `agent-card.ts` - Bento-box card with status pulse, metrics display, hover effects
   - `expandable-table.ts` - Table with chevron-triggered row expansion
   - `command-palette.ts` - Cmd+K modal with fuzzy search
   - `toast-notification.ts` - Top-right toast with auto-dismiss
   - `theme-toggle.ts` - Three-state theme switcher (system/light/dark icons)
   - `sidebar.ts` - Slim icon-only sidebar with hover expansion
   - `status-indicator.ts` - Pulsing status dot component

9. **Create pages** in src/pages:
   - `login.ts` - Login page with OAuth provider buttons, clean centered layout
   - `oauth-callback.ts` - OAuth callback handler with loading state
   - `dashboard.ts` - Main dashboard with Bento-Box grid layout, real-time WebSocket updates
   - `router.ts` - SPA routing with auth guards

10. **Create test structure** in `tests/`:
    - `unit/auth/` - Unit tests for OAuth manager (PKCE generation, state validation), token manager (storage, refresh, expiration), auth guard
    - `unit/state/` - Unit tests for theme manager (system detection, manual override, persistence), global state pub/sub
    - `unit/components/` - Unit tests for each component (rendering, events, state updates, accessibility)
    - `unit/services/` - Unit tests for auth service, WebSocket service (mock WebSocket)
    - `unit/utils/` - Unit tests for storage, URL parsing, theme utilities
    - `integration/` - Integration tests for OAuth flow end-to-end, theme switching with components, WebSocket + dashboard updates
    - `mocks/` - Mock data for agents, OAuth responses, WebSocket messages
    - `setup.ts` - Jest setup file, DOM mocking configuration

11. **Configure Jest** in root:
    - `vi.config.js` - Jest configuration for TypeScript, coverage thresholds, DOM environment (jsdom)
    - Update package.json with test scripts: `test`, `test:watch`, `test:coverage`

12. **Enhance** copilot-instructions.md with:
    - **New "UI/UX Design Patterns" section**: Bento-Box dashboards (`.box` with `border-radius: 12px`, subtle borders), status pulse indicators (8px circle with animation), expandable tables (simple main view + chevron), command palette (Cmd+K modal), slim sidebar (icon-only with hover), toast notifications (top-right, auto-dismiss)
    - **New "Theme Management" section**: System preference as default, three-state model (system/light/dark), localStorage persistence, CSS custom properties approach, FOUC prevention
    - **New "Accessibility" section**: WCAG 2.1 AA compliance, keyboard navigation (Tab, Enter, Escape, Cmd+K), ARIA labels for status indicators, focus management in modals, screen reader announcements for toast notifications, theme toggle accessibility
    - **New "HTML Structure" section**: Semantic HTML5 (`<main>`, `<nav>`, `<section>`, `<article>` for agent cards), single `index.html` SPA shell, component-generated DOM fragments
    - **New "CSS Architecture" section**: CSS custom properties for theming, Bulma base + custom overrides, component-scoped styles, no CSS-in-JS (plain CSS files), BEM-lite naming convention
    - **Enhanced "Key Features" section**: Navigation bar (slim sidebar, `.is-narrow`), search (command palette, Cmd+K), authentication (OAuth multi-provider), dashboard (Bento-Box grid, real-time WebSocket), theme switching
    - **New "Component Architecture" section**: Base component class pattern, lifecycle hooks (`onMount`, `onUpdate`, `onDestroy`), DOM updates via WebSocket deltas, theme-aware rendering
    - **New "Authentication" subsection**: Reference OAuth guide, PKCE requirement, localStorage strategy, token refresh, multi-provider
    - **Enhanced "Testing" section**: Add specifics - unit tests for functions/components (Jest), integration tests for OAuth/WebSocket flows, mock data in `tests/mocks/`, DOM mocking with jsdom, coverage thresholds (80%+), test file location (mirror src structure in `tests/`)
    - **Enhanced "Theme System" section**: Both light and dark modes, system preference default, color palettes (#0b0e14 dark, clean light), Bulma variables, smooth transitions
    - **Enhanced "Design Principles"**: Add inspiration sources: Linear.app (clean, keyboard-centric), Better Stack (uptime dashboards), Tailscale (node management), Vercel/Cloudflare (Bento layouts), Grafana (dark mode, charts)
    - **New "Visual Design Specification" section**: Color palette (dark: #0b0e14 bg, #48c78e success, light: whites/grays), typography (system fonts, sizes), spacing scale (4px base), border radius (12px for cards, 6px for buttons), shadows (subtle, neumorphic for dark)
    - Update Folder Structure to include `public/`, `public/css/`, `tests/` directories

13. **Create OAuth implementation guide** at docs/features/oauth-authentication.md:
    - OAuth2 flow diagram and step-by-step process
    - PKCE implementation with code examples
    - Multi-provider configuration
    - Token storage in localStorage
    - Token refresh logic
    - Logout and revocation
    - Error handling scenarios
    - Security best practices
    - Environment variables
    - Testing approach for OAuth flows with Jest (mock fetch, test PKCE generation, test state validation)
    - Code examples using generated SDK

14. **Create theme implementation guide** at docs/features/theme-management.md:
    - System preference detection (matchMedia API)
    - Three-state theme model
    - localStorage schema
    - MediaQueryList listener for changes
    - CSS custom properties approach with Bulma
    - FOUC prevention technique
    - Component integration
    - Accessibility considerations
    - Testing approach (mock matchMedia, test class application, test persistence)

15. **Create UI design guide** at docs/features/ui-design-system.md:
    - Bento-Box dashboard layout patterns with HTML/CSS examples
    - Status pulse indicator implementation (CSS animation keyframes)
    - Neumorphic dark mode styling
    - Expandable table HTML structure and CSS transitions
    - Command palette design and keyboard interactions
    - Slim sidebar with hover expansion
    - Toast notification positioning and animation
    - Responsive breakpoints for mobile/tablet/desktop
    - Color palette documentation for both themes
    - Typography scale and font stack
    - Component library catalog with live examples

16. **Create types** in src/types:
    - `auth-types.ts` - Extended auth types
    - `component-types.ts` - Component lifecycle, events
    - `dashboard-types.ts` - Agent card, metrics
    - `theme-types.ts` - Theme state types
    - `websocket-types.ts` - WebSocket message types

17. **Update** index.ts:
    - Remove test code
    - Initialize theme manager synchronously FIRST
    - Bootstrap router and auth check
    - Setup WebSocket connection
    - Initialize command palette (Cmd+K listener)
    - Render appropriate page (login or dashboard)

18. **Create mock data** in `tests/mocks/`:
    - `agent-data.ts` - Mock agent/host data for testing dashboard
    - `oauth-responses.ts` - Mock OAuth token responses
    - `websocket-messages.ts` - Mock WebSocket update messages
    - `user-data.ts` - Mock user info

**Verification**

- Run `npm test` to execute all Jest tests, verify 80%+ coverage
- Run `npm run test:watch` during development for TDD workflow
- Run `npm run openapi-ts` to ensure SDK is current
- **Test theme switching**: System preference, manual toggle, persistence, no FOUC
- **Test OAuth flow**: Login, callback, token storage, refresh, logout
- **Test WebSocket updates**: Dashboard receives and displays real-time agent data
- **Test command palette**: Cmd+K opens, Escape closes, fuzzy search works
- **Test expandable table**: Chevron click expands/collapses row with smooth animation
- **Test responsive layout**: Mobile, tablet, desktop breakpoints work correctly
- **Accessibility audit**: Run axe-core or Lighthouse accessibility scan, fix violations
- Check browser DevTools for localStorage structure (tokens, theme preference)
- Validate HTML semantic structure with validator
- Test CSS animations perform smoothly (60fps pulse, theme transitions)
- Verify Bulma + custom CSS integration has no conflicts

**Decisions**

- **OAuth folder location**: src/auth centralizes authentication logic
- **localStorage**: Persistent sessions for better UX
- **Separate feature guides**: features has implementation details
- **Component class pattern**: Better encapsulation for vanilla TS
- **Bento-Box layout**: Visual clarity, prevents data fatigue
- **Command Palette**: Modern search UX (Cmd+K)
- **Three-state theme**: System/light/dark provides flexibility
- **Theme init before render**: Prevents FOUC
- **CSS class on `<html>`**: Maximum cascade control
- **Jest with jsdom**: Standard testing approach for vanilla TS SPAs, mirrors React testing patterns without framework
- **Component tests test behavior not implementation**: Focus on user interactions (click, keyboard), state changes, accessibility
- **Integration tests for critical flows**: OAuth end-to-end, WebSocket updates, theme persistence across reload
- **CSS files in public/**: Keeps styling separate from logic, easy to edit, no build step needed for CSS
- **Semantic HTML5**: Better accessibility, SEO (though SPA), maintainability
- **BEM-lite naming**: `.agent-card`, `.agent-card__status`, `.agent-card--offline` for clarity without verbosity
- **Single page.html**: All routing client-side, components generate DOM dynamically
- **System fonts**: No web fonts to load, faster performance, native feel
- **12px border radius**: Modern but not overly rounded, matches design references
- **Subtle animations**: Pulse for status, smooth theme transitions, no jarring effects
- **Mobile-first responsive**: Start with mobile CSS, layer up to desktop with media queries

---

The plan now includes comprehensive Jest testing mirroring the src/ structure, complete HTML/CSS design system inspired by modern monitoring UIs, and detailed documentation for all design patterns. The CSS will extend Bulma with custom components for the Bento-Box aesthetic. Does this cover your testing and design requirements?