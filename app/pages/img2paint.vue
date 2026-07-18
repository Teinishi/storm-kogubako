<script setup lang="ts">
import TheImg2Paint from '~/features/img2paint/components/TheImg2Paint.vue';

const { t: gt } = useI18n({ useScope: 'global' });

useHead({ title: gt('img2paint') });
definePageMeta({ layout: 'app' });
</script>

<template>
  <TheImg2Paint />
</template>
