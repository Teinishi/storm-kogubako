<script setup lang="ts">
import { en, ja } from '@nuxt/ui/locale';

const { locale, setLocale } = useI18n();

const locales = [
  {
    label: en.name,
    value: en.code,
  },
  {
    label: ja.name,
    value: ja.code,
  },
];
</script>

<template>
  <USelect
    :model-value="locale"
    :items="locales"
    @update:model-value="setLocale($event as 'en' | 'ja')"
  />
</template>
