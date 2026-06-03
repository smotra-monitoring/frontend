# Smotra Frontend Documentation

Welcome to the Smotra Frontend documentation! This guide will help you navigate through the available documentation.

## 📚 Documentation Structure

### Getting Started

- **[Quick Start Guide](GETTING_STARTED.md)** - Get up and running in 5 minutes
  - Installation instructions
  - First run
  - Basic configuration
  - Common issues and solutions

### Core Documentation

- **[Architecture Overview](ARCHITECTURE.md)** - System design and technical decisions
  - Design philosophy
  - Architecture layers
  - Component system
  - State management
  - Performance optimizations
  - Testing strategy

- **[TypeScript Configuration](TYPESCRIPT_CONFIGURATION.md)** - Multi-config TypeScript setup
  - Three-config strategy (IDE, build, test)
  - Configuration file details
  - Usage patterns and commands
  - Troubleshooting guide
  - Best practices

- **[Roadmap](ROADMAP.md)** - Development timeline and planned features
  - Current status (v0.0.1)
  - Completed milestones
  - In-progress features
  - Planned features
  - Known issues

### Feature Guides

Located in the [`features/`](features/) directory:

- **[Agent States Widget](features/agent-states-widget.md)** - Table-based agent list component
  - Table layout with sortable columns
  - CSS-only expandable rows for agent details
  - Status derivation from lastSeenAt timestamp
  - Real-time updates and accessibility
  - Performance optimizations

- **[OAuth Authentication](features/oauth-authentication.md)** - OAuth2 with PKCE implementation
  - OAuth flow explanation
  - PKCE security
  - Multi-provider support
  - Token management
  - Configuration guide

- **[Theme Management](features/theme-management.md)** - Theme system implementation
  - Three-state theme system (system/light/dark)
  - System preference detection
  - localStorage persistence
  - CSS architecture
  - Accessibility considerations

- **[UI Design System](features/ui-design-system.md)** - Design patterns and components
  - Bento-Box dashboard layout
  - Status pulse indicators
  - Neumorphic dark mode
  - Responsive design patterns
  - Accessibility features

### Testing Documentation

Located in the [`testing/`](testing/) directory:

- **[Testing Summary](testing/TESTING_SUMMARY.md)** - Testing strategy and current status
  - Test results (175 tests passing ✅)
  - Coverage report (~85%)
  - Test infrastructure
  - Testing best practices
  - Running tests

- **[Responsive Testing](testing/responsive-testing.md)** - Multi-viewport testing
  - Breakpoint testing matrix
  - Touch interaction testing
  - Layout verification
  - Testing tools

## 🚀 Quick Links by Role

### For New Contributors

1. Start with [Quick Start Guide](GETTING_STARTED.md)
2. Read [Architecture Overview](ARCHITECTURE.md)
3. Review [Contributing Guidelines](../CONTRIBUTING.md)
4. Check [Roadmap](ROADMAP.md) for available tasks

### For Developers

- [Architecture](ARCHITECTURE.md) - Understand the system design
- [TypeScript Configuration](TYPESCRIPT_CONFIGURATION.md) - Build and type-checking setup
- [OAuth Guide](features/oauth-authentication.md) - Authentication implementation
- [Testing Summary](testing/TESTING_SUMMARY.md) - Testing approach
- [Contributing](../CONTRIBUTING.md) - Code style and workflow

### For Designers

- [UI Design System](features/ui-design-system.md) - Design patterns
- [Theme Management](features/theme-management.md) - Theme system
- [Architecture](ARCHITECTURE.md) → Styling Strategy section

### For Project Managers

- [Roadmap](ROADMAP.md) - Feature timeline
- [Changelog](../CHANGELOG.md) - Version history
- [Testing Summary](testing/TESTING_SUMMARY.md) - Quality metrics
- [README](../README.md) - Project overview

### For DevOps/Deployment

- [Getting Started](GETTING_STARTED.md) → Production Build section
- [Architecture](ARCHITECTURE.md) → Performance section
- [README](../README.md) → Configuration section

## 📖 Documentation by Topic

### Authentication
- [OAuth Implementation](features/oauth-authentication.md)
- [Architecture](ARCHITECTURE.md) → Authentication Flow section

### User Interface
- [UI Design System](features/ui-design-system.md)
- [Theme Management](features/theme-management.md)
- [Architecture](ARCHITECTURE.md) → Component System section

### State & Data
- [Architecture](ARCHITECTURE.md) → State Management section
- [Architecture](ARCHITECTURE.md) → Architecture Layers section

### Performance
- [Architecture](ARCHITECTURE.md) → Performance Optimizations section
- [Testing Summary](testing/TESTING_SUMMARY.md) → Coverage Goals section

### Testing
- [Testing Summary](testing/TESTING_SUMMARY.md)
- [Responsive Testing](testing/responsive-testing.md)
- [Architecture](ARCHITECTURE.md) → Testing Strategy section

### Development
- [Getting Started](GETTING_STARTED.md)
- [Contributing](../CONTRIBUTING.md)
- [Architecture](ARCHITECTURE.md)

## 🎯 Common Tasks

### How do I...

#### ...get started developing?
1. [Quick Start Guide](GETTING_STARTED.md)
2. [Contributing Guidelines](../CONTRIBUTING.md)

#### ...understand the architecture?
1. [Architecture Overview](ARCHITECTURE.md)
2. [Component System](ARCHITECTURE.md#component-system)
3. [State Management](ARCHITECTURE.md#state-management)

#### ...configure OAuth?
1. [OAuth Authentication Guide](features/oauth-authentication.md)
2. [Getting Started](GETTING_STARTED.md) → Configuration section

#### ...add a new feature?
1. [Roadmap](ROADMAP.md) → Check if planned
2. [Architecture](ARCHITECTURE.md) → Understand layers
3. [Contributing](../CONTRIBUTING.md) → Follow workflow

#### ...run tests?
1. [Testing Summary](testing/TESTING_SUMMARY.md) → Running Tests section
2. [Contributing](../CONTRIBUTING.md) → Testing section

#### ...customize the theme?
1. [Theme Management](features/theme-management.md)
2. [UI Design System](features/ui-design-system.md)
3. Edit `public/css/variables.css`

#### ...deploy to production?
1. [Getting Started](GETTING_STARTED.md) → Production Build section
2. Configure environment variables
3. Serve `public/` directory with static file server

## 📝 Document Templates

When creating new documentation, follow these patterns:

### Feature Documentation Template

```markdown
# Feature Name

## Overview
Brief description of the feature

## Why This Feature?
Rationale and benefits

## How It Works
Technical explanation with diagrams if needed

## Usage
Code examples and configuration

## API Reference
Public APIs and interfaces

## Testing
How to test this feature

## Troubleshooting
Common issues and solutions
```

### API Documentation Template

```markdown
# API Name

## Methods

### methodName(params)
Description

**Parameters:**
- `param1` (Type): Description
- `param2` (Type): Description

**Returns:** Type - Description

**Example:**
\`\`\`typescript
example code
\`\`\`
```

## 🔄 Keeping Documentation Updated

Documentation should be updated when:

- ✅ Adding new features → Update ROADMAP.md, add feature guide
- ✅ Fixing bugs → Update CHANGELOG.md
- ✅ Changing APIs → Update relevant docs and CHANGELOG.md
- ✅ Completing milestones → Update ROADMAP.md, CHANGELOG.md
- ✅ Test changes → Update TESTING_SUMMARY.md
- ✅ Architecture changes → Update ARCHITECTURE.md

See [Contributing Guidelines](../CONTRIBUTING.md) → Documentation section.

## 🤝 Contributing to Documentation

Documentation contributions are welcome! To contribute:

1. Identify missing or outdated documentation
2. Follow the templates above
3. Use clear, concise language
4. Include code examples
5. Add diagrams where helpful (use Mermaid for diagrams)
6. Submit a pull request

See [CONTRIBUTING.md](../CONTRIBUTING.md) for full guidelines.

## 📧 Questions?

If you can't find what you're looking for:

1. Search existing documentation
2. Check [GitHub Issues](https://github.com/smotra-monitoring/frontend/issues)
3. Ask in GitHub Discussions
4. Contact maintainers

---

**Last Updated**: May 10, 2026  
**Documentation Version**: 0.0.1  
**Status**: Complete and up-to-date ✅
