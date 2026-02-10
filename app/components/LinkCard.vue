<script setup lang="ts">
const props = defineProps<{
  to: string;
  icon: string;
  title: string | Record<string, string>;
  description: string | Record<string, string>;
}>();

const { t, locale } = useI18n({
  useScope: 'local',
});

const title_text = computed(() => typeof props.title === 'string' ? props.title : props.title[locale.value]);
const description_text = computed(() => typeof props.description === 'string' ? props.description : props.description[locale.value]);
</script>

<template>
  <NuxtLink
    :to="to"
    class="group block h-full"
  >
    <UCard
      class="h-full transition-all duration-300 group-hover:shadow-lg group-hover:ring-2 group-hover:ring-primary-500 group-hover:-translate-y-1"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <UIcon
            :name="icon"
            class="size-8"
          />
          <h3 class="font-semibold text-lg">
            {{ title_text }}
          </h3>
        </div>
      </template>

      <p class="text-sm text-gray-500 leading-relaxed">
        {{ description_text }}
      </p>

      <template #footer>
        <div class="flex justify-end">
          <span class="text-xs font-medium flex items-center gap-1">
            {{ t('try_now') }}
            <UIcon
              name="i-heroicons-arrow-right"
              class="size-3"
            />
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
