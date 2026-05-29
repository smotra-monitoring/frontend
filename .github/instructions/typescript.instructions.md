---
description: "TypeScript code style rules and multi-config setup (tsconfig.json, tsconfig.build.json, tsconfig.test.json). Use when writing TypeScript source files, configuring builds, or troubleshooting type errors."
applyTo: "src/**/*.ts, tsconfig*.json"
---

# Code Style

- Use camelCase for variable and function names.
- Use PascalCase for class and interface names.
- Use consistent indentation (2 spaces).
- Use semicolons at the end of statements.
- Use single quotes for strings.
- Use descriptive names for variables, functions, and classes.
- Avoid using `any` type in TypeScript; prefer specific types or generics. Use `unknown` if the type is truly unknown.
- Use `.js` extensions in import paths (NodeNext requirement):
  ```typescript
  import { foo } from './bar.js'; // Correct
  import { foo } from './bar';    // Wrong
  ```
- Prefer named exports over default exports.
- Write JSDoc comments for functions and classes.
- Use ESLint and Prettier for code formatting and linting.

# TypeScript Configuration

The project uses a **three-config TypeScript setup** to separate concerns between IDE type-checking, production builds, and test environments.

## Configuration Files

| Configuration | Purpose | Emits JS | Includes | Used By |
|--------------|---------|----------|----------|---------|
| `tsconfig.json` | IDE type-checking | ❌ No | `src/` + `tests/` | VS Code, `tsc --noEmit` |
| `tsconfig.build.json` | Production build | ✅ Yes | `src/` only | `npm run build` |
| `tsconfig.test.json` | Test environment | ❌ No | `src/` + `tests/` | Vitest |

## Key Points

- **tsconfig.json**: Base configuration for VS Code IntelliSense and general type-checking
  - `noEmit: true` for faster type-checking without file system writes
  - Includes both `src/` and `tests/` for complete type coverage
  - Types: `node` and `vitest/globals`

- **tsconfig.build.json**: Production-only compilation
  - `rootDir: "./src"` and `outDir: "./dist"` for clean output structure
  - Generates source maps and declaration files
  - Stricter rules: `noUncheckedIndexedAccess`, `noUncheckedSideEffectImports`
  - Excludes tests from production build

- **tsconfig.test.json**: Test-specific configuration
  - Extends `tsconfig.json` for consistency
  - `rootDir: "."` to allow imports from both `src/` and `tests/`
  - Used automatically by Vitest via `vitest.config.js`

## Commands

```bash
# Type-check everything without emitting files (fast)
npx tsc --noEmit

# Build production code (src → dist)
npm run build  # Uses tsconfig.build.json

# Run tests (uses tsconfig.test.json)
npm test
```

For detailed information, see [docs/TYPESCRIPT_CONFIGURATION.md](../../docs/TYPESCRIPT_CONFIGURATION.md).
