<script setup lang="ts">
import { type AnchorPosition, ANCHOR_POSITIONS } from '../types';

const { t } = useI18n({ useScope: 'local' });

const props = defineProps<{
  disabled?: boolean;
}>();

const modelValue = defineModel<AnchorPosition>();

function onClick(newValue: AnchorPosition) {
  modelValue.value = newValue;
}
</script>

<template>
  <div class="flex flex-col gap-1">
    <div class="text-sm font-medium text-default">
      {{ t('anchor_position') }}
    </div>

    <div class="grow p-2 bg-default rounded-lg ring ring-inset ring-accented border-0 border-gray-200 dark:border-gray-700 w-full grid grid-cols-[repeat(3,auto)] justify-between content-between gap-2">
      <UButton
        v-for="pos in ANCHOR_POSITIONS"
        :key="pos.value"
        :icon="pos.icon"
        :color="modelValue === pos.value ? 'primary' : 'neutral'"
        :variant="modelValue === pos.value ? 'solid' : 'ghost'"
        size="sm"
        square
        :disabled="props.disabled"
        class="transition-all duration-200"
        @click="onClick(pos.value)"
      />
    </div>
  </div>
</template>

<i18n lang="json">
{
  "en": {
    "anchor_position": "Anchor Position"
  },
  "ja": {
    "anchor_position": "基準位置"
  }
}
</i18n>
