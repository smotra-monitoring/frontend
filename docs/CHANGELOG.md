# Changelog

All notable changes to the Smotra Frontend project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Refresh Manager**: Centralized periodic data polling system for dashboard widgets
  - Built on global-state pattern for consistent pub/sub functionality
  - Configurable refresh frequencies (Off, 5s, 15s, 30s) via UI dropdown
  - Single timer management with automatic cleanup
  - Widget subscription API for automatic data refresh
  - Comprehensive unit and integration tests (40+ tests)
  - Full documentation in `docs/features/refresh-manager.md`
- **Refresh Control Component**: UI component for selecting refresh frequency
  - Dropdown with frequency options in dashboard toolbar
  - Real-time integration with RefreshManager
  - Bulma CSS styling with WCAG 2.1 AA accessibility
  - Proper ARIA labels and keyboard navigation
- **TypeScript Configuration Documentation**: Comprehensive guide for multi-config setup
  - Detailed explanation of three TypeScript configurations (tsconfig.json, tsconfig.build.json, tsconfig.test.json)
  - Usage patterns and commands
  - Troubleshooting guide
  - Best practices and design rationale
- **Agent States Widget**: Self-contained table-based agent list component
  - Sortable columns (Name, Status, Last Seen) with visual indicators
  - CSS-only expandable rows showing full agent details (zero re-renders, 60fps animations)
  - "Toggle All" button to expand/collapse all rows at once
  - Status badges with pulse indicators for online/offline/unknown states
  - Full WCAG 2.1 AA accessibility with keyboard navigation and screen reader support
  - XSS protection with HTML escaping
  - Real-time updates via agent state subscription
  - Comprehensive unit tests (20 tests covering rendering, sorting, expand/collapse, accessibility)
- **Agent Online Threshold Configuration**: `AGENT_ONLINE_THRESHOLD_MS` constant in `config.ts` (5 minutes)
- **Agent Status Derivation**: `deriveAgentStatus()` utility computes status from `lastSeenAt` timestamp
- **Agent Utilities**: `formatLastSeen()` and `formatAbsoluteDate()` for timestamp formatting

### Changed
- **Testing Framework**: Migrated from Jest to Vitest v4.x
  - Faster test execution with native ESM support
  - Better TypeScript integration
  - V8 coverage provider instead of istanbul/nyc
  - Jest-compatible API for easy migration
- **TypeScript**: Upgraded to TypeScript 6.x
  - Latest language features and improvements
  - Enhanced type checking capabilities
  - Better ESM support
- **Node.js**: Upgraded to Node.js 24 LTS
  - Long-term support version
  - Improved performance
  - Modern JavaScript features
- **Dashboard Layout**: Replaced Bento-Box agent card grid with single AgentStatesWidget
  - More information-dense table layout instead of cards
  - Better scalability for 50+ agents
  - Faster scanning with vertical alignment
- **DashboardGrid Component**: Refactored from "agent-card factory" to "widget layout shell"
  - Simplified to mount single AgentStatesWidget (instead of creating AgentCard instances)
  - Preserves CSS Grid layout for future multi-widget scenarios
  - Full-width widget container spans all grid columns
- **Agent Type**: Re-exported `AgentListItem` from OpenAPI SDK as `Agent`
  - Single source of truth from generated types.gen.ts
  - All components use same type definition
  - Added `AgentStatus = 'online' | 'offline' | 'unknown'` derived type
- **Agent State Management**: Updated all methods for new Agent structure
  - `updateAgent()` now updates lastSeenAt, agentVersion, configVersion
  - `filterAgents()` uses deriveAgentStatus() and filters by sectionId, agentVersion, ipAddresses
  - `sortAgents()` sorts by name, derived status, lastSeenAt, agentVersion, configVersion
  - `getAgentCountByStatus()` uses deriveAgentStatus() to count agents
- **Agent Mock Data**: Completely rewritten to match AgentListItem shape
  - UUIDv7 IDs, sectionId, ipAddresses array, agentVersion, configVersion
  - All test mocks updated (agent-data.ts, websocket-messages.ts)
- **Command Palette**: Updated agent search to use new fields (sectionId, ipAddresses[0].ip, agentVersion)
- **Status Indicator**: Removed invalid status types (warning, error) from AgentStatus

### Updated
- Test configuration migrated from `jest.config.js` to `vitest.config.js`
- Updated all documentation to reflect Vitest usage
- Updated package dependencies to latest versions
- Documentation now references TypeScript 6.x
- **CSS Components**: Added 300+ lines of styling for AgentStatesWidget
  - `.agent-states-widget` container with border-radius: 12px
  - `.agent-states-table` full-width table with sortable headers
  - `.agent-states-row__details` with CSS-only expand/collapse transitions (max-height 0→800px, opacity 0→1)
  - `.agent-status-badge` colored pill badges for online/offline/unknown
  - `.agent-details__grid` two-column grid on tablet+
  - `@media (prefers-reduced-motion: reduce)` disables transitions
- **Integration Tests**: Updated all assertions for new Agent structure (dashboard.test.ts)
- **Unit Tests**: Updated agent-state.test.ts for new fields and null-safety
- **WebSocket Types**: Updated AgentUpdateMessage to include lastSeenAt, agentVersion, configVersion

### Planned
- Backend API integration for token refresh, user info, agent data
- Permission system and role-based access control
- Command palette extended actions
- Settings page
- Agent details page (click agent name to view full details)
- Filter controls (by status, section, version)
- Search/filter bar above agent table
- Export to CSV functionality
- Persist sort and filter preferences to localStorage

## [0.0.1] - 2026-05-10

### Added

#### Foundation & Architecture
- TypeScript project setup with ES modules (NodeNext)
- Component architecture with BaseComponent base class and lifecycle hooks
- Lightweight pub/sub state management system
- Client-side router with authentication guards
- OpenAPI client generation from backend specification
- Mobile-first responsive CSS architecture (8 stylesheet files)
- Jest testing infrastructure with jsdom environment

#### Authentication & Security
- OAuth2 with PKCE (Proof Key for Code Exchange) implementation
- Support for multiple OAuth providers: Okta, Auth0, Azure AD, Google, generic OIDC
- Token management with automatic expiration tracking
- Secure token storage in localStorage
- Authentication state management with pub/sub
- Login page with OAuth provider selection
- OAuth callback handler
- Auth guards for protected routes

#### UI Components
- **BaseComponent** - Abstract base class with lifecycle hooks (render, onMount, onUpdate, onDestroy)
- **AgentCard** - Bento-Box style card for agent display
- **DashboardGrid** - CSS Grid container with auto-fit (1-6+ columns)
- **ThemeToggle** - Three-state theme switcher button
- **StatusIndicator** - Pulsing status dot with ARIA labels
- **Sidebar** - Responsive navigation sidebar
- **ToastNotification** - Toast notification system
- **CommandPalette** - Cmd/Ctrl+K search modal

#### Pages
- Login page with OAuth provider selection
- OAuth callback handler page
- Dashboard page with Bento-Box grid layout
- Router with route definitions and auth guards

#### State Management
- **global-state** - Core pub/sub state manager
- **auth-state** - Authentication state with token tracking
- **agent-state** - Agent data management with filtering
- **theme-manager** - Theme detection, persistence, and application
- **viewport-state** - Responsive breakpoint tracking

#### Services
- **auth-service** - High-level authentication API
- **websocket-service** - WebSocket connection management

#### Utilities
- **storage** - Type-safe localStorage wrapper
- **theme-utils** - Theme detection and CSS class management
- **viewport-utils** - Breakpoint detection and column calculation
- **url-utils** - URL parameter parsing and manipulation
- **dom-helpers** - DOM manipulation utilities

#### Styling
- **base.css** - Root styles with smooth scroll
- **variables.css** - CSS custom properties for theming
- **theme-dark.css** - Dark mode color overrides (#0b0e14 background)
- **theme-light.css** - Light mode color overrides
- **layout.css** - Grid systems, flexbox, responsive structure
- **components.css** - Component-specific styles with mobile-first media queries
- **animations.css** - Keyframes with prefers-reduced-motion support
- **utilities.css** - Helper classes

#### Testing
- **175 tests** across 14 test suites (100% passing)
- **Unit tests**: Utils, state management, authentication
- **Integration tests**: OAuth flow, theme switching, responsive layouts, dashboard
- **Test mocks**: Agents, OAuth responses, WebSocket messages, viewport utilities
- **Browser API mocks**: localStorage, matchMedia, IntersectionObserver, ResizeObserver, crypto.subtle
- **Coverage**: ~85% code coverage

#### Documentation
- Main README.md with feature overview
- OAuth Authentication guide (docs/features/oauth-authentication.md)
- Theme Management guide (docs/features/theme-management.md)
- UI Design System guide (docs/features/ui-design-system.md)
- Testing Summary (docs/testing/TESTING_SUMMARY.md)
- Responsive Testing guide (docs/testing/responsive-testing.md)
- Roadmap (docs/ROADMAP.md)
- This Changelog

### Fixed
- 253 TypeScript compilation errors → 0 errors
- Added `.js` extensions to all relative imports (NodeNext requirement)
- Fixed type mismatches across components
- Added 10+ missing exports from state modules
- Resolved implicit `any` types throughout codebase
- Fixed async/await in router
- Implemented all missing utility functions (URL parsing, query strings)
- Fixed OAuth PKCE generation with crypto polyfills
- Implemented token refresh scheduling
- Fixed theme persistence and system detection
- Enhanced viewport tracking with ResizeObserver

### Changed
- Improved error handling across all modules
- Enhanced type safety (eliminated remaining `any` types)
- Consistent code style with ESLint and Prettier
- Optimized component render cycles
- Improved accessibility with ARIA labels

### Security
- PKCE implementation for OAuth2 (prevents authorization code interception)
- State parameter for CSRF protection in OAuth flow
- Token expiration tracking with automatic refresh
- Secure token storage in localStorage (HTTPS-only in production)

## [0.0.0] - 2026-04-01

### Added
- Initial project setup
- Repository structure
- Basic documentation structure

---

**Legend:**
- `Added` - New features
- `Changed` - Changes in existing functionality
- `Deprecated` - Soon-to-be removed features
- `Removed` - Removed features
- `Fixed` - Bug fixes
- `Security` - Security improvements
