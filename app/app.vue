<script setup lang="ts">
import { ja } from '@nuxt/ui/locale';

useHead({
  titleTemplate: titleChunk => titleChunk ? `${titleChunk} - Storm Kogubako` : 'Storm Kogubako',
});
</script>

<template>
  <UApp :locale="ja">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
