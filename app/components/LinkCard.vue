<script setup lang="ts">
const props = defineProps<{
  to: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  title: string | Record<string, string>;
  description: string | Record<string, string>;
  tags?: string[];
  isBeta?: boolean;
}>();

const { t, locale } = useI18n({ useScope: 'local' });

const title_text = computed(() =>
  typeof props.title === 'string' ? props.title : props.title[locale.value],
);
const description_text = computed(() =>
  typeof props.description === 'string' ? props.description : props.description[locale.value],
);
</script>

<template>
  <NuxtLink :to="to" class="group block h-full">
    <UCard
      class="group-hover:ring-primary-500 h-full transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:ring-2"
      :ui="{ root: 'flex flex-col', body: 'flex-1' }"
    >
      <template #header>
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <UIcon :name="icon" class="size-8" />
            <h3 class="text-lg font-semibold">
              {{ title_text }}
            </h3>
            <CommonBadge v-if="isBeta" color="green">Beta</CommonBadge>
          </div>

          <ToolBadges :badges="tags" />
        </div>
      </template>

      <p class="text-sm leading-relaxed text-gray-500">
        {{ description_text }}
      </p>

      <template #footer>
        <div class="flex justify-end">
          <span class="flex items-center gap-1 text-xs font-medium">
            {{ t('try_now') }}
            <UIcon name="i-lucide-arrow-right" class="size-3" />
          </span>
        </div>
      </template>
    </UCard>
  </NuxtLink>
</template>

<i18n lang="json">
{
  "en": {
    "try_now": "Try now"
  },
  "ja": {
    "try_now": "使ってみる"
  }
}
</i18n>
