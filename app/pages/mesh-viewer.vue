<script setup lang="ts">
import { TheMeshViewer } from '~/features/mesh-viewer';

const { t: gt } = useI18n({ useScope: 'global' });

useHead({ title: gt('mesh_viewer') });
definePageMeta({ layout: 'app' });
</script>

<template>
  <TheMeshViewer />
</template>
