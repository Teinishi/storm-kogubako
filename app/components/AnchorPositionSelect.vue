<script setup lang="ts">
const POSITIONS = [
  { value: 'top-left', icon: 'i-heroicons-arrow-up-left' },
  { value: 'top-center', icon: 'i-heroicons-arrow-up' },
  { value: 'top-right', icon: 'i-heroicons-arrow-up-right' },
  { value: 'mid-left', icon: 'i-heroicons-arrow-left' },
  { value: 'center', icon: 'i-heroicons-plus' },
  { value: 'mid-right', icon: 'i-heroicons-arrow-right' },
  { value: 'bottom-left', icon: 'i-heroicons-arrow-down-left' },
  { value: 'bottom-center', icon: 'i-heroicons-arrow-down' },
  { value: 'bottom-right', icon: 'i-heroicons-arrow-down-right' },
] as const;

export type AnchorPosition = typeof POSITIONS[number]['value'];

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
});
const value = defineModel<AnchorPosition>();
</script>

<template>
  <div class="flex flex-col gap-1">
    <div class="text-sm font-medium text-default">
      基準位置
    </div>

    <div class="grow p-2 bg-default rounded-lg ring ring-inset ring-accented border-0 border-gray-200 dark:border-gray-700 w-full grid grid-cols-[repeat(3,auto)] justify-between content-between gap-2">
      <UButton
        v-for="pos in POSITIONS"
        :key="pos.value"
        :icon="pos.icon"
        :color="value === pos.value ? 'primary' : 'neutral'"
        :variant="value === pos.value ? 'solid' : 'ghost'"
        size="sm"
        square
        :disabled="props.disabled"
        class="transition-all duration-200"
        @click="value = pos.value"
      />
    </div>
  </div>
</template>
