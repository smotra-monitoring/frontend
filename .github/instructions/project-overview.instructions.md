---
description: "Project overview, design principles, key features, technology stack, folder structure, and endpoints for the Smotra frontend monitoring system."
applyTo: "**"
---

# Project Description

This project is a distributed monitoring system designed to track reachability and performance of agents installed on various hosts. It consists of a central server that collects data from multiple agents deployed across different machines. The system provides real-time monitoring, alerting, and reporting capabilities to ensure the health and performance of the monitored infrastructure.

# Repository Purpose

The repository serves as the GUI frontend for the monitoring system, providing a user-friendly interface for administrators to visualize data, configure agents, and manage alerts. It is built using vanilla TypeScript and styled with Bulma CSS framework to ensure a responsive and modern design. The frontend communicates with the backend server via RESTful APIs and WebSocket for real-time updates, allowing users to monitor their infrastructure effectively.

# Design Principles

- **Single Page Application (SPA)**: The frontend is designed as a single-page application to provide a seamless user experience without the need for page reloads.
- **Simplicity**: Straightforward and easy to use, with a focus on essential features that provide value without unnecessary complexity.
- **Modularity**: Modular architecture allowing for easy maintenance and extensibility. New features can be added without affecting existing functionality.
- **Performance**: Optimized to handle a large number of agents and hosts without significant degradation in responsiveness.
- **Security**: Incorporates security best practices to protect sensitive data and ensure secure communication between frontend and backend.
- **Responsive Design**: Mobile-first approach with progressive enhancement. Efficient space utilization on desktop (NO narrow centered layouts). Fluid full-width layouts that adapt from mobile to ultra-wide displays.
- **Accessibility**: WCAG 2.1 AA compliance with support for keyboard navigation, touch interactions, screen readers, and user preferences (reduced motion, high contrast).
- **Design Inspiration**: Modern monitoring aesthetics inspired by Linear.app (clean, keyboard-centric), Better Stack (uptime dashboards), Tailscale (node management), Vercel/Cloudflare (Bento layouts), and Grafana (dark mode, charts).

# Key Features

- **Agent-Based Monitoring**: Lightweight agents installed on hosts to collect metrics and send them to the central server.
- **Centralized Data Collection**: A server that aggregates data from all agents for analysis and reporting.
- **Real-Time Alerts**: Configurable alerts based on predefined thresholds to notify administrators via toast notifications.
- **Performance Metrics**: Collection of reachability, response time, and extensible system metrics.
- **Scalability**: Designed to handle a large number of agents and hosts efficiently.
- **Extensible Architecture**: Support for plugins to extend monitoring capabilities.
- **Navigation**: Responsive navigation — hamburger menu with bottom nav on mobile/tablet, fixed 200px sidebar with labels on desktop. Smooth scroll navigation links.
- **Search Functionality**: Command palette (Cmd+K) — full-screen modal on mobile, 600px centered modal on desktop, with fuzzy search across agents and actions.
- **User Authentication**: OAuth2 with PKCE supporting multiple providers (Okta, Auth0, Azure AD, Google, generic OIDC), secure token storage in localStorage, automatic token refresh.
- **Dashboard**: Bento-Box layout fills entire screen width on desktop, responsive grid (1–6 columns based on viewport), real-time WebSocket updates, status pulse indicators.
- **Theme Switching**: Three-state theme system (system preference as default, manual light/dark override), localStorage persistence, smooth transitions, accessible toggle button.
- **User-Friendly Interface**: Clean, modern design inspired by Linear.app, Better Stack, and Tailscale.
- **APIs for Integration**: RESTful APIs to allow integration with other systems and automation tools.

# Technology Stack

- **Language**: Vanilla TypeScript, no frameworks
- **CSS framework**: Bulma for styling and responsive design
- **Data Storage**: In-memory storage for real-time data
- **Communication**: HTTP/HTTPS for API and WebSocket for real-time updates
- **Deployment**: Docker for containerization
- **Testing**: Vitest for unit and integration testing
- **Linting/Formatting**: ESLint and Prettier

# Endpoints

- RESTful API endpoints for agent data submission, configuration management, and data retrieval.
- WebSocket endpoints for real-time data updates to the dashboard.
- Authentication endpoints for user login and management.
- `/metrics` endpoint for Prometheus monitoring.
- `/healthz` endpoint for server status monitoring.
- API versioning implemented via URL path (e.g., `/v1/`).

# Folder Structure

- `public/`: Static assets and HTML shell
  - `index.html`: SPA shell with viewport meta, theme initialization
  - `css/`: All CSS files (no CSS-in-JS)
  - `images/`: Image assets, icons
- `src/`: Source code
  - `api/`: **Generated OpenAPI client — DO NOT MANUALLY EDIT**
  - `auth/`: Authentication logic (OAuth2, PKCE, tokens)
  - `components/`: Reusable UI components (TypeScript classes)
  - `pages/`: Application pages (login, dashboard, oauth-callback, router)
  - `services/`: API and service layer (auth-service, websocket-service)
  - `state/`: State management (global-state, auth-state, agent-state, theme-manager, viewport-state)
  - `types/`: TypeScript type definitions
  - `utils/`: Utility functions
  - `index.ts`: Application bootstrap entry point
- `tests/`: Unit and integration tests (mirrors `src/` structure)
- `api/`: OpenAPI specification and configuration
- `docs/`: Documentation
