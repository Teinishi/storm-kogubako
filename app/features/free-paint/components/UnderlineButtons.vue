<script setup lang="ts" generic="T extends PropertyKey">
import type { ButtonProps } from '@nuxt/ui';

export interface Item<T> extends ButtonProps {
  value: T;
}

defineProps<{
  items: readonly Item<T>[];
  buttonProps?: Partial<ButtonProps>;
}>();

const model = defineModel<T>({ required: true });

const buttonRefs = ref<Partial<Record<T, HTMLElement>>>({});

const indicator = computed(() => {
  const button = buttonRefs.value[model.value];
  if (!button) {
    return { left: 0, width: 0 };
  }

  return {
    left: button.offsetLeft,
    width: button.offsetWidth,
  };
});
</script>

<template>
  <div class="relative flex gap-4 p-4">
    <UButton
      v-for="(item, index) in items"
      v-bind="{ ...buttonProps, ...item }"
      :key="index"
      :ref="
        (el) => {
          if (!el) return;
          const htmlEl = (el as any).$el;
          buttonRefs[item.value] = htmlEl as HTMLElement;
        }
      "
      @click="model = item.value"
    >
      <slot v-bind="item" />
    </UButton>

    <div
      class="bg-secondary absolute bottom-0 h-1 rounded-full transition-all duration-200"
      :style="{
        left: `${indicator.left}px`,
        width: `${indicator.width}px`,
      }"
    />
  </div>
</template>
