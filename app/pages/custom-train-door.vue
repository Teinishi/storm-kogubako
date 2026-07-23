<script setup lang="ts">
import { TheCustomTrainDoor } from '~/features/custom-train-door';

const { t: gt } = useI18n({ useScope: 'global' });

useHead({ title: gt('custom_train_door') });
definePageMeta({ layout: 'app' });
</script>

<template>
  <TheCustomTrainDoor />
</template>
