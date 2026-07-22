<script setup lang="ts">
import type { ColorName } from './CommonBadge.vue';

const BADGE_TYPES = {
  vanilla: { label: 'Vanilla', color: 'primary' },
  vehicle: { label: 'Vehicle', color: 'zinc' },
  mod: { label: 'Mod', color: 'pink' },
  development: { label: 'Development', color: 'sky' },
} as const;

export type BadgeType = keyof typeof BADGE_TYPES;

const props = defineProps<{
  badges?: string[];
}>();

const { t } = useI18n({ useScope: 'local' });

const items = computed<{ key: string; label: string; color: ColorName }[]>(
  () =>
    props.badges?.map((key) => {
      if (Object.hasOwn(BADGE_TYPES, key)) {
        return {
          key,
          ...BADGE_TYPES[key as BadgeType],
        };
      } else {
        return {
          key,
          label: key,
          color: 'gray',
        };
      }
    }) ?? [],
);
</script>

<template>
  <div v-if="items.length > 0" class="flex flex-wrap gap-2">
    <CommonBadge v-for="item in items" :key="item.key" :color="item.color">
      {{ t(item.key) }}
    </CommonBadge>
  </div>
</template>

<i18n lang="json">
{
  "en": {
    "vanilla": "Vanilla",
    "vehicle": "Vehicle",
    "mod": "Mod",
    "development": "Development"
  },
  "ja": {
    "vanilla": "Vanilla",
    "vehicle": "Vehicle",
    "mod": "Mod",
    "development": "Development"
  }
}
</i18n>
