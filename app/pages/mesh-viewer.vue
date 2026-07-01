<script setup lang="ts">
const { t } = useI18n({
  useScope: 'local',
});

useHead({ title: t('title') });
definePageMeta({ layout: 'app' });
</script>

<template>
  <UContainer class="grow overflow-hidden py-4 grid grid-cols-1 grid-rows-2 lg:grid-cols-12 lg:grid-rows-1 gap-4" />
</template>

<i18n lang="json">
{
  "en": {
    "title": "Mesh Viewer"
  },
  "ja": {
    "title": "メッシュビューワー"
  }
}
</i18n>
