export function useUnsavedChanges(isDirty?: Ref<boolean>) {
  const { t } = useI18n({ useScope: 'global' });

  useEventListener(window, 'beforeunload', (event) => {
    if (import.meta.env.DEV || (isDirty && !isDirty.value)) return;
    event.preventDefault();
  });

  onBeforeRouteLeave(() => {
    if (import.meta.env.DEV || (isDirty && !isDirty.value)) return true;
    return window.confirm(t('confirm_leave'));
  });
}
