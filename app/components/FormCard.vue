<script setup lang="ts">
defineProps<{
  title?: string;
}>();
</script>

<template>
  <div class="space-y-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
    <h2 v-if="title" class="text-lg font-bold">
      {{ title }}
    </h2>
    <slot />
  </div>
</template>
