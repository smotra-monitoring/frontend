---
description: "Performance budget and optimization techniques for the Smotra frontend: mobile-first budget targets, code splitting, lazy loading, CSS containment, WebSocket efficiency, desktop performance. Use when optimizing or reviewing performance-sensitive code."
applyTo: "src/**, public/**"
---

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

- 60fps scrolling with 5–6 column grid
- Smooth animations (`transform`/`opacity` only)
- Efficient WebSocket handling for hundreds of agents
- Virtualization for large lists (if > 1000 agents)
