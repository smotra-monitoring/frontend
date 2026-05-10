# Contributing to Smotra Frontend

Thank you for your interest in contributing to Smotra Frontend! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Documentation](#documentation)

## Code of Conduct

This project follows a code of conduct that promotes respect, collaboration, and inclusivity. By participating, you agree to uphold these values.

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+
- Git
- A code editor (VS Code recommended)

### Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/smotra-frontend.git
   cd smotra-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Generate OpenAPI client** (if backend spec changed)
   ```bash
   npm run openapi-ts
   ```

4. **Build TypeScript**
   ```bash
   npm run build
   ```

5. **Run tests to verify setup**
   ```bash
   npm test
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`

## Development Workflow

### Creating a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b bugfix/issue-description
```

Branch naming conventions:
- `feature/` - New features
- `bugfix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `test/` - Test additions/improvements

### Making Changes

1. **Write code** following the [Code Style](#code-style) guidelines
2. **Add tests** for new functionality
3. **Run tests** to ensure nothing breaks
   ```bash
   npm test
   ```
4. **Build** to check for TypeScript errors
   ```bash
   npm run build
   ```
5. **Test in browser** with development server
   ```bash
   npm run dev
   ```

### Commit Messages

Follow conventional commit format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, no logic change)
- `refactor` - Code refactoring
- `test` - Test additions/changes
- `chore` - Build process or auxiliary tool changes

**Examples:**
```
feat(auth): add support for Azure AD OAuth provider

Implement Azure AD OAuth2 flow with PKCE support.
Includes token management and user profile fetching.

Closes #123
```

```
fix(dashboard): prevent duplicate agent cards on WebSocket reconnect

Dashboard grid was not clearing existing cards before re-rendering
after WebSocket reconnection, causing duplicates.

Fixes #456
```

## Code Style

### TypeScript

- **Use TypeScript strictly** - No `any` types (use `unknown` if needed)
- **Export types** - All types should be in `src/types/` directory
- **ES Modules** - Use `.js` extensions in imports (NodeNext requirement)
  ```typescript
  import { foo } from './bar.js'; // Correct
  import { foo } from './bar'; // Wrong
  ```
- **Named exports** - Prefer named exports over default exports
  ```typescript
  export class MyComponent {} // Good
  export default MyComponent; // Avoid
  ```

### Naming Conventions

- **Classes**: PascalCase - `AgentCard`, `ThemeManager`
- **Functions**: camelCase - `getUserInfo`, `parseQueryString`
- **Constants**: UPPER_SNAKE_CASE - `API_BASE_URL`, `TOKEN_STORAGE_KEY`
- **Files**: kebab-case - `agent-card.ts`, `theme-manager.ts`
- **CSS classes**: BEM-lite - `.agent-card`, `.agent-card__status`, `.agent-card--offline`

### Code Formatting

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Line length**: 100 characters (soft limit)
- **Trailing commas**: Always for multi-line

Run Prettier for automatic formatting:
```bash
npx prettier --write src/**/*.ts
```

Run ESLint for linting:
```bash
npx eslint src/**/*.ts
```

### Component Structure

Components should follow this pattern:

```typescript
/**
 * Brief description of component
 */
export class MyComponent extends BaseComponent {
  // Private properties first
  private data: SomeType;
  
  // Constructor
  constructor(root: HTMLElement, initialData: SomeType) {
    super(root);
    this.data = initialData;
  }
  
  // Public methods
  render(): void {
    // Implementation
  }
  
  // Lifecycle hooks
  onMount(): void {
    // Setup event listeners
  }
  
  onUpdate(prevState: ComponentState): void {
    // Handle state changes
  }
  
  onDestroy(): void {
    // Cleanup event listeners
  }
  
  // Private helper methods last
  private helperMethod(): void {
    // Implementation
  }
}
```

### CSS

- **Mobile-first** - Base styles for mobile, enhance for larger screens
- **CSS Custom Properties** - Use variables from `variables.css`
  ```css
  color: var(--color-text);
  padding: var(--spacing-md);
  ```
- **BEM-lite** - Use block__element--modifier pattern
  ```css
  .agent-card { }
  .agent-card__status { }
  .agent-card--offline { }
  ```
- **Responsive** - Use media queries for breakpoints
  ```css
  /* Mobile base */
  .element { width: 100%; }
  
  /* Desktop enhancement */
  @media (min-width: 1024px) {
    .element { width: 50%; }
  }
  ```

## Testing

### Writing Tests

- **Coverage goal**: 80%+ (90%+ for auth and utils)
- **Test file location**: Mirror `src/` structure in `tests/`
  ```
  src/utils/storage.ts → tests/unit/utils/storage.test.ts
  ```
- **Test structure**: Describe blocks for grouping
  ```typescript
  describe('MyComponent', () => {
    describe('render', () => {
      it('renders agent name', () => {
        // Test implementation
      });
    });
  });
  ```

### Test Types

1. **Unit Tests** - Test individual functions/modules in isolation
   ```typescript
   describe('parseQueryString', () => {
     it('parses simple query string', () => {
       const result = parseQueryString('?foo=bar&baz=qux');
       expect(result).toEqual({ foo: 'bar', baz: 'qux' });
     });
   });
   ```

2. **Component Tests** - Test component rendering and behavior
   ```typescript
   describe('AgentCard', () => {
     it('displays agent status', () => {
       const card = new AgentCard(root, mockAgent);
       card.render();
       expect(root.querySelector('.status-pulse')).toBeInTheDocument();
     });
   });
   ```

3. **Integration Tests** - Test complete flows
   ```typescript
   describe('OAuth Flow', () => {
     it('completes login successfully', async () => {
       // Test complete OAuth flow
     });
   });
   ```

### Running Tests

```bash
# All tests
npm test

# Watch mode (TDD)
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test file
npm test -- storage.test.ts

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration
```

### Test Requirements

Before submitting a PR, ensure:
- ✅ All existing tests pass
- ✅ New features have tests
- ✅ Bug fixes have regression tests
- ✅ Coverage doesn't decrease
- ✅ No console errors/warnings

## Submitting Changes

### Before Submitting

1. **Run all checks**
   ```bash
   npm run build    # TypeScript compilation
   npm test         # All tests pass
   ```

2. **Update documentation** if needed
   - Update README.md for new features
   - Add feature docs to `docs/features/`
   - Update CHANGELOG.md
   - Add JSDoc comments to functions

3. **Check responsive design**
   - Test at mobile (375px), tablet (768px), desktop (1280px)
   - Verify touch targets (44px minimum)
   - Test keyboard navigation

4. **Check accessibility**
   - ARIA labels on interactive elements
   - Keyboard navigation works
   - Screen reader compatible
   - Respects `prefers-reduced-motion`

### Pull Request Process

1. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request** on GitHub
   - Use clear, descriptive title
   - Reference related issues (`Closes #123`)
   - Describe changes and rationale
   - Include screenshots for UI changes
   - Mention breaking changes

3. **PR Template**
   ```markdown
   ## Description
   Brief description of changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
   
   ## Testing
   - [ ] All tests pass
   - [ ] New tests added
   - [ ] Tested in browser
   - [ ] Responsive design verified
   
   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Documentation updated
   - [ ] No new warnings
   
   ## Related Issues
   Closes #123
   
   ## Screenshots (if applicable)
   ```

4. **Address review feedback**
   - Respond to comments
   - Make requested changes
   - Push updates to same branch
   - Re-request review

## Documentation

### Code Documentation

- **JSDoc comments** for all exported functions/classes
  ```typescript
  /**
   * Parse URL query string into object
   * @param queryString - Query string with or without leading '?'
   * @returns Object with key-value pairs
   * @example
   * parseQueryString('?foo=bar') // { foo: 'bar' }
   */
  export function parseQueryString(queryString: string): Record<string, string> {
    // Implementation
  }
  ```

- **Type documentation** with TSDoc
  ```typescript
  /**
   * OAuth configuration for a provider
   */
  export interface OAuthConfig {
    /** OAuth provider name */
    provider: OAuthProvider;
    /** Client ID from provider */
    clientId: string;
    /** Redirect URI for OAuth callback */
    redirectUri: string;
  }
  ```

### Feature Documentation

For new features, add documentation to `docs/features/`:

1. Create markdown file: `docs/features/my-feature.md`
2. Include:
   - Overview and purpose
   - How to use
   - API reference
   - Code examples
   - Configuration options
   - Common issues

### Updating Existing Docs

- **README.md** - Add new features to features list
- **CHANGELOG.md** - Add entry under `[Unreleased]`
- **ROADMAP.md** - Move completed items to ✅ section
- **Feature docs** - Update affected feature guides

## Questions?

If you have questions:
- Check existing documentation
- Search issues on GitHub
- Open a new issue with `question` label
- Reach out to maintainers

## Recognition

Contributors will be recognized in:
- CHANGELOG.md (for significant contributions)
- GitHub contributors list
- Release notes

Thank you for contributing to Smotra Frontend! 🎉
