<script setup lang="ts">
defineProps<{
  show: boolean;
  title?: string;
  description?: string;
}>();

const { t } = useI18n({ useScope: 'local' });
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-98"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-98"
    >
      <div v-if="show" class="bg-default/70 fixed inset-0 z-9999 backdrop-blur-sm">
        <div class="flex h-full items-center justify-center p-8">
          <div
            class="border-primary bg-default flex w-full max-w-lg flex-col items-center rounded-xl border-2 border-dashed px-12 py-16 shadow-xl"
          >
            <UIcon name="i-lucide-upload" class="text-primary mb-6 size-12" />

            <p class="text-lg font-semibold">
              {{ title ?? t('fileUpload.dropTitle') }}
            </p>

            <p class="text-muted mt-2 text-center text-sm">
              {{ description ?? t('fileUpload.dropDescription') }}
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<i18n lang="json">
{
  "en": {
    "fileUpload": {
      "dropTitle": "Drop files to upload",
      "dropDescription": "Release your files anywhere to upload them."
    }
  },
  "ja": {
    "fileUpload": {
      "dropTitle": "ファイルをドロップ",
      "dropDescription": "ここにドロップするとアップロードできます"
    }
  }
}
</i18n>
