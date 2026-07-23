import ConfirmDialog from '~/components/ConfirmDialog.vue';
import type { ConfirmDialogProps } from '~/components/ConfirmDialog.vue';
import InputDialog from '~/components/InputDialog.vue';
import type { InputDialogProps } from '~/components/InputDialog.vue';

export function useDialog() {
  const overlay = useOverlay();

  async function confirm(props: ConfirmDialogProps): Promise<boolean> {
    const modal = overlay.create(ConfirmDialog, { props });

    return await modal.open();
  }

  async function input(props: InputDialogProps): Promise<string | null> {
    const modal = overlay.create(InputDialog, { props });

    return await modal.open();
  }

  return { confirm, input };
}
