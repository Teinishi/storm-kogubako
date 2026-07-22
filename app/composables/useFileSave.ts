import JSZip from 'jszip';

export type SaveFileEntry =
  | {
      filename: string;
      blob: Blob;
    }
  | {
      filename: string;
      data: string | Uint8Array<ArrayBuffer>;
      mimetype: string;
    };

export type SaveZipNode =
  | {
      type: 'file';
      entry: SaveFileEntry;
    }
  | {
      type: 'folder';
      name: string;
      content: SaveZipNode[];
    };

function getBlobFromEntry(file: DeepReadonly<SaveFileEntry>) {
  if ('data' in file && 'mimetype' in file) {
    return new Blob([file.data], { type: file.mimetype });
  } else {
    return file.blob;
  }
}

function writeToZip(zip: JSZip, items: DeepReadonly<SaveZipNode[]>) {
  for (const item of items) {
    if (item.type === 'file') {
      zip.file(item.entry.filename, getBlobFromEntry(item.entry));
    } else {
      const folder = zip.folder(item.name);
      if (folder === null) throw new Error(`Failed to create folder "${item.name}" in zip.`);
      writeToZip(folder, item.content);
    }
  }
}

export function useFileSave() {
  const { t } = useI18n({ useScope: 'global' });
  const toast = useToast();

  function saveFile(file: Readonly<SaveFileEntry>) {
    const blob = getBlobFromEntry(file);

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = file.filename;
    link.click();
    URL.revokeObjectURL(link.href);

    toast.add({
      title: t('saved_file_toast', { name: file.filename }),
      description: t('saved_file_toast_message'),
      icon: 'i-lucide-check',
    });
  }

  async function saveFiles(files: Readonly<SaveFileEntry[]>, zipFilename: string) {
    if (files.length == 0) return;
    if (files.length === 1) {
      const file = files[0]!;
      saveFile(file);
      return;
    }

    saveZip(
      files.map((entry) => ({ type: 'file', entry })),
      zipFilename,
    );
  }

  async function saveZip(files: DeepReadonly<SaveZipNode[]>, zipFilename: string) {
    if (files.length === 0) return;

    const zip = new JSZip();
    writeToZip(zip, files);
    const blob = await zip.generateAsync({ type: 'blob' });
    saveFile({ blob, filename: zipFilename });
  }

  function handleError(callback: () => void) {
    try {
      callback();
    } catch (e) {
      let description;
      if (e instanceof Error) {
        description = e.toString();
      }
      toast.add({
        title: t('error_occured'),
        description,
        icon: 'i-lucide-circle-alert',
        color: 'error',
      });
      console.error(e);
    }
  }

  return { saveFile, saveFiles, saveZip, handleError };
}
