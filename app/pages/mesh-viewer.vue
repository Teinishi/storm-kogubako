<script setup lang="ts">
import { parseMeshData, type MeshData } from 'sw-mesh-viewer/parser';

const { t: gt } = useI18n({ useScope: 'global' });
const { t } = useI18n({ useScope: 'local' });

useHead({ title: gt('mesh_viewer') });
definePageMeta({ layout: 'app' });

const toast = useToast();

type ItemProperties = {
  kind: 'mesh';
  enablePaintcolor: boolean;
  paintColor1: string;
  paintColor2: string;
  paintColor3: string;
} | {
  kind: 'phys';
};

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface MeshFileItem {
  id: string;
  fileName: string;
  fileSize: number;
  data: MeshData;
  stats: {
    vertexCount: number;
    triangleCount: number;
  };
  visible: boolean;
  detailsOpen: boolean;
  wireframe: boolean;
  offset: Vec3;
  properties: ItemProperties;
}

function getMeshStats(data: MeshData) {
  let vertexCount = 0;
  let triangleCount = 0;
  if (data.kind === 'mesh') {
    vertexCount = data.vertices.length;
    triangleCount = Math.floor(data.indices.length / 3);
  }
  else {
    for (const subphys of data.subPhysMeshes) {
      vertexCount += subphys.vertices.length;
      triangleCount += Math.floor(subphys.indices.length / 3);
    }
  }
  return { vertexCount, triangleCount };
}

const meshFiles = ref<MeshFileItem[]>([]);
const fileUploadModel = ref<File[] | null>(null);
let nextMeshFileId = 1;

const removeMeshFile = (id: string) => {
  const i = meshFiles.value.findIndex(v => v.id === id);
  if (i !== -1) meshFiles.value.splice(i, 1);
};

const addMeshFiles = async (files: File[] | File | null | undefined) => {
  const fileList = Array.isArray(files) ? files : files ? [files] : [];
  if (!fileList.length) return;

  for (const file of fileList) {
    try {
      const data = parseMeshData(await file.arrayBuffer());
      const { kind } = data;

      meshFiles.value.push({
        id: `object-${nextMeshFileId++}`,
        fileName: file.name,
        fileSize: file.size,
        data,
        stats: getMeshStats(data),
        visible: true,
        detailsOpen: false,
        wireframe: false,
        offset: {
          x: 0,
          y: 0,
          z: 0,
        },
        properties: kind === 'mesh'
          ? {
              kind,
              enablePaintcolor: false,
              paintColor1: '#FFFFFF',
              paintColor2: '#FFFFFF',
              paintColor3: '#FFFFFF',
            }
          : { kind },
      });
    }
    catch (error) {
      console.error('Failed to parse mesh file:', file.name, error);

      toast.add({
        title: t('parse_error'),
        description: t('parse_error_description', { fileName: file.name }),
        icon: 'i-lucide-circle-alert',
        color: 'error',
      });
    }
  }

  fileUploadModel.value = null;
};

const toggleMeshVisibility = (item: { visible: boolean }) => {
  item.visible = !item.visible;
};

const toggleMeshDetails = (item: { detailsOpen: boolean }) => {
  item.detailsOpen = !item.detailsOpen;
};

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};
</script>

<template>
  <div class="h-full grid sm:grid-cols-[24rem_1fr]">
    <div class="min-w-0 h-screen flex flex-col">
      <AppTitle />

      <div class="grow flex flex-col px-4 pt-0 pb-18 sm:pb-4 gap-4 overflow-y-auto">
        <FormCard>
          <UFileUpload
            v-model="fileUploadModel"
            :label="t('drop_files')"
            :description="t('drop_files_description')"
            :preview="false"
            multiple
            class="w-full"
            @update:model-value="addMeshFiles"
          />

          <UAlert
            v-if="meshFiles.length === 0"
            color="neutral"
            variant="soft"
            icon="i-lucide-info"
            :title="t('no_files')"
            :description="t('no_files_description')"
          />

          <div
            v-else
            class="space-y-2"
          >
            <div
              v-for="item in meshFiles"
              :key="item.id"
              class="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
            >
              <div class="flex items-center gap-3 p-3">
                <UTooltip :text="item.visible ? t('hide_item') : t('show_item')">
                  <UButton
                    :icon="item.visible ? 'i-lucide-eye' : 'i-lucide-eye-off'"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    :aria-label="item.visible ? t('hide_item') : t('show_item')"
                    @click="toggleMeshVisibility(item)"
                  />
                </UTooltip>

                <div class="min-w-0 grow">
                  <div class="truncate text-sm font-medium">
                    {{ item.fileName }}
                  </div>
                  <div class="text-xs text-muted">
                    {{ formatFileSize(item.fileSize) }}
                  </div>
                </div>

                <UTooltip :text="t('item_settings')">
                  <UButton
                    :icon="item.detailsOpen ? 'i-lucide-chevron-up' : 'i-lucide-sliders-horizontal'"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    :aria-label="t('item_settings')"
                    @click="toggleMeshDetails(item)"
                  />
                </UTooltip>

                <UTooltip :text="t('remove_item')">
                  <UButton
                    icon="i-lucide-trash"
                    color="error"
                    variant="ghost"
                    size="sm"
                    :aria-label="t('remove_item')"
                    @click="removeMeshFile(item.id)"
                  />
                </UTooltip>
              </div>

              <div
                v-if="item.detailsOpen"
                class="space-y-4 border-t border-gray-200 p-3 dark:border-gray-700"
              >
                <div class="text-sm text-muted">
                  {{ t('mesh_stats', item.stats) }}
                </div>

                <USwitch
                  v-model="item.wireframe"
                  :label="t('wireframe')"
                />

                <div class="space-y-2">
                  <div class="text-sm font-medium">
                    {{ t('offset') }}
                  </div>
                  <div class="grid grid-cols-3 gap-2">
                    <UFormField
                      label="X"
                      size="sm"
                    >
                      <UInputNumber
                        v-model="item.offset.x"
                        class="w-full"
                        size="sm"
                        orientation="vertical"
                        :step="0.125"
                      />
                    </UFormField>
                    <UFormField
                      label="Y"
                      size="sm"
                    >
                      <UInputNumber
                        v-model="item.offset.y"
                        class="w-full"
                        size="sm"
                        orientation="vertical"
                        :step="0.125"
                      />
                    </UFormField>
                    <UFormField
                      label="Z"
                      size="sm"
                    >
                      <UInputNumber
                        v-model="item.offset.z"
                        class="w-full"
                        size="sm"
                        orientation="vertical"
                        :step="0.125"
                      />
                    </UFormField>
                  </div>
                </div>

                <template v-if="item.properties.kind === 'mesh'">
                  <USwitch
                    v-model="item.properties.enablePaintcolor"
                    :label="t('paint_colors')"
                  />

                  <div
                    v-if="item.properties.enablePaintcolor"
                    class="space-y-2"
                  >
                    <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <ColorPicker
                        v-model="item.properties.paintColor1"
                        :label="t('paint_color_1')"
                      />
                      <ColorPicker
                        v-model="item.properties.paintColor2"
                        :label="t('paint_color_2')"
                      />
                      <ColorPicker
                        v-model="item.properties.paintColor3"
                        :label="t('paint_color_3')"
                      />
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </FormCard>
      </div>
    </div>

    <ResponsivePanel
      icon="i-lucide-box"
      :label="t('viewer')"
      :disabled="meshFiles.length === 0"
    >
      <ClientOnly>
        <MeshViewerCanvas
          :items="meshFiles"
        />
      </ClientOnly>
    </ResponsivePanel>
  </div>
</template>

<i18n lang="json">
{
  "en": {
    "drop_files": "Pick Mesh Files",
    "drop_files_description": "Click, or drop files here",
    "no_files": "No files added",
    "no_files_description": "Drop files to add them to the viewer list.",
    "show_item": "Show",
    "hide_item": "Hide",
    "remove_item": "Remove",
    "item_settings": "Settings",
    "mesh_stats": "{vertexCount} Vertices, {triangleCount} Triangles",
    "wireframe": "Wireframe",
    "offset": "Offset",
    "paint_colors": "Paint Colors",
    "paint_color_1": "Color 1",
    "paint_color_2": "Color 2",
    "paint_color_3": "Color 3",
    "parse_error": "Could not load mesh file",
    "parse_error_description": "{fileName} could not be parsed. Please check the file format.",
    "viewer": "Viewer"
  },
  "ja": {
    "drop_files": "メッシュファイルを選択",
    "drop_files_description": "クリック、またはファイルをここにドロップ",
    "no_files": "ファイルが追加されていません",
    "no_files_description": "ファイルをドロップするとビューアーのリストに追加されます。",
    "show_item": "表示する",
    "hide_item": "隠す",
    "remove_item": "削除",
    "item_settings": "設定",
    "mesh_stats": "頂点数: {vertexCount}, 三角面数: {triangleCount}",
    "wireframe": "ワイヤーフレーム",
    "offset": "オフセット",
    "paint_colors": "ペイントカラー",
    "paint_color_1": "カラー1",
    "paint_color_2": "カラー2",
    "paint_color_3": "カラー3",
    "parse_error": "メッシュファイルを読み込めませんでした",
    "parse_error_description": "{fileName} をパースできませんでした。ファイル形式を確認してください。",
    "viewer": "ビューアー"
  }
}
</i18n>
