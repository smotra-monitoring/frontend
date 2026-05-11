# Smotra Frontend Roadmap

## Current Status (v0.0.1)

**Build Status**: ✅ Passing (0 TypeScript errors)  
**Test Status**: ✅ 175 tests passing, 14 test suites  
**Coverage**: ~85%

## ✅ Completed Milestones

### Phase 1: Foundation & Architecture ✅
- [x] Project structure setup
- [x] TypeScript configuration with ES modules (upgraded to v6.x)
- [x] Component architecture (BaseComponent pattern)
- [x] State management system (pub/sub)
- [x] CSS architecture (mobile-first, 8 files)
- [x] OpenAPI client generation setup
- [x] Vitest testing infrastructure (migrated from Jest)

### Phase 2: Authentication & Security ✅
- [x] OAuth2 with PKCE implementation
- [x] Token management (storage, expiration tracking)
- [x] Multiple provider support (Okta, Auth0, Azure AD, Google, OIDC)
- [x] Auth state management
- [x] Auth guards for routing
- [x] Login page with provider selection
- [x] OAuth callback handler

### Phase 3: UI Components ✅
- [x] Base component with lifecycle hooks
- [x] Theme toggle component
- [x] Status indicator (pulse animation)
- [x] Agent card component
- [x] Dashboard grid (Bento-Box layout)
- [x] Sidebar navigation
- [x] Toast notifications
- [x] Command palette (Cmd/Ctrl+K)

### Phase 4: Core Features ✅
- [x] Theme management (system/light/dark)
- [x] Responsive design (mobile to ultra-wide)
- [x] Viewport state tracking
- [x] Client-side routing
- [x] Dashboard page
- [x] Agent state management
- [x] WebSocket service foundation

### Phase 5: Testing & Quality ✅
- [x] Unit tests for utilities (storage, theme, viewport, URL)
- [x] Unit tests for state management
- [x] Unit tests for authentication
- [x] Integration tests (OAuth flow, theme switching, responsive)
- [x] Test mocks (agents, OAuth, WebSocket, viewport)
- [x] All tests passing (175/175)

## 🚧 In Progress (v0.1.0)

### Backend Integration
- [ ] Token refresh API endpoint integration
- [ ] User info API endpoint integration
- [ ] Agent data API endpoint integration
- [ ] WebSocket real-time updates (complete implementation)
- [ ] Error handling for API failures

### Enhanced Features
- [ ] Command palette actions (beyond search)
- [ ] Expandable table rows for agent details
- [ ] Agent filtering and sorting
- [ ] Mobile bottom navigation
- [ ] Settings page

## 📋 Planned Features (v0.2.0+)

### v0.2.0: Data Visualization
- [ ] Performance metrics charts (sparklines)
- [ ] Historical data views
- [ ] Agent health trends
- [ ] Alert visualization

### v0.3.0: Advanced Monitoring
- [ ] Multi-select agents for bulk actions
- [ ] Custom dashboards
- [ ] Alert configuration UI
- [ ] Export data functionality

### v0.4.0: Collaboration
- [ ] User management UI
- [ ] Role-based access control UI
- [ ] Audit logs viewer
- [ ] Shared dashboards

### v0.5.0: Performance & Polish
- [ ] Virtual scrolling for large agent lists (1000+)
- [ ] Progressive web app (PWA) capabilities
- [ ] Offline mode with service workers
- [ ] Advanced caching strategies

## 🔧 Technical Debt & Improvements

### Code Quality
- [ ] Review and optimize token refresh scheduling logic
- [ ] Refactor test helper functions to `tests/helpers/`
- [ ] Remove functions exported solely for testing
- [ ] Code splitting for route-based lazy loading
- [ ] Evaluate and optimize bundle size

### Accessibility
- [ ] Comprehensive screen reader testing
- [ ] Keyboard navigation audit
- [ ] Color contrast verification
- [ ] ARIA label completeness review

### Performance
- [ ] Implement CSS containment on all cards
- [ ] Add image optimization (WebP with fallbacks)
- [ ] Implement Intersection Observer for lazy loading
- [ ] Profile and optimize WebSocket update handling

### Documentation
- [x] Main README.md
- [ ] Component API documentation
- [ ] State management guide
- [ ] Deployment guide
- [ ] Contribution guidelines

## 🐛 Known Issues / TODOs

### High Priority
- [ ] **token-manager.ts**: Replace mock refresh with actual API call
- [ ] **auth-service.ts**: Implement `exchangeCodeForTokens` with SDK
- [ ] **auth-service.ts**: Implement `fetchUserInfo` with SDK
- [ ] **agent-state.ts**: Replace mock agent data with actual API call

### Medium Priority
- [ ] **auth-guard.ts**: Implement actual permission checking
- [ ] **auth-guard.ts**: Implement role checking logic
- [ ] **command-palette.ts**: Add action results (Add agent, View logs, etc.)

### Low Priority
- [ ] Review card hover animation performance
- [ ] Consider neumorphic styling refinements for dark mode
- [ ] Evaluate theme transition smoothness

## 📅 Release Timeline

- **v0.0.1** (Current): Foundation, auth, UI, tests ✅
- **v0.1.0** (Q2 2026): Backend integration, enhanced features
- **v0.2.0** (Q3 2026): Data visualization
- **v0.3.0** (Q4 2026): Advanced monitoring
- **v0.4.0** (Q1 2027): Collaboration features
- **v0.5.0** (Q2 2027): Performance & PWA

## 📊 Metrics Goals

### Current
- Test coverage: ~85%
- Build time: <5s
- Bundle size: ~150KB gzipped
- Lighthouse score: 92 (desktop)

### Target (v0.5.0)
- Test coverage: 90%+
- Build time: <3s (with code splitting)
- Bundle size: <200KB gzipped (with code splitting)
- Lighthouse score: 95+ (desktop), 90+ (mobile)
- First Contentful Paint: <1s on 4G

---

**Last Updated**: May 10, 2026  
**Status**: Active Development  
**Next Milestone**: v0.1.0 Backend Integration

