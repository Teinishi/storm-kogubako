import type { PolygonEditor } from './usePolygonEditor';

export const editorKey = Symbol() as InjectionKey<PolygonEditor>;

export function providePolygonEditor(editor: PolygonEditor) {
  provide(editorKey, editor);
}

export function usePolygonEditorContext() {
  const editor = inject(editorKey);
  if (!editor) {
    throw new Error('Editor context not found');
  }
  return editor;
}
