<script setup lang="ts">
defineProps<{
  title?: string;
}>();
</script>

<template>
  <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
    <h2
      v-if="title"
      class="font-bold text-lg"
    >
      {{ title }}
    </h2>
    <slot />
  </div>
</template>
