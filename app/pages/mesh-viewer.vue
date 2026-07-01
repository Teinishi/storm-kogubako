<script setup lang="ts">
const { t } = useI18n({
  useScope: 'local',
});

useHead({ title: t('title') });
definePageMeta({ layout: 'app' });

type MeshFileItem = {
  id: number;
  file: File;
  visible: boolean;
  detailsOpen: boolean;
};

const meshFiles = ref<MeshFileItem[]>([]);
const fileUploadModel = ref<File[] | null>(null);
let nextMeshFileId = 1;

const addMeshFiles = (files: File[] | File | null | undefined) => {
  const fileList = Array.isArray(files) ? files : files ? [files] : [];
  if (!fileList.length) return;

  meshFiles.value.push(...fileList.map(file => ({
    id: nextMeshFileId++,
    file,
    visible: true,
    detailsOpen: false,
  })));

  fileUploadModel.value = null;
};

const toggleMeshVisibility = (item: MeshFileItem) => {
  item.visible = !item.visible;
};

const toggleMeshDetails = (item: MeshFileItem) => {
  item.detailsOpen = !item.detailsOpen;
};

const removeMeshFile = (id: number) => {
  meshFiles.value = meshFiles.value.filter(item => item.id !== id);
};

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};
</script>

<template>
  <UContainer class="grow overflow-hidden py-4 grid grid-cols-1 grid-rows-2 lg:grid-cols-12 lg:grid-rows-1 gap-4">
    <div class="lg:col-span-4 flex flex-col gap-4 overflow-y-auto">
      <h1 class="text-2xl font-bold">
        {{ t('title') }}
      </h1>

      <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
        <h2 class="font-bold text-lg">
          {{ t('mesh_files') }}
        </h2>

        <UFileUpload
          v-model="fileUploadModel"
          :label="t('drop_files')"
          :description="t('drop_files_description')"
          :preview="false"
          multiple
          class="w-full"
          @update:model-value="addMeshFiles"
        />

        <div
          v-if="meshFiles.length"
          class="space-y-2"
        >
          <div
            v-for="item in meshFiles"
            :key="item.id"
            class="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
          >
            <div class="flex items-center gap-3 p-3">
              <UButton
                :icon="item.visible ? 'i-lucide-eye' : 'i-lucide-eye-off'"
                color="neutral"
                variant="ghost"
                size="xs"
                :aria-label="item.visible ? t('hide_file') : t('show_file')"
                @click="toggleMeshVisibility(item)"
              />

              <div class="min-w-0 grow">
                <div class="truncate text-sm font-medium">
                  {{ item.file.name }}
                </div>
                <div class="text-xs text-muted">
                  {{ formatFileSize(item.file.size) }}
                </div>
              </div>

              <UButton
                :icon="item.detailsOpen ? 'i-lucide-chevron-up' : 'i-lucide-sliders-horizontal'"
                color="neutral"
                variant="ghost"
                size="xs"
                :aria-label="t('file_settings')"
                @click="toggleMeshDetails(item)"
              />

              <UButton
                icon="i-lucide-trash"
                color="error"
                variant="ghost"
                size="xs"
                :aria-label="t('remove_file')"
                @click="removeMeshFile(item.id)"
              />
            </div>

            <div
              v-if="item.detailsOpen"
              class="border-t border-gray-200 p-3 dark:border-gray-700"
            >
              <div class="text-sm font-medium">
                {{ t('file_settings') }}
              </div>
              <div class="mt-1 text-xs text-muted">
                {{ t('file_settings_placeholder') }}
              </div>
            </div>
          </div>
        </div>

        <UAlert
          v-else
          color="neutral"
          variant="soft"
          icon="i-lucide-info"
          :title="t('no_files')"
          :description="t('no_files_description')"
        />
      </div>
    </div>

    <div class="lg:col-span-8 flex flex-col bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 relative">
      <!-- TODO: Canvas -->
      <div class="m-auto flex flex-col items-center gap-2 p-6 text-center text-muted">
        <UIcon
          name="i-lucide-box"
          class="size-10"
        />
        <div class="text-sm">
          {{ t('viewer_placeholder') }}
        </div>
      </div>
    </div>
  </UContainer>
</template>

<i18n lang="json">
{
  "en": {
    "title": "Mesh Viewer",
    "mesh_files": "Mesh Files",
    "drop_files": "Pick Mesh Files",
    "drop_files_description": "Click, or drop files here",
    "no_files": "No files added",
    "no_files_description": "Drop files to add them to the viewer list.",
    "show_file": "Show file",
    "hide_file": "Hide file",
    "remove_file": "Remove file",
    "file_settings": "File Settings",
    "file_settings_placeholder": "Detailed settings for this file will be added here.",
    "viewer_placeholder": "Mesh preview will appear here."
  },
  "ja": {
    "title": "メッシュビューワー",
    "mesh_files": "メッシュファイル",
    "drop_files": "メッシュファイルを選択",
    "drop_files_description": "クリック、またはファイルをここにドロップ",
    "no_files": "ファイルが追加されていません",
    "no_files_description": "ファイルをドロップするとビューアーのリストに追加されます。",
    "show_file": "ファイルを表示",
    "hide_file": "ファイルを非表示",
    "remove_file": "ファイルを削除",
    "file_settings": "ファイル設定",
    "file_settings_placeholder": "このファイルの詳細設定はここに追加できます。",
    "viewer_placeholder": "メッシュのプレビューはここに表示されます。"
  }
}
</i18n>
