<script setup lang="ts">
import { MeshBinaryParser } from 'sw-mesh-viewer';
import { MeshViewer, type Viewer, type ViewerObjectState } from 'sw-mesh-viewer/vue';

const { t } = useI18n({
  useScope: 'local',
});

useHead({ title: t('title') });
definePageMeta({ layout: 'app' });

const toast = useToast();

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

type ItemUniforms = {
  kind: 'mesh';
  color1: string;
  color2: string;
  color3: string;
} | {
  kind: 'phys';
};

interface MeshFileItem {
  id: string;
  fileName: string;
  fileSize: number;
  visible: boolean;
  detailsOpen: boolean;
  wireframe: boolean;
  offset: Vec3;
  uniforms: ItemUniforms;
}

const meshViewer = ref<{ getViewer: () => Viewer | null } | null>(null);

const meshFiles = ref<MeshFileItem[]>([]);
const fileUploadModel = ref<File[] | null>(null);
let nextMeshFileId = 1;

const hexToVec4 = (hex: string): [number, number, number, number] => {
  const { r, g, b } = hexToRgb(hex);
  return [r / 255, g / 255, b / 255, 1];
};

const createOffsetMatrix = ({ x, y, z }: Vec3) => [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  x, y, z, 1,
];

const createObjectUniforms = (item: MeshFileItem) => item.uniforms.kind === 'mesh'
  ? ({
      opaque: {
        overrideColor: {
          type: 'int' as const,
          value: 1,
        },
        overrideColor1: {
          type: 'vec4' as const,
          value: hexToVec4(item.uniforms.color1),
        },
        overrideColor2: {
          type: 'vec4' as const,
          value: hexToVec4(item.uniforms.color2),
        },
        overrideColor3: {
          type: 'vec4' as const,
          value: hexToVec4(item.uniforms.color3),
        },
      },
    })
  : {};

const createObjectState = (item: MeshFileItem): ViewerObjectState => ({
  id: item.id,
  visible: item.visible,
  wireframe: item.wireframe,
  matrix: createOffsetMatrix(item.offset),
  uniforms: createObjectUniforms(item),
});

const objectProps = computed<ViewerObjectState[]>(() => meshFiles.value.map(createObjectState));

const removeMeshFile = (id: string) => {
  const i = meshFiles.value.findIndex(v => v.id === id);
  if (i !== -1) meshFiles.value.splice(i, 1);
  meshViewer.value?.getViewer()?.removeObject(id);
};

const addMeshFiles = async (files: File[] | File | null | undefined) => {
  const fileList = Array.isArray(files) ? files : files ? [files] : [];
  if (!fileList.length) return;

  const parser = new MeshBinaryParser();
  const viewer = meshViewer.value?.getViewer();

  if (viewer) {
    for (const file of fileList) {
      let id: string | null = null;

      try {
        const data = parser.parse(await file.arrayBuffer());
        const { kind } = data;
        id = `object-${nextMeshFileId++}`;

        const item: MeshFileItem = {
          id,
          fileName: file.name,
          fileSize: file.size,
          visible: true,
          detailsOpen: false,
          wireframe: false,
          offset: {
            x: 0,
            y: 0,
            z: 0,
          },
          uniforms: kind === 'mesh'
            ? { kind, color1: '#FFFFFF',
                color2: '#FFFFFF',
                color3: '#FFFFFF' }
            : { kind },
        };

        meshFiles.value.push(item);

        await nextTick();
        viewer.addObject(id, data, {
          visible: item.visible,
          wireframe: item.wireframe,
          matrix: createOffsetMatrix(item.offset),
          uniforms: createObjectUniforms(item),
        });
      }
      catch (error) {
        console.error('Failed to parse mesh file:', file.name, error);

        if (id) removeMeshFile(id);

        toast.add({
          title: t('parse_error'),
          description: t('parse_error_description', { fileName: file.name }),
          icon: 'i-lucide-circle-alert',
          color: 'error',
        });
      }
    }
  }
  else {
    console.error('Failed to get an instance of Viewer');
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
  <UContainer class="grow overflow-hidden py-4 grid grid-cols-1 grid-rows-2 lg:grid-cols-12 lg:grid-rows-1 gap-4">
    <div class="lg:col-span-4 flex flex-col gap-4 overflow-y-auto">
      <h1 class="text-2xl font-bold">
        {{ t('title') }}
      </h1>

      <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
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
                  {{ item.fileName }}
                </div>
                <div class="text-xs text-muted">
                  {{ formatFileSize(item.fileSize) }}
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
              class="space-y-4 border-t border-gray-200 p-3 dark:border-gray-700"
            >
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

              <div
                v-if="item.uniforms.kind === 'mesh'"
                class="space-y-2"
              >
                <div class="text-sm font-medium">
                  {{ t('paint_colors') }}
                </div>
                <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <ColorPicker
                    v-model="item.uniforms.color1"
                    :label="t('paint_color_1')"
                  />
                  <ColorPicker
                    v-model="item.uniforms.color2"
                    :label="t('paint_color_2')"
                  />
                  <ColorPicker
                    v-model="item.uniforms.color3"
                    :label="t('paint_color_3')"
                  />
                </div>
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
      <div
        v-if="meshFiles.length === 0"
        class="m-auto flex flex-col items-center gap-2 p-6 text-center text-muted"
      >
        <UIcon
          name="i-lucide-box"
          class="size-10"
        />
        <div class="text-sm">
          {{ t('viewer_placeholder') }}
        </div>
      </div>

      <MeshViewer
        v-show="meshFiles.length > 0"
        ref="meshViewer"
        :objects="objectProps"
        class="w-full h-full"
      />
    </div>
  </UContainer>
</template>

<i18n lang="json">
{
  "en": {
    "title": "Mesh Viewer",
    "drop_files": "Pick Mesh Files",
    "drop_files_description": "Click, or drop files here",
    "no_files": "No files added",
    "no_files_description": "Drop files to add them to the viewer list.",
    "show_file": "Show file",
    "hide_file": "Hide file",
    "remove_file": "Remove file",
    "file_settings": "File Settings",
    "wireframe": "Wireframe",
    "offset": "Offset",
    "paint_colors": "Paint Colors",
    "paint_color_1": "Color 1",
    "paint_color_2": "Color 2",
    "paint_color_3": "Color 3",
    "viewer_placeholder": "Mesh preview will appear here.",
    "parse_error": "Could not load mesh file",
    "parse_error_description": "{fileName} could not be parsed. Please check the file format."
  },
  "ja": {
    "title": "メッシュビューアー",
    "drop_files": "メッシュファイルを選択",
    "drop_files_description": "クリック、またはファイルをここにドロップ",
    "no_files": "ファイルが追加されていません",
    "no_files_description": "ファイルをドロップするとビューアーのリストに追加されます。",
    "show_file": "ファイルを表示",
    "hide_file": "ファイルを非表示",
    "remove_file": "ファイルを削除",
    "file_settings": "ファイル設定",
    "wireframe": "ワイヤーフレーム",
    "offset": "オフセット",
    "paint_colors": "ペイントカラー",
    "paint_color_1": "カラー1",
    "paint_color_2": "カラー2",
    "paint_color_3": "カラー3",
    "viewer_placeholder": "メッシュのプレビューはここに表示されます。",
    "parse_error": "メッシュファイルを読み込めませんでした",
    "parse_error_description": "{fileName} をパースできませんでした。ファイル形式を確認してください。"
  }
}
</i18n>
