<script setup lang="ts">
import { TheFreePaint } from '~/features/free-paint';

const { t: gt } = useI18n({ useScope: 'global' });

useHead({ title: gt('free_paint') });
definePageMeta({ layout: 'app' });
</script>

<template>
  <TheFreePaint />
</template>
