import { describe, expect, it, vi } from 'vitest';
import { createReentrancyGuard, getViewerActionKey } from '@/utils/reentrancyGuard';

describe('reentrancyGuard', () => {
  describe('getViewerActionKey', () => {
    it('returns link key when isLink is true and rawUrl is present', () => {
      expect(getViewerActionKey(42, 'https://example.com/asset.js', true)).toBe('link:https://example.com/asset.js');
    });

    it('returns tab key when tabId is provided and isLink is false', () => {
      expect(getViewerActionKey(42, 'https://example.com', false)).toBe('tab:42');
    });

    it('returns url key when tabId is undefined but rawUrl is provided', () => {
      expect(getViewerActionKey(undefined, 'https://example.com')).toBe('url:https://example.com');
    });

    it('returns global key when neither tabId nor rawUrl are provided', () => {
      expect(getViewerActionKey()).toBe('global');
    });
  });

  describe('createReentrancyGuard', () => {
    it('executes task immediately on first invocation', async () => {
      const guard = createReentrancyGuard();
      const task = vi.fn().mockResolvedValue(undefined);

      const executed = await guard.run('test-key', task);

      expect(executed).toBe(true);
      expect(task).toHaveBeenCalledTimes(1);
    });

    it('drops concurrent task executions while one is in-flight', async () => {
      const guard = createReentrancyGuard();
      let finishTask: () => void = () => {};
      const slowTask = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            finishTask = resolve;
          }),
      );
      const droppedTask = vi.fn().mockResolvedValue(undefined);

      const firstPromise = guard.run('key-1', slowTask);
      const secondPromise = guard.run('key-1', droppedTask);

      const [firstResult, secondResult] = await Promise.all([
        (async () => {
          finishTask();
          return firstPromise;
        })(),
        secondPromise,
      ]);

      expect(firstResult).toBe(true);
      expect(secondResult).toBe(false);
      expect(slowTask).toHaveBeenCalledTimes(1);
      expect(droppedTask).not.toHaveBeenCalled();
    });

    it('drops rapid task executions within cooldown window after completion', async () => {
      vi.useFakeTimers();
      try {
        const guard = createReentrancyGuard({ cooldownMs: 400 });
        const task1 = vi.fn().mockResolvedValue(undefined);
        const task2 = vi.fn().mockResolvedValue(undefined);

        await guard.run('key-1', task1);
        expect(task1).toHaveBeenCalledTimes(1);

        // Advance 200ms (within 400ms cooldown)
        vi.advanceTimersByTime(200);

        const executedSecond = await guard.run('key-1', task2);
        expect(executedSecond).toBe(false);
        expect(task2).not.toHaveBeenCalled();

        // Advance past 400ms cooldown
        vi.advanceTimersByTime(250);

        const executedThird = await guard.run('key-1', task2);
        expect(executedThird).toBe(true);
        expect(task2).toHaveBeenCalledTimes(1);
      } finally {
        vi.useRealTimers();
      }
    });

    it('allows tasks with different keys to execute concurrently', async () => {
      const guard = createReentrancyGuard();
      let finishTask1: () => void = () => {};
      const task1 = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            finishTask1 = resolve;
          }),
      );
      const task2 = vi.fn().mockResolvedValue(undefined);

      const promise1 = guard.run('key-1', task1);
      const executed2 = await guard.run('key-2', task2);

      finishTask1();
      await promise1;

      expect(executed2).toBe(true);
      expect(task2).toHaveBeenCalledTimes(1);
    });

    it('releases in-flight lock even when the task throws an error', async () => {
      vi.useFakeTimers();
      try {
        const guard = createReentrancyGuard({ cooldownMs: 400 });
        const failingTask = vi.fn().mockRejectedValue(new Error('failure'));
        const nextTask = vi.fn().mockResolvedValue(undefined);

        await expect(guard.run('key-1', failingTask)).rejects.toThrow('failure');

        // Advance past cooldown window
        vi.advanceTimersByTime(450);

        const executedNext = await guard.run('key-1', nextTask);
        expect(executedNext).toBe(true);
        expect(nextTask).toHaveBeenCalledTimes(1);
      } finally {
        vi.useRealTimers();
      }
    });

    it('clears state on reset', async () => {
      const guard = createReentrancyGuard({ cooldownMs: 1000 });
      const task = vi.fn().mockResolvedValue(undefined);

      await guard.run('key-1', task);
      expect(guard.isLocked('key-1')).toBe(true);

      guard.reset();
      expect(guard.isLocked('key-1')).toBe(false);
    });
  });
});
