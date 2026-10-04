import { withSetup } from '@@/tests/helpers/withSetup';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useViewerDragAndDrop } from '@/composables/viewer/useViewerDragAndDrop';

describe('useViewerDragAndDrop', () => {
  let addSpy: ReturnType<typeof vi.spyOn>;
  let removeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addSpy = vi.spyOn(window, 'addEventListener');
    removeSpy = vi.spyOn(window, 'removeEventListener');
  });

  it('manages drag state and calls appropriate drop handlers', async () => {
    const onDropDirectory = vi.fn().mockResolvedValue(false);
    const onDropFile = vi.fn().mockResolvedValue(undefined);

    const [result, app] = withSetup(() => useViewerDragAndDrop({ onDropDirectory, onDropFile }));

    expect(addSpy).toHaveBeenCalledWith('dragover', expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith('dragleave', expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith('drop', expect.any(Function));
    expect(result.isDragging.value).toBe(false);

    // Simulate dragover
    const dragOverEvent = new Event('dragover', { bubbles: true, cancelable: true });
    window.dispatchEvent(dragOverEvent);
    expect(result.isDragging.value).toBe(true);

    // Simulate dragleave to external window
    const dragLeaveEvent = new Event('dragleave', { bubbles: true, cancelable: true });
    Object.defineProperty(dragLeaveEvent, 'relatedTarget', { value: null });
    window.dispatchEvent(dragLeaveEvent);
    expect(result.isDragging.value).toBe(false);

    // Simulate drop with file
    const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    const dropEvent = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [mockFile],
      },
    });
    window.dispatchEvent(dropEvent);

    await vi.waitFor(() => {
      expect(onDropDirectory).toHaveBeenCalled();
      expect(onDropFile).toHaveBeenCalledWith(mockFile);
    });

    app.unmount();
    expect(removeSpy).toHaveBeenCalledWith('dragover', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('dragleave', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('drop', expect.any(Function));
  });

  it('stops processing when directory drop is handled', async () => {
    const onDropDirectory = vi.fn().mockResolvedValue(true);
    const onDropFile = vi.fn().mockResolvedValue(undefined);

    const [, app] = withSetup(() => useViewerDragAndDrop({ onDropDirectory, onDropFile }));

    const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    const dropEvent = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [mockFile],
      },
    });
    window.dispatchEvent(dropEvent);

    await vi.waitFor(() => {
      expect(onDropDirectory).toHaveBeenCalled();
      expect(onDropFile).not.toHaveBeenCalled();
    });

    app.unmount();
  });
});
