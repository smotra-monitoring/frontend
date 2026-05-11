# Quick Start Guide

Get Smotra Frontend up and running in 5 minutes.

## Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** 9+ (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/smotra-monitoring/frontend.git
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- TypeScript compiler
- Jest testing framework
- Browser-sync for development
- OpenAPI client generator
- Type definitions

### 3. Build the Project

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `public/` directory.

## Running the Application

### Development Mode (Recommended)

Start the development server with live reload:

```bash
npm run dev
```

The application will open automatically at `http://localhost:3000`.

Changes to any file in `public/` will trigger an automatic browser reload.

### Production Mode

For production deployment, serve the `public/` directory with any static file server:

```bash
# Example with Python
python3 -m http.server 8080 --directory public

# Example with Node.js 'serve'
npx serve public
```

## Verification

### Run Tests

Verify everything is working correctly:

```bash
npm test
```

You should see:
```
Test Suites: 14 passed, 14 total
Tests:       175 passed, 175 total
```

### Check TypeScript Compilation

Ensure no compilation errors:

```bash
npm run build
```

You should see no errors in the output.

## Configuration

### OAuth Configuration

Before you can log in, configure an OAuth provider:

1. Open `src/config.ts`
2. Update OAuth settings:

```typescript
export const OAUTH_CONFIG = {
  provider: 'okta', // or 'auth0', 'azure', 'google', 'oidc'
  clientId: 'your-client-id',
  redirectUri: 'http://localhost:3000/oauth/callback',
  authorizationEndpoint: 'https://your-domain/oauth2/authorize',
  tokenEndpoint: 'https://your-domain/oauth2/token',
  scope: 'openid profile email',
};
```

3. Rebuild the project:

```bash
npm run build
```

### API Endpoint

Configure the backend API endpoint in `src/config.ts`:

```typescript
export const API_BASE_URL = 'http://localhost:8080/api/v1';
export const WS_BASE_URL = 'ws://localhost:8080/ws';
```

## First Login

1. **Start the development server**: `npm run dev`
2. **Navigate to** `http://localhost:3000`
3. **Click login** and select your OAuth provider
4. **Authenticate** with your provider
5. **View the dashboard** with agent monitoring

## Common Issues

### Port 3000 Already in Use

Change the port in package.json:

```json
"dev": "browser-sync start --server 'public' --files 'public' --single --port 3001 --no-notify"
```

### OAuth Redirect Error

Ensure your OAuth provider has `http://localhost:3000/oauth/callback` in its allowed redirect URIs.

### TypeScript Compilation Errors

Try cleaning and rebuilding:

```bash
rm -rf public/src
npm run build
```

### Tests Failing

Ensure you're using Node.js 18+:

```bash
node --version  # Should be v18.0.0 or higher
```

## Next Steps

- **Read the docs**: Check out [README.md](../README.md) for detailed information
- **Explore features**: See [docs/features/](./features/) for feature guides
- **Customize theme**: Edit `public/css/variables.css` for colors and spacing
- **Add agents**: Connect backend agents to see real-time monitoring
- **Contribute**: See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines

## Development Workflow

### Typical Development Session

1. **Start development server**:
   ```bash
   npm run dev
   ```

2. **Make changes** to TypeScript files in `src/`

3. **Rebuild** after changes:
   ```bash
   npm run build
   ```
   The browser will auto-reload

4. **Run tests** to ensure nothing breaks:
   ```bash
   npm run test:watch
   ```
   Tests will re-run on file changes

5. **Check for errors**:
   ```bash
   npm run build  # TypeScript errors
   npm test       # Test failures
   ```

### Recommended VS Code Extensions

- **TypeScript** (built-in)
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Test runner integration
- **CSS Variable Autocomplete** - For CSS custom properties

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run dev` | Start development server with live reload |
| `npm start` | Start static server (no live reload) |
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode (TDD) |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:unit` | Run only unit tests |
| `npm run test:integration` | Run only integration tests |
| `npm run openapi-ts` | Regenerate API client from OpenAPI spec |

## Getting Help

- **Documentation**: Check [docs/](./docs/) directory
- **Issues**: Search or create issues on [GitHub](https://github.com/smotra-monitoring/frontend/issues)
- **Community**: Join our discussions
- **Email**: Contact maintainers at support@smotra.dev

## Quick Reference

### Project Structure
```
frontend/
├── src/           # TypeScript source code
├── public/        # Static files (HTML, CSS, compiled JS)
├── tests/         # Test suites
├── docs/          # Documentation
└── api/           # OpenAPI specification
```

### Key Files
- `src/index.ts` - Application entry point
- `src/config.ts` - Configuration
- `public/index.html` - HTML shell
- `public/css/` - Stylesheets
- `tsconfig.json` - TypeScript configuration
- `jest.config.js` - Test configuration

---

**Happy coding!** 🚀

For detailed information, see the full [README.md](../README.md).
