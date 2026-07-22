<script setup lang="ts">
const props = defineProps<{
  text: string;
}>();

const { t } = useI18n({ useScope: 'local' });
const { copy, copied } = useClipboard();
const toast = useToast();

async function onClick() {
  await copy(props.text);
  toast.add({
    icon: 'i-lucide-check',
    title: t('copied'),
  });
}
</script>

<template>
  <div class="bg-muted relative rounded p-3 font-mono text-sm">
    {{ text }}
    <UButton
      :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
      size="xs"
      variant="ghost"
      class="absolute top-2.5 right-2.5"
      @click="onClick"
    />
  </div>
</template>

<i18n lang="json">
{
  "en": {
    "copied": "Copied"
  },
  "ja": {
    "copied": "コピーしました"
  }
}
</i18n>
