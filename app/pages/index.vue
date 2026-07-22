<script setup lang="ts">
const { t: gt } = useI18n({ useScope: 'global' });
const { t } = useI18n({ useScope: 'local' });
</script>

<template>
  <UContainer class="space-y-8 py-8">
    <div class="text-center">
      <h1 class="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
        {{ gt('web_tools_for_stormworks') }}
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        {{ t('more_to_come') }}
      </p>
    </div>

    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <LinkCard
        v-for="(toolData, index) in WEB_TOOLS"
        :key="index"
        :title="gt(toolData.key)"
        :description="gt(`${toolData.key}_description`)"
        :to="toolData.to"
        :icon="toolData.icon"
        :tags="toolData.tags"
        :is-beta="toolData.isBeta"
      />
    </div>

    <div class="pt-8 text-center">
      <h1 class="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
        {{ gt('other_tools') }}
      </h1>
    </div>

    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <LinkCard
        v-for="(toolData, index) in OTHER_TOOLS"
        :key="index"
        :title="gt(toolData.key)"
        :description="gt(`${toolData.key}_description`)"
        :to="toolData.to"
        :icon="toolData.icon"
        :tags="toolData.tags"
        :is-beta="toolData.isBeta"
      />
    </div>
  </UContainer>
</template>

<i18n lang="json">
{
  "en": {
    "more_to_come": "More to come"
  },
  "ja": {
    "more_to_come": "随時追加予定"
  }
}
</i18n>
