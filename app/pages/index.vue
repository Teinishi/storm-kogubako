<script setup lang="ts">
const { t: gt } = useI18n({ useScope: 'global' });
const { t } = useI18n({ useScope: 'local' });

const web_tools = [
  {
    key: 'img2paint',
    to: '/img2paint',
    icon: 'i-lucide-image',
  },
  {
    key: 'mesh_viewer',
    to: '/mesh-viewer',
    icon: 'i-lucide-box',
  },
];

const other_tools = [
  {
    title: {
      en: 'Blender Mesh Import/Export',
      ja: 'Blender メッシュインポート・エクスポート',
    },
    description: {
      en: 'Add-on for direct import and export .mesh and .phys files on Blender.',
      ja: '.mesh ファイルと .phys ファイルを Blender 上で直接インポート・エクスポートするアドオン',
    },
    to: 'https://github.com/Teinishi/blender_stormworks_mesh?tab=readme-ov-file',
    icon: 'i-simple-icons-blender',
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
      <LinkCard
        v-for="(tool_data, index) in web_tools"
        :key="index"
        :title="gt(tool_data.key)"
        :description="gt(`${tool_data.key}_description`)"
        :to="tool_data.to"
        :icon="tool_data.icon"
      />
    </div>

    <div class="text-center pt-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        {{ t('other_tools') }}
      </h1>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <LinkCard
        v-for="(tool_data, index) in other_tools"
        :key="index"
        :title="tool_data.title"
        :description="tool_data.description"
        :to="tool_data.to"
        :icon="tool_data.icon"
      />
    </div>
  </UContainer>
</template>

<i18n lang="json">
{
  "en": {
    "web_tools_for_stormworks": "Web tools for Stormworks",
    "more_to_come": "More to come",
    "other_tools": "Other tools"
  },
  "ja": {
    "web_tools_for_stormworks": "Stormworks 向け Web ツール",
    "more_to_come": "随時追加予定",
    "other_tools": "その他のツール"
  }
}
</i18n>
