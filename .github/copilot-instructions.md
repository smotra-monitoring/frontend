# Project description

This project is a distributed monitoring system designed to track reachability and performance of agents installed on various hosts. It consists of a central server that collects data from multiple agents deployed across different machines. The system provides real-time monitoring, alerting, and reporting capabilities to ensure the health and performance of the monitored infrastructure.

# Repository Purpose

The repository serves as the GUI frontend for the monitoring system, providing a user-friendly interface for administrators to visualize data, configure agents, and manage alerts. It is built using vanilla TypeScript and styled with Bulma CSS framework to ensure a responsive and modern design. The frontend communicates with the backend server via RESTful APIs and WebSocket for real-time updates, allowing users to monitor their infrastructure effectively.

# Design Principles

- Single Page Application (SPA): The frontend is designed as a single-page application to provide a seamless user experience without the need for page reloads.
- Simplicity: The system is designed to be straightforward and easy to use, with a focus on essential features that provide value to users without unnecessary complexity.
- Modularity: The architecture is modular, allowing for easy maintenance and extensibility. New features can be added without affecting existing functionality.
- Performance: The system is optimized for performance, ensuring that it can handle a large number of agents and hosts without significant degradation in responsiveness.
- Security: The system incorporates security best practices to protect sensitive data and ensure secure communication between the frontend and backend components.

# Visualization

The frontend provides a dashboard that visualizes the collected data in an intuitive manner. Key performance metrics such as reachability and response time are displayed using charts and graphs, allowing administrators to quickly assess the health of their infrastructure. The dashboard also includes features for filtering and sorting data, as well as detailed views for individual agents and hosts.

Visually site should be simple, clean and modern with a focus on usability and clarity. The use of Bulma CSS framework ensures that the design is responsive and works well across different devices and screen sizes.

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


# Key Features

- Agent-Based Monitoring: Lightweight agents installed on hosts to collect metrics and send them to the central server.
- Centralized Data Collection: A server that aggregates data from all agents for analysis and reporting.
- Real-Time Alerts: Configurable alerts based on predefined thresholds to notify administrators of potential issues.
- Performance Metrics: Collection of various performance metrics such as reachability, response time and potentially other system metrics that can be extended via plugins.
- Scalability: Designed to handle a large number of agents and hosts efficiently.
- Extensible Architecture: Support for plugins to extend monitoring capabilities and integrate with other systems.
- User-Friendly Interface: A web-based dashboard for visualizing data, configuring agents, and managing alerts.
- APIs for Integration: RESTful APIs to allow integration with other systems and automation tools.

# Technology Stack

- Programming Language: vanilla TypeScript, no frameworks
- CSS framework: Bulima for styling and responsive design
- Data Storage: In-memory storage for real-time data, with potential for future integration with databases
- Communication Protocol: HTTP/HTTPS for communcation with api and WebSocket for real-time updates
- Deployment: Docker for containerization and ease of deployment
- Testing: Jest for unit testing and integration testing
- Linting and Formatting: ESLint and Prettier for code quality and consistency


# Endpoints

- RESTful API endpoints for agent data submission, configuration management, and data retrieval.
- WebSocket endpoints for real-time data updates to the dashboard.
- Authentication endpoints for user login and management.
- /metrics endpoint for Prometheus monitoring.
- /healthz endpoint for server status monitoring.
- API versioning implementet via URL path (e.g., /v1/).

# Documentation

- API specification provided in OpenAPI format for easy integration and client generation available in the `api/openapi/api/spec.yaml`.
- Guides and documentation for every feature located in the `docs/` directory, including setup instructions, usage guides, and troubleshooting tips.
- After everty major feature implementation, a detailed changelog entry should be added to the `CHANGELOG.md` file to keep track of changes and updates.
- After everty major feature implementation, a detailed feature descrition should be added to the dedicated markdown file in the `docs/features/` directory to provide in-depth information about the feature, its usage, and any relevant details.
- Refer to the `docs/README.md` file for an overview of the project and instructions for getting started.
- Refer to the `docs/features/` directory for detailed descriptions and guides for each feature implemented in the project.

# Folder Structure

- `src/`: Contains the source code for the frontend application.
  - `api/`: Generated OpenAPI client and related services. No files should be manually edited here, as they are generated from the OpenAPI specification.
  - `components/`: Reusable UI components.
  - `state/`: State management for the application.
  - `types/`: TypeScript type definitions and interfaces.
  - `pages/`: Different pages of the application (e.g., dashboard, agent management).
  - `services/`: API service for communication with the backend.
  - `utils/`: Utility functions and helpers.
- `api/`: Contains the OpenAPI specification and related configuration for API client generation.
- `docs/`: Documentation for the project, including setup guides, feature descriptions, and changelog.
- `docs/features/`: Detailed feature descriptions and guides.
- `docs/README.md`: Project overview and instructions for getting started.
- `tests/`: Contains unit and integration tests for the application.
- `public/`: Static assets such as images and icons.
- `public/css/`: CSS files for styling the application.
- `public/images/`: Image files for the application.
- `package.json`: Project metadata and dependencies.
- `tsconfig.json`: TypeScript configuration file.

# OpenAPI Specification

The OpenAPI specification for the backend API is located in the `api/openapi/api/spec.yaml` file. This specification defines the available endpoints, request and response formats, authentication methods, and other relevant details for interacting with the backend server. The OpenAPI specification is used to generate the TypeScript client for the frontend application, ensuring type safety and consistency when making API calls. The `openapi-ts` command in the `package.json` scripts section is used to generate the client based on the OpenAPI specification, and it should be run whenever there are changes to the API specification to keep the client up to date.

`npm run openapi-ts` should be executed after any changes to the `api/openapi/api/spec.yaml` file to regenerate the TypeScript client and ensure that the frontend application can properly communicate with the backend API.

All API interactions in the frontend should utilize the generated TypeScript client to ensure type safety and consistency with the backend API specification. This approach helps to catch potential issues at compile time and provides a clear contract for how the frontend interacts with the backend services. 
- types generated from the OpenAPI specification are located in the `src/api/types.gen.ts`
- sdk generated from the OpenAPI specification are located in the `src/api/sdk.gen.ts`

# Code Style

- Use camelCase for variable and function names.
- Use PascalCase for class and interface names.
- Use consistent indentation (2 spaces).
- Use semicolons at the end of statements.
- Use single quotes for strings.
- Use descriptive names for variables, functions, and classes.
- Avoid using `any` type in TypeScript; prefer specific types or generics.
- Write JSDoc comments for functions and classes to provide clear documentation.
- Use ESLint and Prettier for code formatting and linting to maintain a consistent code style across the project. 

# Testing

- Write unit tests for all functions and components using Jest.
- Write integration tests to ensure that different parts of the application work together correctly.
- Use mock data and services to test components in isolation.
- Ensure that tests cover edge cases and potential failure scenarios.
- Run tests regularly during development to catch issues early and maintain code quality.

