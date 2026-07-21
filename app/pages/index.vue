<script setup lang="ts">
const { t: gt } = useI18n({ useScope: 'global' });
const { t } = useI18n({ useScope: 'local' });
</script>

<template>
  <UContainer class="py-8 space-y-8">
    <div class="text-center">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        {{ gt('web_tools_for_stormworks') }}
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        {{ t('more_to_come') }}
      </p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <LinkCard
        v-for="(tool_data, index) in WEB_TOOLS"
        :key="index"
        :title="gt(tool_data.key)"
        :description="gt(`${tool_data.key}_description`)"
        :to="tool_data.to"
        :icon="tool_data.icon"
      />
    </div>

    <div class="text-center pt-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        {{ gt('other_tools') }}
      </h1>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <LinkCard
        v-for="(tool_data, index) in OTHER_TOOLS"
        :key="index"
        :title="gt(tool_data.key)"
        :description="gt(`${tool_data.key}_description`)"
        :to="tool_data.to"
        :icon="tool_data.icon"
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
