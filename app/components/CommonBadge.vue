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

const colorMode = useColorMode();

const isDark = computed(() => colorMode.value === 'dark');

const style = computed(() => {
  const colorName = props.color;

  let c;
  if (colorName === 'primary' || colorName === 'secondary') {
    c = themeColors[colorName].shades;
  } else {
    c = tailwindColors[colorName];
  }

  return {
    backgroundColor: c[isDark.value ? '950' : '50'],
    color: c[isDark.value ? '300' : '700'],
    boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${c[isDark.value ? '400' : '600']} 10%, transparent)`,
  };
});
</script>

<template>
  <span
    class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium inset-ring"
    :style="style"
  >
    <slot />
  </span>
</template>
