<script setup lang="ts">
import UnderlineButtons from './UnderlineButtons.vue';

const TOOLS = [
  {
    value: 'paint',
    label: 'Paint',
    icon: 'i-lucide-paintbrush',
  },
  {
    value: 'addBlocks',
    label: 'Add Blocks',
    icon: 'i-lucide-box',
  },
  {
    value: 'removeBlocks',
    label: 'Remove Blocks',
    icon: 'i-lucide-eraser',
  },
] as const;

export type FreePaintTool = (typeof TOOLS)[number]['value'];

const model = defineModel<FreePaintTool>('tool', { required: true });
</script>

<template>
  <div class="flex h-18 w-full items-center justify-center overflow-hidden bg-black/80">
    <UnderlineButtons v-model="model" :items="TOOLS" :button-props="{ size: 'xl' }" />
  </div>
</template>

<style lang="css" module>
.active {
  position: relative;
}

.active::after {
  content: '';
  position: absolute;
  bottom: -16px;
  left: 0;
  width: 100%;
  height: 4px;
  background-color: var(--ui-color-secondary-500);
}
</style>
