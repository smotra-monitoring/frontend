import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, // Allows using 'describe', 'it', 'vi' without importing
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.ts', 'src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8', // or 'istanbul'
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/api/**', 'src/index.ts'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      }
    },
    // Vitest handles ESM mapping naturally, 
    // but if you have complex aliases, you add them here.
  },
});