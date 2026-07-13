<script setup lang="ts">
defineProps<{
  title: string;
}>();
</script>

<template>
  <div class="h-12 px-4 py-2 flex items-center gap-2">
    <NavigationMenuButton />
    <h1 class="text-lg font-bold">
      {{ title }}
    </h1>
  </div>
</template>
