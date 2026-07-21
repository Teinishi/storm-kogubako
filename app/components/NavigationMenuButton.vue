<script setup lang="ts">
const open = useNavMenu();

function toggleSidebar() {
  open.value = !open.value;
}
</script>

<template>
  <UButton
    icon="i-lucide-menu"
    color="neutral"
    variant="ghost"
    aria-label="Toggle sidebar"
    @click="toggleSidebar"
  />
</template>
