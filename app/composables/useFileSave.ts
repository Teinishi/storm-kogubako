import JSZip from 'jszip';

export type SaveFileEntry = {
  filename: string;
  blob: Blob;
} | {
  filename: string;
  data: string | Uint8Array<ArrayBuffer>;
  type: string;
};

function getBlobFromEntry(file: SaveFileEntry) {
  if ('data' in file && 'type' in file) {
    return new Blob([file.data], { type: file.type });
  }
  else {
    return file.blob;
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

    const zip = new JSZip();

    for (const file of files) {
      zip.file(file.filename, getBlobFromEntry(file));
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    saveFile({ blob, filename: zipFilename });
  }

  return { saveFile, saveFiles };
}
