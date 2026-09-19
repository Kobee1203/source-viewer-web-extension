import { beforeEach, vi } from 'vitest';

export const mockBrowser = {
  runtime: {
    sendMessage: vi.fn(),
    getURL: vi.fn((path: string) => `chrome-extension://dummy-id${path}`),
  },
  extension: {
    isAllowedFileSchemeAccess: vi.fn().mockResolvedValue(true),
  },
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
    },
  },
  tabs: {
    query: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({ id: 1 }),
    update: vi.fn().mockResolvedValue({ id: 1 }),
  },
};

vi.mock('wxt/browser', () => ({
  browser: mockBrowser,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockBrowser.extension.isAllowedFileSchemeAccess.mockResolvedValue(true);
  mockBrowser.storage.local.get.mockResolvedValue({});
});
