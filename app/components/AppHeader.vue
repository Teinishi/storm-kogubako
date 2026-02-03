<script setup lang="ts">
import { en, ja } from '@nuxt/ui/locale';

const { locale, setLocale } = useI18n();

const locales = [
  {
    label: en.name,
    value: en.code,
    icon: 'i-circle-flags:gb',
  },
  {
    label: ja.name,
    value: ja.code,
    icon: 'i-circle-flags:jp',
  },
];
</script>

<template>
  <UHeader title="Storm Kogubako">
    <template #right>
      <USelect
        :model-value="locale"
        :items="locales"
        :icon="locales.find(l => l.value === locale)?.icon"
        @update:model-value="setLocale($event as 'en' | 'ja')"
      />

      <UColorModeSwitch />
    </template>
  </UHeader>
</template>
