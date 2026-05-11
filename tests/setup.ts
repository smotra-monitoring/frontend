/**
 * Jest test setup
 * Runs before all tests
 */

// 1. Explicitly import jest and lifecycle hooks for ESM
import { jest, beforeEach } from '@jest/globals';

// 2. TextEncoder/TextDecoder are needed by SubtleCrypto (PKCE code challenge generation)
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

// Mock localStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia
// Define the return type for clarity (optional but helpful)
interface MockMedia {
  matches: boolean;
  media: string;
  onchange: null;
  addListener: any;
  removeListener: any;
  addEventListener: any;
  removeEventListener: any;
  dispatchEvent: any;
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  // Pass the function signature as a generic to jest.fn
  value: jest.fn<(query: string) => MockMedia>().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() { }
  disconnect() { }
  observe() { }
  takeRecords() {
    return [];
  }
  unobserve() { }
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() { }
  disconnect() { }
  observe() { }
  unobserve() { }
} as any;

// Mock crypto.subtle
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: jest.fn<(algorithm: string, data: BufferSource) => Promise<ArrayBuffer>>()
        .mockResolvedValue(new ArrayBuffer(32)),
    },
    getRandomValues: <T extends ArrayBufferView | null>(arr: T): T => {
      if (arr) {
        const uint8 = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
        for (let i = 0; i < uint8.length; i++) {
          uint8[i] = Math.floor(Math.random() * 256);
        }
      }
      return arr;
    },
  },
});

// Clear mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});
