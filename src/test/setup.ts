import "@testing-library/jest-dom/vitest";
import { afterEach, beforeAll, vi } from "vitest";

let objectUrlId = 0;

beforeAll(() => {
  URL.createObjectURL = vi.fn(() => `blob:test-${(objectUrlId += 1)}`);
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
});
