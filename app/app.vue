<script setup lang="ts">
import * as locales from '@nuxt/ui/locale';

const { locale } = useI18n();

useHead({
  titleTemplate: titleChunk => titleChunk ? `${titleChunk} - Storm Kogubako` : 'Storm Kogubako',
});
</script>

<template>
  <UApp :locale="locales[locale]">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
