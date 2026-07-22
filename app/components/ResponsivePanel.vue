<script setup lang="ts">
const props = defineProps<{
  icon?: string;
  label?: string;
  disabled?: boolean;
}>();

const { isSm } = useResponsive();

const show = ref(false);

function toggle() {
  show.value = !show.value;
}

watch(props, () => {
  if (props.disabled) {
    show.value = false;
  }
});
</script>

<template>
  <ClientOnly>
    <transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-show="isSm || show"
        class="fixed flex h-screen w-screen items-center justify-center overflow-hidden border-gray-200 bg-gray-50 sm:static sm:w-auto sm:border-l dark:border-gray-700 dark:bg-gray-900"
      >
        <slot />
      </div>
    </transition>

    <Teleport v-if="!isSm" to="body">
      <UButton
        :icon="show ? 'i-lucide-x' : icon"
        :label="label"
        :disabled="disabled"
        size="xl"
        class="fixed right-4 bottom-4 rounded-full shadow-lg"
        @click="toggle"
      />
    </Teleport>
  </ClientOnly>
</template>
