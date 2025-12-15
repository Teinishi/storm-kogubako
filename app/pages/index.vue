<script setup lang="ts">
// ツールのデータ定義
// iconは Heroicons (https://heroicons.com/) のクラス名を指定できます
const tools = [
  {
    title: 'ペインタブルブロック変換',
    description: '画像ファイルからペインタブルブロックへ変換します。',
    to: '/img2paint',
    icon: 'i-lucide-image',
  },
];
</script>

<template>
  <UContainer class="py-8 space-y-8">
    <div class="text-center">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        Stormworks 向け Web ツール
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        随時追加予定
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
                {{ tool.title }}
              </h3>
            </div>
          </template>

          <p class="text-sm text-gray-500 leading-relaxed">
            {{ tool.description }}
          </p>

          <template #footer>
            <div class="flex justify-end">
              <span class="text-xs font-medium flex items-center gap-1">
                使ってみる
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
