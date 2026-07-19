import JSZip from 'jszip';

export function useFileSave() {
  const { t } = useI18n({ useScope: 'global' });
  const toast = useToast();

  function saveFile(blob: Blob, filename: string) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);

    toast.add({
      title: t('saving_file'),
      description: t('saving_file_message'),
      icon: 'i-lucide-check',
    });
  }

  async function saveFiles(files: Readonly<{ blob: Blob; filename: string } []>, zipFilename: string) {
    if (files.length == 0) return;
    if (files.length === 1) {
      const file = files[0]!;
      saveFile(file.blob, file.filename);
      return;
    }

    const zip = new JSZip();

    for (const file of files) {
      zip.file(file.filename, file.blob);
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    saveFile(blob, zipFilename);
  }

  return { saveFile, saveFiles };
}
