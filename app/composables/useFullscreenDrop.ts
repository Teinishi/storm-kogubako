import type { MaybeRefOrGetter } from 'vue';

export function useFullscreenDrop(
  enabled: MaybeRefOrGetter<boolean>,
  onDrop: (files: File[]) => void,
) {
  const dragging = ref(false);
  let dragCounter = 0;

  function isFileDrag(e: DragEvent) {
    return e.dataTransfer?.types.includes('Files') ?? false;
  }

  useEventListener(window, 'dragenter', (e: DragEvent) => {
    if (!toValue(enabled) || !isFileDrag(e)) return;

    e.preventDefault();
    dragCounter++;

    dragging.value = true;
  });

  useEventListener(window, 'dragleave', (e: DragEvent) => {
    if (!toValue(enabled)) return;

    e.preventDefault();

    dragCounter--;

    if (dragCounter <= 0) {
      dragCounter = 0;
      dragging.value = false;
    }
  });

  useEventListener(window, 'dragover', (e: DragEvent) => {
    if (!toValue(enabled) || !isFileDrag(e)) return;

    e.preventDefault();
  });

  useEventListener(window, 'drop', (e: DragEvent) => {
    if (!toValue(enabled) || !isFileDrag(e)) return;

    e.preventDefault();

    dragging.value = false;
    dragCounter = 0;

    const dropped = [...(e.dataTransfer?.files ?? [])];

    if (!dropped.length) return;

    onDrop(dropped);
  });

  return dragging;
}
