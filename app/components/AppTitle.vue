<script setup lang="ts">
const { t: gt } = useI18n({ useScope: 'global' });

const route = useRoute();

const currentTool = computed(() => WEB_TOOLS.find((t) => t.to === route.path));

const props = defineProps<{
  title?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: any;
}>();

const icon = computed(() => {
  if (props.icon !== undefined) return props.icon;
  if (currentTool.value) return currentTool.value.icon;
  return '';
});

const title = computed(() => {
  if (props.title !== undefined) return props.title;
  if (currentTool.value) return gt(currentTool.value.key);
  return '';
});
</script>

<template>
  <div class="flex h-16 items-center gap-2 p-4">
    <NavigationMenuButton />
    <UIcon v-if="icon" :name="icon" class="size-6" />
    <h1 class="text-lg font-bold">
      {{ title }}
    </h1>
    <CommonBadge v-if="currentTool?.isBeta" color="green">Beta</CommonBadge>
  </div>
</template>
