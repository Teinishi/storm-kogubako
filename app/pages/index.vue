<script setup lang="ts">
const { t, locale } = useI18n({
  useScope: 'local',
});

const tools = [
  {
    title: {
      en: 'Image to Paintable Signs',
      ja: 'ペインタブルブロック変換',
    },
    description: {
      en: 'Convert an image file to paintable signs for a vehicle.',
      ja: '画像ファイルからペインタブルブロックへ変換します。',
    },
    to: '/img2paint',
    icon: 'i-lucide-image',
  },
];
</script>

<template>
  <UContainer class="py-8 space-y-8">
    <div class="text-center">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        {{ t('web_tools_for_stormworks') }}
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        {{ t('more_to_come') }}
      </p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <NuxtLink
        v-for="(tool, index) in tools"
        :key="index"
        :to="tool.to"
        class="group block h-full"
      >
        <UCard
          class="h-full transition-all duration-300 hover:shadow-lg hover:ring-2 hover:ring-primary-500 hover:-translate-y-1"
        >
          <template #header>
            <div class="flex items-center gap-3">
              <UIcon
                :name="tool.icon"
                class="size-8"
              />
              <h3 class="font-semibold text-lg">
                {{ tool.title[locale] }}
              </h3>
            </div>
          </template>

          <p class="text-sm text-gray-500 leading-relaxed">
            {{ tool.description[locale] }}
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
    </div>
  </UContainer>
</template>

<i18n lang="json">
{
  "en": {
    "web_tools_for_stormworks": "Web tools for Stormworks",
    "more_to_come": "More to come",
    "try_now": "Try now"
  },
  "ja": {
    "web_tools_for_stormworks": "Stormworks 向け Web ツール",
    "more_to_come": "随時追加予定",
    "try_now": "使ってみる"
  }
}
</i18n>
