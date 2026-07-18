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

  return saveFile;
}
