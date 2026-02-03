<script setup lang="ts">
import type { AnchorPosition } from './AnchorPositionSelect.vue';

export type AnchorSettings = {
  anchorPosition: AnchorPosition;
  offsetX: number;
  offsetY: number;
};

const { t } = useI18n({
  useScope: 'local',
});

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  anchorDisabled: {
    type: Boolean,
    default: false,
  },
});
const modelValue = defineModel<AnchorSettings>({ required: true });

const isOffsetZero = computed(() => modelValue.value.offsetX === 0 && modelValue.value.offsetY === 0);

const reset = () => {
  modelValue.value.offsetX = 0;
  modelValue.value.offsetY = 0;
};
</script>

<template>
  <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
    <h2 class="font-bold text-lg">
      {{ props.label }}
    </h2>

    <div class="grid grid-cols-2 gap-4">
      <AnchorPositionSelect
        v-model="modelValue.anchorPosition"
        :disabled="props.anchorDisabled"
        class="row-span-3"
      />

      <UFormField :label="t('x_position')">
        <UInputNumber
          v-model="modelValue.offsetX"
          class="w-full"
        />
      </UFormField>

      <UFormField
        :label="t('y_position')"
        class="self-end"
      >
        <UInputNumber
          v-model="modelValue.offsetY"
          class="w-full"
        />
      </UFormField>

      <UButton
        :disabled="isOffsetZero"
        :color="isOffsetZero ? 'neutral' : 'primary'"
        :label="t('reset')"
        variant="subtle"
        class="w-full justify-center"
        @click="reset"
      />
    </div>
  </div>
</template>

<i18n lang="json">
{
  "en": {
    "x_position": "X Position",
    "y_position": "Y Position",
    "reset": "Reset"
  },
  "ja": {
    "x_position": "X 位置",
    "y_position": "Y 位置",
    "reset": "リセット"
  }
}
</i18n>
