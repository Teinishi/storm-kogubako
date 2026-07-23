<script setup lang="ts">
export interface ConfirmDialogProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: any;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
}

defineProps<ConfirmDialogProps>();

const emit = defineEmits<{
  close: [boolean];
}>();

function confirm() {
  emit('close', true);
}

function cancel() {
  emit('close', false);
}
</script>

<template>
  <UModal :dismissible="false">
    <template #header>
      <UIcon v-if="icon" :name="icon" class="size-6" />
      <h2 class="text-lg font-semibold">
        {{ title }}
      </h2>
    </template>

    <template #body>
      <div class="space-y-4">
        <p class="text-muted text-sm">
          {{ description }}
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="ghost" @click="cancel">
          {{ cancelLabel }}
        </UButton>

        <UButton color="primary" @click="confirm">
          {{ confirmLabel }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
