<script setup lang="ts">
import tailwindColors from 'tailwindcss/colors';
import themeColors from '~/theme-colors.json';

export type ColorName = keyof typeof themeColors | keyof typeof tailwindColors;

const props = withDefaults(
  defineProps<{
    color?: ColorName;
  }>(),
  {
    color: 'gray',
  },
);

const style = computed(() => {
  const colorName = props.color;

  let c;
  if (colorName === 'primary' || colorName === 'secondary') {
    c = themeColors[colorName].shades;
  } else {
    c = tailwindColors[colorName];
  }

  return {
    '--common-badge-bg-color-light': c['50'],
    '--common-badge-bg-color-dark': c['950'],
    '--common-badge-text-color-light': c['700'],
    '--common-badge-text-color-dark': c['300'],
    '--common-badge-ring-color-light': c['600'],
    '--common-badge-ring-color-dark': c['400'],
  };
});
</script>

<template>
  <span
    class="common-badge inline-flex items-center rounded-md px-2 py-1 text-xs font-medium"
    :style="style"
  >
    <slot />
  </span>
</template>

<style lang="css" scoped>
.common-badge {
  background-color: var(--common-badge-bg-color-light);
  color: var(--common-badge-text-color-light);
  box-shadow: inset 0 0 0 1px
    color-mix(in srgb, var(--common-badge-ring-color-light) 10%, transparent);
}

:root.dark .common-badge {
  background-color: var(--common-badge-bg-color-dark);
  color: var(--common-badge-text-color-dark);
  box-shadow: inset 0 0 0 1px
    color-mix(in srgb, var(--common-badge-ring-color-dark) 10%, transparent);
}
</style>
