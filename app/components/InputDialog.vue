<script setup lang="ts">
export interface InputDialogProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: any;
  title: string;
  description?: string;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  cancelLabel: string;
  confirmLabel: string;
}

const props = defineProps<InputDialogProps>();

const emit = defineEmits<{
  close: [string | null];
}>();

const value = ref(props.defaultValue ?? '');

function confirm() {
  emit('close', value.value);
}

function cancel() {
  emit('close', null);
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
        <p v-if="description" class="text-muted text-sm">
          {{ description }}
        </p>

        <UFormField v-if="label" :label="label">
          <UInput
            v-model="value"
            :placeholder="placeholder"
            autofocus
            class="w-full"
            @keyup.enter="confirm"
            @keyup.esc="cancel"
          />
        </UFormField>

        <UInput
          v-else
          v-model="value"
          :placeholder="placeholder"
          autofocus
          class="w-full"
          @keyup.enter="confirm"
          @keyup.esc="cancel"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="ghost" @click="cancel">
          {{ cancelLabel }}
        </UButton>

        <UButton @click="confirm">
          {{ confirmLabel }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
