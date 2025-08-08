import { beforeEach, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock fetch for file loading tests
global.fetch = vi.fn();

// Mock window.open for external editor functionality
Object.defineProperty(window, 'open', {
  writable: true,
  value: vi.fn(),
});

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Suppress console errors during tests unless explicitly needed
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
});

// Mock URL.createObjectURL for file export functionality
Object.defineProperty(URL, 'createObjectURL', {
  value: vi.fn(() => 'mocked-object-url'),
});

Object.defineProperty(URL, 'revokeObjectURL', {
  value: vi.fn(),
});