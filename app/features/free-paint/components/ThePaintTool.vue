<script setup lang="ts">
const TOOLS = [
  {
    icon: 'i-lucide-paintbrush',
    mode: 'pixel',
  },
  {
    icon: 'i-lucide-paint-roller',
    mode: 'surface',
  },
];

const COLORS = [
  { r: 255, g: 255, b: 255 },
  { r: 194, g: 195, b: 199 },
  { r: 150, g: 150, b: 150 },
  { r: 110, g: 110, b: 110 },
  { r: 69, g: 69, b: 69 },
  { r: 20, g: 20, b: 20 },
  { r: 143, g: 0, b: 0 },
  { r: 255, g: 0, b: 43 },
  { r: 255, g: 127, b: 39 },
  { r: 253, g: 165, b: 2 },
  { r: 255, g: 231, b: 39 },
  { r: 0, g: 226, b: 50 },
  { r: 0, g: 158, b: 29 },
  { r: 0, g: 131, b: 49 },
  { r: 41, g: 173, b: 255 },
  { r: 0, g: 89, b: 255 },
  { r: 32, g: 51, b: 123 },
  { r: 126, g: 37, b: 83 },
  { r: 255, g: 119, b: 168 },
  { r: 255, g: 204, b: 180 },
  { r: 171, g: 82, b: 54 },
  { r: 61, g: 31, b: 31 },
  { r: 67, g: 52, b: 40 },
  { r: 69, g: 82, b: 51 },
  { r: 45, g: 73, b: 46 },
  { r: 36, g: 60, b: 85 },
].map(rgbToHex);

const modeModel = defineModel<'pixel' | 'surface' | string>('mode', { required: true });
const modelColor = defineModel<string>('color', { required: true });
</script>

<template>
  <div class="flex flex-col items-center gap-3 p-4">
    <UPopover :ui="{ content: 'bg-black/80 ring-none overflow-hidden' }">
      <UButton class="h-14 w-14 justify-center rounded-full">
        <UIcon name="i-lucide-paintbrush" class="size-8" />
      </UButton>
      <template #content>
        <div class="flex">
          <div v-for="tool in TOOLS" :key="tool.mode" class="relative p-2">
            <UButton class="h-14 w-14 justify-center rounded-full" @click="modeModel = tool.mode">
              <UIcon :name="tool.icon" class="size-8" />
            </UButton>
            <div
              v-show="modeModel === tool.mode"
              class="bg-secondary absolute right-0 bottom-0 left-0 h-1 w-full"
            />
          </div>
        </div>
      </template>
    </UPopover>
    <div class="grid grid-cols-2 gap-2">
      <div
        v-for="(color, index) in COLORS"
        :key="index"
        class="hover:border-primary h-7 w-7 rounded-full border-2 border-gray-50"
        :style="{ backgroundColor: color }"
        @click="modelColor = color"
      />
    </div>
    <ColorPicker v-model="modelColor">
      <button
        class="hover:border-primary h-14 w-14 rounded-full border-4 border-gray-50"
        :style="{ backgroundColor: modelColor }"
      />
    </ColorPicker>
  </div>
</template>
