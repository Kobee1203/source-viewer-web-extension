import { mockBrowser } from '@@/tests/setup';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import background from '@/entrypoints/background';

type ActionClickListener = (tab: { id?: number; url?: string }) => void | Promise<void>;

describe('background entrypoint - action reentrancy guard', () => {
  let onActionClick: ActionClickListener;

  beforeEach(() => {
    mockBrowser.tabs.create.mockResolvedValue({ id: 999 });
    mockBrowser.storage.local.get.mockResolvedValue({ openIn: 'new-tab' });

    // Run the background initialization to register listeners
    (background as unknown as () => void)();

    const calls = mockBrowser.action.onClicked.addListener.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    onActionClick = calls[0]![0] as ActionClickListener;
  });

  it('drops duplicate in-flight action clicks on the same tab', async () => {
    const listeners: Array<(msg: unknown, sender: unknown) => void> = [];
    mockBrowser.runtime.onMessage.addListener.mockImplementation(
      (listener: (msg: unknown, sender: unknown) => void) => {
        listeners.push(listener);
      },
    );

    mockBrowser.scripting.executeScript.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            listeners.forEach((l) =>
              l({ type: 'TAB_SOURCE_CAPTURED', result: { text: 'test', byteSize: 4 } }, { tab: { id: 42 } }),
            );
            resolve([]);
          }, 30);
        }),
    );

    const tab = { id: 42, url: 'https://example.com' };

    // Fire first click (starts in-flight execution)
    void onActionClick(tab);

    // Fire second click concurrently while first is still in-flight
    void onActionClick(tab);

    // Wait for in-flight requests to complete
    await vi.waitFor(() => {
      expect(mockBrowser.tabs.create).toHaveBeenCalled();
    });

    // Wait slightly to let any concurrent resolution finish
    await new Promise((resolve) => setTimeout(resolve, 50));

    // In current code WITHOUT guard: this FAILS because it was called 2 times!
    expect(mockBrowser.tabs.create).toHaveBeenCalledTimes(1);
  });

  it('drops rapid successive action clicks within the 400ms cooldown window', async () => {
    let messageListener: ((msg: unknown, sender: unknown) => void) | undefined;
    mockBrowser.runtime.onMessage.addListener.mockImplementation(
      (listener: (msg: unknown, sender: unknown) => void) => {
        messageListener = listener;
      },
    );

    mockBrowser.scripting.executeScript.mockImplementation(() => {
      messageListener?.({ type: 'TAB_SOURCE_CAPTURED', result: { text: 'test', byteSize: 4 } }, { tab: { id: 42 } });
      return Promise.resolve([]);
    });

    const tab = { id: 42, url: 'https://example.com' };

    // First click completes
    void onActionClick(tab);
    await vi.waitFor(() => {
      expect(mockBrowser.tabs.create).toHaveBeenCalledTimes(1);
    });

    // Second click immediately afterwards (within cooldown window)
    void onActionClick(tab);

    // Wait slightly to give time for second click to potentially execute
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockBrowser.tabs.create).toHaveBeenCalledTimes(1);
  });

  it('allows action clicks on different tabs concurrently', async () => {
    const listeners: Array<(msg: unknown, sender: unknown) => void> = [];
    mockBrowser.runtime.onMessage.addListener.mockImplementation(
      (listener: (msg: unknown, sender: unknown) => void) => {
        listeners.push(listener);
      },
    );

    mockBrowser.scripting.executeScript.mockImplementation((options: { target: { tabId: number } }) => {
      listeners.forEach((l) =>
        l(
          { type: 'TAB_SOURCE_CAPTURED', result: { text: 'test', byteSize: 4 } },
          { tab: { id: options.target.tabId } },
        ),
      );
      return Promise.resolve([]);
    });

    const tabA = { id: 42, url: 'https://example.com' };
    const tabB = { id: 43, url: 'https://example.org' };

    void onActionClick(tabA);
    void onActionClick(tabB);

    await vi.waitFor(() => {
      expect(mockBrowser.tabs.create).toHaveBeenCalledTimes(2);
    });
  });

  it('allows subsequent action click after the cooldown window expires', async () => {
    let messageListener: ((msg: unknown, sender: unknown) => void) | undefined;
    mockBrowser.runtime.onMessage.addListener.mockImplementation(
      (listener: (msg: unknown, sender: unknown) => void) => {
        messageListener = listener;
      },
    );

    mockBrowser.scripting.executeScript.mockImplementation(() => {
      messageListener?.({ type: 'TAB_SOURCE_CAPTURED', result: { text: 'test', byteSize: 4 } }, { tab: { id: 42 } });
      return Promise.resolve([]);
    });

    const tab = { id: 42, url: 'https://example.com' };

    void onActionClick(tab);
    await vi.waitFor(() => {
      expect(mockBrowser.tabs.create).toHaveBeenCalledTimes(1);
    });

    // Wait for the 400ms cooldown to expire
    await new Promise((resolve) => setTimeout(resolve, 450));

    void onActionClick(tab);
    await vi.waitFor(() => {
      expect(mockBrowser.tabs.create).toHaveBeenCalledTimes(2);
    });
  });
});
