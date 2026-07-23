import ConfirmDialog from '~/components/ConfirmDialog.vue';

export function useConfirmDialog() {
  const overlay = useOverlay();

  return async (options: {
    title: string;
    description: string;
    confirmLabel: string;
    cancelLabel: string;
  }): Promise<boolean> => {
    const modal = overlay.create(ConfirmDialog, {
      props: options,
    });

    return await modal.open();
  };
}
