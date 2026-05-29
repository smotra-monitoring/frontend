---
description: "UI visual design rules for the Smotra frontend: Bento-Box dashboard, status pulse indicators, neumorphic dark mode, visual design spec (typography, colors, spacing, shadows, touch targets). Use when building or styling components, pages, or dashboard layouts."
applyTo: "src/components/**, src/pages/**, public/css/**"
---

# Visualization

The frontend provides a dashboard that visualizes the collected data in an intuitive manner. Key performance metrics such as reachability and response time are displayed using charts and graphs, allowing administrators to quickly assess the health of their infrastructure. The dashboard also includes features for filtering and sorting data, as well as detailed views for individual agents and hosts.

Visually the site should be simple, clean, and modern with a focus on usability and clarity. The use of Bulma CSS framework ensures that the design is responsive and works well across different devices and screen sizes.

**Motion:** Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states.

**Backgrounds & Visual Details:** Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, layered transparencies, smooth shadows.

## The "Bento-Box" Dashboard

For a monitoring system, "Bento" layouts are king. Instead of a long list of agents, group them into rounded, distinct cards.

- **The UX Win:** It prevents "Data Fatigue." By boxing metrics (CPU, latency, reachability) into discrete tiles, the admin's eye knows exactly where to look.
- **Implementation Tip:** Use Bulma's `.box` class but add a custom `border-radius: 12px;` and a very subtle `border: 1px solid #eee;` instead of heavy shadows.
- **Inspiration:** Vercel's Dashboard or Cloudflare. They handle massive amounts of data without feeling cluttered.

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
- **Inspiration:** Stripe's Dashboard. They are the masters of the "clean but data-heavy" table.

## Recommended Layout Structure

| Component | UI Strategy | Bulma Tip |
|-----------|-------------|-----------|
| Sidebar | Slim, icon-only until hover. | Use `.is-narrow` on a side column. |
| Global Search | A "Command Palette" (Cmd+K). | Use a Modal with a single clean input field. |
| Charts | Sparklines (small, no axes). | Keep these inside your Bento boxes. |
| Alerts | "Toast" notifications (top-right). | Use Bulma's `.notification` with fixed positioning. |

## Visual Style Reference

- **Linear.app**: High-performance, keyboard-centric, and arguably the cleanest UI in tech right now.
- **Better Stack**: Exactly what you are building. Look at their "Uptime" dashboards for how they visualize agent reachability.
- **Tailscale**: Notice how they manage a list of "Nodes" (agents). It is incredibly clean and utilizes white space perfectly.

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

Based on 4px unit: 0.25rem (4px), 0.5rem (8px), 0.75rem (12px), 1rem (16px), 1.5rem (24px), 2rem (32px), 3rem (48px).

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
