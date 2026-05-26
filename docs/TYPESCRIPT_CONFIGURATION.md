# TypeScript Configuration Strategy

Smotra Frontend uses a **three-config TypeScript setup** to separate concerns between IDE type-checking, production builds, and test environments. This approach provides optimal developer experience while maintaining strict type safety.

## Overview

| Configuration | Purpose | Emits JS | Includes | Used By |
|--------------|---------|----------|----------|---------|
| `tsconfig.json` | IDE type-checking | ❌ No | `src/` + `tests/` | VS Code, `tsc --noEmit` |
| `tsconfig.build.json` | Production build | ✅ Yes | `src/` only | `npm run build` |
| `tsconfig.test.json` | Test environment | ❌ No | `src/` + `tests/` | Vitest, VS Code |

## Configuration Files

### tsconfig.json - Base Configuration

**Purpose**: Primary configuration for VS Code IntelliSense and general type-checking.

**Key Settings**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "moduleResolution": "nodenext",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "types": ["node", "vitest/globals"],
    "strict": true,
    "jsx": "react-jsx",
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "noEmit": true  // 🔑 Type-checking only, no JS output
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

**Why `noEmit: true`?**
- VS Code doesn't need compiled output for IntelliSense
- Faster type-checking without file system writes
- Catches errors in both `src/` and `tests/` simultaneously
- Prevents accidental compilation on save

**Type Declarations**:
- `node`: Core Node.js APIs (process, Buffer, etc.)
- `vitest/globals`: Test globals (describe, it, expect, etc.)

### tsconfig.build.json - Production Build

**Purpose**: Compile production-ready JavaScript for the `public/` directory.

**Key Settings**:
```json
{
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "target": "ES2020",
    "module": "NodeNext",
    "types": ["node"],  // ❌ No vitest/globals
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": false,  // Generated API code compatibility
    "strict": true,
    "noUncheckedSideEffectImports": true,
    "moduleDetection": "force"
    // ❌ No noEmit - actually generates JS files
  }
}
```

**Build-Specific Features**:
- **`rootDir: "./src"`**: Only source code, excludes tests
- **`outDir: "./dist"`**: Compiled output directory
- **`sourceMap: true`**: Debug original TypeScript in browser
- **`declaration: true`**: Generate `.d.ts` files for type checking
- **`declarationMap: true`**: Map `.d.ts` back to source for IDE navigation

**Stricter Rules**:
- **`noUncheckedIndexedAccess`**: Requires checking array/object access
  ```typescript
  const arr = [1, 2, 3];
  const item = arr[5]; // Type: number | undefined (not just number)
  ```
- **`noUncheckedSideEffectImports`**: Prevents silent side-effect imports
  ```typescript
  import 'some-module'; // Error: must be explicit
  import {} from 'some-module'; // OK: explicitly empty
  ```

**Why exclude tests from build?**
- Tests should never be in production bundles
- Test dependencies (Vitest) not needed in build
- Smaller output, faster build times

### tsconfig.test.json - Test Environment

**Purpose**: Specialized configuration for Vitest test runner and test-related IDE features.

**Key Settings**:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "rootDir": ".",  // 🔑 Allows both /src and /tests
    "noEmit": true,
    "types": ["node", "vitest/globals"]
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

**Why extend `tsconfig.json`?**
- Inherits base compiler options (strict mode, module system)
- Overrides only what's necessary for tests
- Maintains consistency with main configuration

**Why `rootDir: "."`?**
- Tests import from both `src/` and `tests/` directories
- Allows relative imports across these boundaries
- Without this, TypeScript would complain about files outside rootDir

**Test-Specific Types**:
- Vitest globals (describe, it, expect, beforeEach, etc.)
- jsdom types for DOM testing
- Test utilities and mocks

## Usage Patterns

### Development Workflow

1. **Edit code in VS Code**: `tsconfig.json` provides real-time type-checking
2. **Run build**: `npm run build` uses `tsconfig.build.json` to compile
3. **Run tests**: `vitest` uses `tsconfig.test.json` for test environment

### Commands

```bash
# Type-check everything (src + tests) without emitting files
npx tsc --noEmit

# Build production code only (src → dist)
npm run build  # Uses tsconfig.build.json

# Run tests (uses tsconfig.test.json via vitest.config.js)
npm test

# Watch mode for development
npm run test:watch
```

### VSCode Integration

VS Code automatically uses `tsconfig.json` for:
- IntelliSense (autocomplete)
- Type errors in the Problems panel
- Go to Definition
- Refactoring

To switch between configs:
- Click TypeScript version in status bar
- Select "Select TypeScript Version..."
- Choose workspace version

## Design Rationale

### Why Three Configs?

**Problem**: Different environments have different requirements:
- IDE needs to see everything (src + tests)
- Production build should only include src
- Tests need special globals and relaxed rules

**Solution**: Separate configs for each use case:
1. **Base config** (`tsconfig.json`): Shared settings, IDE default
2. **Build config** (`tsconfig.build.json`): Production-only, stricter
3. **Test config** (`tsconfig.test.json`): Test-specific, extends base

### Why `noEmit` in Base Config?

Without `noEmit`, VS Code might trigger compilation on every save:
- Slower type-checking
- Unnecessary disk writes
- Potential conflicts with build process

With `noEmit`, VS Code only type-checks:
- Instant error feedback
- No side effects
- Works alongside build process

### Why Not Use `references`?

TypeScript Project References (`references` + `composite`) is an alternative approach:
```json
{
  "references": [
    { "path": "./tsconfig.src.json" },
    { "path": "./tsconfig.test.json" }
  ]
}
```

**We chose not to use references because**:
- More complexity for minimal benefit in our case
- Requires `composite: true` which changes output structure
- Build process is already simple (single `tsc` call)
- Three separate configs is clearer and easier to understand

For larger monorepos with many packages, Project References would make sense.

## Troubleshooting

### Issue: VS Code shows errors in tests that aren't real

**Symptom**: VS Code highlights test files with errors like "Cannot find name 'describe'"

**Solution**: VS Code is using `tsconfig.build.json` instead of `tsconfig.json`
1. Open Command Palette (Cmd/Ctrl + Shift + P)
2. Type "TypeScript: Select TypeScript Version"
3. Choose "Use Workspace Version"
4. Reload window

### Issue: Build succeeds but VS Code shows errors

**Symptom**: `npm run build` completes successfully, but VS Code Problems panel shows errors

**Cause**: VS Code uses `tsconfig.json` (includes tests), build uses `tsconfig.build.json` (src only)

**Solution**: Check which files have errors:
- Errors in `tests/`: These won't affect production build (safe to ignore for build purposes)
- Errors in `src/`: Must be fixed for production

### Issue: Import errors with `.js` extensions

**Symptom**: 
```typescript
import { foo } from './bar.js'; // VS Code error: Cannot find module
```

**Cause**: `moduleResolution: "nodenext"` requires `.js` extensions even for `.ts` files

**Solution**: This is correct! NodeNext resolution requires extensions. The error might be:
1. File doesn't exist
2. Wrong relative path
3. VS Code needs reload: Cmd/Ctrl + Shift + P → "Developer: Reload Window"

### Issue: Tests fail with module resolution errors

**Symptom**: Vitest can't find imports, shows "Cannot find module"

**Cause**: `vitest.config.js` not configured to use `tsconfig.test.json`

**Solution**: Check `vitest.config.js`:
```javascript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    // Should use tsconfig.test.json automatically
  },
});
```

### Issue: Build output in wrong location

**Symptom**: Compiled JS files appear in unexpected directories

**Cause**: `outDir` in `tsconfig.build.json` might be wrong

**Solution**: Verify:
```json
{
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"  // Relative to project root
  }
}
```

Files in `src/components/foo.ts` → `dist/components/foo.js`

## Best Practices

### ✅ Do

- Use `tsconfig.json` as the base configuration
- Keep build config strict (`noUncheckedIndexedAccess`, etc.)
- Use `noEmit: true` for type-checking configs
- Extend base config in specialized configs
- Document config choices in comments

### ❌ Don't

- Don't compile tests in production build
- Don't use `any` types (defeats purpose of TypeScript)
- Don't mix `rootDir` and files outside it
- Don't commit compiled output to git
- Don't modify generated API client files

### Testing Changes to Configs

After modifying TypeScript configs:

```bash
# 1. Verify base config
npx tsc --noEmit

# 2. Verify build config
npm run build

# 3. Verify test config
npm test

# 4. Clean and rebuild
rm -rf dist public/src
npm run build
```

## Future Enhancements

Possible improvements to consider:

- **Incremental compilation**: Add `incremental: true` to speed up builds
- **Project references**: For monorepo with multiple packages
- **Stricter rules**: Enable `noUnusedLocals`, `noUnusedParameters` when codebase stabilizes
- **Path mapping**: Add `paths` for cleaner imports (e.g., `@/components`)

## Related Documentation

- [Getting Started](GETTING_STARTED.md) - Basic setup and build commands
- [Architecture](ARCHITECTURE.md) - Overall project structure
- [Contributing](CONTRIBUTING.md) - Development workflow
- [Testing](testing/TESTING_SUMMARY.md) - Test configuration and strategy

## References

- [TypeScript Handbook - tsconfig.json](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html)
- [TypeScript: Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
- [NodeNext Module Resolution](https://www.typescriptlang.org/docs/handbook/modules/reference.html#node16-nodenext)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
