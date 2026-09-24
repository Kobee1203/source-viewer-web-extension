import { type Ref, onMounted, onUnmounted, ref } from 'vue';

export interface UseViewerDragAndDropOptions {
  onDropDirectory: (dataTransfer: DataTransfer) => Promise<boolean>;
  onDropFile: (file: File) => void | Promise<void>;
}

export interface UseViewerDragAndDropReturn {
  isDragging: Ref<boolean>;
}

/**
 * Manages window-level drag-and-drop listeners for files and directories.
 */
export function useViewerDragAndDrop(options: UseViewerDragAndDropOptions): UseViewerDragAndDropReturn {
  const isDragging = ref(false);

  function onDragOver(event: DragEvent): void {
    event.preventDefault();
    isDragging.value = true;
  }

  function onDragLeave(event: DragEvent): void {
    if (event.relatedTarget === null) {
      isDragging.value = false;
    }
  }

  async function onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    isDragging.value = false;
    if (!event.dataTransfer) return;

    const handled = await options.onDropDirectory(event.dataTransfer);
    if (handled) return;

    const file = event.dataTransfer.files?.[0];
    if (file) {
      await options.onDropFile(file);
    }
  }

  function handleDrop(event: DragEvent): void {
    void onDrop(event);
  }

  onMounted(() => {
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', handleDrop);
  });

  onUnmounted(() => {
    window.removeEventListener('dragover', onDragOver);
    window.removeEventListener('dragleave', onDragLeave);
    window.removeEventListener('drop', handleDrop);
  });

  return {
    isDragging,
  };
}
