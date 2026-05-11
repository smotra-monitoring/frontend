# Smotra Frontend 🚀

> Modern, responsive web interface for distributed infrastructure monitoring

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-blue)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-175%20passing-brightgreen)](tests/)

## What is Smotra?

Smotra Frontend is a **single-page web application** that provides real-time monitoring and visualization for distributed agents across your infrastructure. Built with vanilla TypeScript, it offers a clean, responsive interface that works seamlessly from mobile phones to ultra-wide monitors.

### Key Features

🎨 **Smart Theming** - Automatically adapts to your system theme (light/dark)  
🔐 **Secure Authentication** - OAuth2 login with support for major providers  
📱 **Truly Responsive** - Mobile-first design that scales beautifully  
⚡ **Real-time Updates** - Live agent status via WebSocket  
♿ **Accessible** - WCAG 2.1 AA compliant with full keyboard navigation  
🧪 **Well Tested** - 175 tests with 85% coverage  

## Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start development server
npm run dev
```

Visit `http://localhost:3000` and you're ready to go! 🎉

For detailed setup instructions, see **[Getting Started Guide](docs/GETTING_STARTED.md)**.

## Documentation

### 📖 For Everyone
- **[Getting Started](docs/GETTING_STARTED.md)** - Set up in 5 minutes
- **[Documentation Index](docs/README.md)** - Find what you need quickly

### 👩‍💻 For Developers
- **[Architecture Guide](docs/ARCHITECTURE.md)** - How it all works
- **[Contributing Guidelines](docs/CONTRIBUTING.md)** - Join the project
- **[Testing Guide](docs/testing/TESTING_SUMMARY.md)** - Testing strategy

### 🗺️ Planning & History
- **[Roadmap](docs/ROADMAP.md)** - What's coming next
- **[Changelog](docs/CHANGELOG.md)** - Version history

### 🎨 Feature Deep Dives
- **[OAuth Authentication](docs/features/oauth-authentication.md)** - Security implementation
- **[Theme Management](docs/features/theme-management.md)** - Dark/light mode system
- **[UI Design System](docs/features/ui-design-system.md)** - Design patterns

## Technology

Built with modern web standards:
- **TypeScript** 6.x - Type-safe JavaScript
- **Bulma CSS** - Clean, responsive styling
- **Vitest** - Fast, modern testing
- **Browser-sync** - Live reload development

No heavy frameworks needed! Pure TypeScript with native ES modules for maximum performance and minimal bundle size.

## Project Status

**Version**: 0.0.1 (Active Development)  
**Build**: ✅ Passing  
**Tests**: ✅ 175/175  
**Coverage**: 85%

Current focus: Backend API integration and enhanced monitoring features. See [Roadmap](docs/ROADMAP.md) for details.

## Contributing

We welcome contributions! Whether you're fixing bugs, adding features, or improving documentation:

1. Read the **[Contributing Guide](docs/CONTRIBUTING.md)**
2. Check the **[Roadmap](docs/ROADMAP.md)** for available tasks
3. Follow our code style and testing requirements
4. Submit a pull request

## Support

- 📚 **Documentation**: Check the [docs/](docs/) directory
- 🐛 **Issues**: [GitHub Issues](https://github.com/smotra-monitoring/frontend/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/smotra-monitoring/frontend/discussions)

## License

Apache License 2.0 - See [LICENSE](LICENSE) for details.

---

**Made with ❤️ by Ivan Kuchin** | [Documentation](docs/README.md) | [Get Started](docs/GETTING_STARTED.md)
