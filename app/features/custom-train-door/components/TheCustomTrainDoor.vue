<script setup lang="ts">
import { getMirrorMergedPolygons, PolygonEditor } from '~/features/polygon-editor';
import { useCustomTrainDoor } from '../composables';
import { createDoorUnitVehicle, getFilenames } from '../doorTypes';
import { createDefaultEditTrainDoorState, type OutputTrainDoorState } from '../types/state.ts';
import {
  getFingerprint as getFingerprintFromJson,
  toJson,
  createComponentBin,
  createMeshFiles,
  createVisualComponentFiles,
  createCollisionComponentFile,
  fromJson,
} from '../utils';
import TheTrainDoorPreviewClient from './TheTrainDoorPreview.client.vue';
import TheTrainDoorSettings from './TheTrainDoorSettings.vue';
import UsageInstructions from './UsageInstructions.vue';

const STORAGE_KEY = 'custom-train-door' as const;

const { t } = useI18n({ useScope: 'local' });

const toast = useToast();

// 汎用ファイル保存ユーティリティ
const { saveFile, saveFiles, saveZip, handleError } = useFileSave();

// 状態 (localStorage に自動保存)
const state = useLocalStorage(STORAGE_KEY, createDefaultEditTrainDoorState, {
  initOnMounted: true,
  serializer: {
    read(raw) {
      const result = fromJson(raw);

      if (result.success) {
        return result.data;
      } else {
        console.error(result.error);
        toast.add({
          icon: 'i-lucide-circle-alert',
          title: t('error.restore_state'),
          color: 'error',
        });

        return createDefaultEditTrainDoorState();
      }
    },
    write: toJson,
  },
});

const { outsideEditorProps, insideEditorProps, editorLogicalBounds } = useCustomTrainDoor(state);

// JSON保存・読み込み関連
const { open: openJsonSelectDialog, onChange: onJsonSelect } = useFileDialog({
  accept: 'json',
  multiple: false,
});

onJsonSelect(async (files) => {
  const file = files?.item(0);
  if (!file) return;

  const text = await file.text();
  const result = fromJson(text);

  if (result.success) {
    state.value = result.data;
  } else {
    console.error(result.error);
    toast.add({
      icon: 'i-lucide-circle-alert',
      title: t('error.load_state'),
      color: 'error',
    });
  }
});

function saveEditingState() {
  handleError(() => {
    const data = toJson(state.value);
    const fingerprint = getFingerprintFromJson(data);
    const filename = `train_door_${fingerprint}.json`;
    saveFile({
      filename,
      data,
      mimetype: 'application/json',
    });
  });
}

// エクスポートまわり
const outputState = computed<DeepReadonly<OutputTrainDoorState>>(() => ({
  options: state.value.options,
  outsidePaint: getMirrorMergedPolygons(state.value.outsidePaint, editorLogicalBounds.value),
  insidePaint: getMirrorMergedPolygons(state.value.insidePaint, editorLogicalBounds.value),
}));

function getFingerprint() {
  return getFingerprintFromJson(toJson(state.value));
}

function saveMeshClicked() {
  handleError(() => {
    const fingerprint = getFingerprint();
    const filenames = getFilenames(outputState.value.options, fingerprint);
    const files = createMeshFiles(outputState.value, fingerprint, filenames.meshes);
    saveFiles(files, filenames.meshesZip);
  });
}

function saveVisualComponentSourceClicked() {
  handleError(() => {
    const fingerprint = getFingerprint();
    const filenames = getFilenames(outputState.value.options, fingerprint);
    const files = createVisualComponentFiles(outputState.value, fingerprint, filenames);
    const zipName = replaceExtension(files.definition.filename, '.zip');
    saveFiles([files.definition, files.script, ...files.meshes], zipName);
  });
}

function saveVisualComponentBinClicked() {
  handleError(() => {
    const fingerprint = getFingerprint();
    const files = createVisualComponentFiles(outputState.value, fingerprint);
    const { file: binFile } = createComponentBin(files.definition.filename, files.definition.data, [
      files.script,
      ...files.meshes,
    ]);
    saveFile(binFile);
  });
}

function saveCollisionComponentSourceClicked() {
  handleError(() => {
    const fingerprint = getFingerprint();
    const file = createCollisionComponentFile(outputState.value.options, fingerprint);
    saveFile(file);
  });
}

function saveCollisionComponentBinClicked() {
  handleError(() => {
    const fingerprint = getFingerprint();
    const file = createCollisionComponentFile(outputState.value.options, fingerprint);
    const { file: binFile } = createComponentBin(file.filename, file.data);
    saveFile(binFile);
  });
}

function saveDoorUnitClicked() {
  handleError(() => {
    const fingerprint = getFingerprint();
    const filenames = getFilenames(outputState.value.options, fingerprint);

    const visualFiles = createVisualComponentFiles(outputState.value, fingerprint, filenames);
    const visualComponent = createComponentBin(
      visualFiles.definition.filename,
      visualFiles.definition.data,
      [visualFiles.script, ...visualFiles.meshes],
    );

    const collisionFile = createCollisionComponentFile(outputState.value.options, fingerprint);
    const collisionComponent = createComponentBin(collisionFile.filename, collisionFile.data);

    const vehicleData = createDoorUnitVehicle(
      outputState.value.options,
      visualComponent.name,
      collisionComponent.name,
    );
    const vehicle: SaveZipNode[] = [
      {
        type: 'file',
        entry: {
          filename: filenames.doorUnitVehicleName,
          data: vehicleData,
          mimetype: 'application/xml',
        },
      },
      {
        type: 'folder',
        name: replaceExtension(filenames.doorUnitVehicleName, ''),
        content: [
          {
            type: 'file',
            entry: visualComponent.file,
          },
          {
            type: 'file',
            entry: collisionComponent.file,
          },
        ],
      },
    ];

    saveZip(vehicle, replaceExtension(filenames.doorUnitVehicleName, '.zip'));
  });
}

// UI
const tabItems = computed(() => [
  {
    label: t('tabs.settings'),
    icon: 'i-lucide-wrench',
    slot: 'settings' as const,
  },
  {
    label: t('tabs.outside_paint'),
    icon: 'i-lucide-brush',
    slot: 'outside' as const,
  },
  {
    label: t('tabs.inside_paint'),
    icon: 'i-lucide-brush',
    slot: 'inside' as const,
  },
]);

const otherMenuItems = computed(() => [
  [
    {
      label: t('other_menu.state.open'),
      icon: 'i-lucide-folder-open',
      onSelect() {
        openJsonSelectDialog();
      },
    },
    {
      label: t('other_menu.state.save'),
      icon: 'i-lucide-save',
      onSelect: saveEditingState,
    },
  ],
  [
    {
      label: t('other_menu.advanced.label'),
      children: [
        {
          label: t('other_menu.advanced.save_mesh'),
          icon: 'i-lucide-box',
          onSelect: saveMeshClicked,
        },
        {
          label: t('other_menu.advanced.save_visual_component_source'),
          icon: 'i-lucide-code-xml',
          onSelect: saveVisualComponentSourceClicked,
        },
        {
          label: t('other_menu.advanced.save_visual_component_bin'),
          icon: 'i-lucide-binary',
          onSelect: saveVisualComponentBinClicked,
        },
        {
          label: t('other_menu.advanced.save_collision_component_source'),
          icon: 'i-lucide-code-xml',
          onSelect: saveCollisionComponentSourceClicked,
        },
        {
          label: t('other_menu.advanced.save_collision_component_bin'),
          icon: 'i-lucide-binary',
          onSelect: saveCollisionComponentBinClicked,
        },
      ],
    },
  ],
]);
</script>

<template>
  <div class="grid h-full sm:grid-cols-[7fr_5fr]">
    <div class="flex h-screen flex-col">
      <AppTitle />

      <div class="grow px-4 sm:min-h-0">
        <UTabs
          :items="tabItems"
          :unmount-on-hide="false"
          :ui="{ root: 'gap-4', content: 'grow min-h-0 pb-18 sm:pb-4' }"
          class="h-full"
        >
          <template #settings>
            <TheTrainDoorSettings v-model="state.options" />
            <div class="mt-4 flex flex-wrap gap-4 md:flex-nowrap">
              <UButton
                block
                size="xl"
                color="primary"
                icon="i-lucide-download"
                :label="t('save.door_unit')"
                @click="saveDoorUnitClicked"
              />

              <UModal :title="t('usage.title')" :ui="{ content: 'sm:max-w-3xl' }">
                <UButton
                  block
                  size="xl"
                  color="primary"
                  variant="subtle"
                  icon="i-lucide-circle-question-mark"
                  :label="t('usage.label')"
                  class="flex-1"
                />
                <template #body>
                  <UsageInstructions />
                </template>
              </UModal>

              <UDropdownMenu :items="otherMenuItems">
                <UButton
                  block
                  size="xl"
                  color="primary"
                  variant="outline"
                  icon="i-lucide-ellipsis"
                  :label="t('other_menu.label')"
                  class="flex-1"
                />
              </UDropdownMenu>
            </div>
          </template>

          <template #outside>
            <PolygonEditor
              ref="outsideEditor"
              v-model="state.outsidePaint"
              v-bind="outsideEditorProps"
              class="h-full overflow-y-auto"
            />
          </template>

          <template #inside>
            <PolygonEditor
              ref="insideEditor"
              v-model="state.insidePaint"
              v-bind="insideEditorProps"
              class="h-full overflow-y-auto"
            />
          </template>
        </UTabs>
      </div>
    </div>

    <ResponsivePanel icon="i-lucide-box" :label="t('preview')">
      <ClientOnly>
        <TheTrainDoorPreviewClient :state="outputState" />
      </ClientOnly>
    </ResponsivePanel>
  </div>
</template>

<i18n lang="json">
{
  "en": {
    "error": {
      "restore_state": "Failed to restore data",
      "load_state": "Failed to load project file"
    },
    "tabs": {
      "settings": "Settings",
      "outside_paint": "Outside Paint",
      "inside_paint": "Inside Paint"
    },
    "preview": "Preview",
    "save": {
      "door_unit": "Save Door Unit"
    },
    "usage": {
      "label": "Usage",
      "title": "Installing the Door Unit"
    },
    "other_menu": {
      "label": "More",
      "state": {
        "open": "Open project",
        "save": "Save project"
      },
      "advanced": {
        "label": "Advanced Export",
        "save_mesh": "Save Mesh (.mesh)",
        "save_visual_component_source": "Save Visual Component (.xml, .lua, .mesh)",
        "save_visual_component_bin": "Save Visual Component (.bin)",
        "save_collision_component_source": "Save Collision Component (.xml)",
        "save_collision_component_bin": "Save Collision Component (.bin)"
      }
    }
  },
  "ja": {
    "error": {
      "restore_state": "入力内容を復元できませんでした",
      "load_state": "編集データを読み込めませんでした"
    },
    "tabs": {
      "settings": "設定",
      "outside_paint": "外側ペイント",
      "inside_paint": "内側ペイント"
    },
    "preview": "プレビュー",
    "save": {
      "door_unit": "ドアユニットを保存"
    },
    "usage": {
      "label": "使い方",
      "title": "ドアユニットの導入方法"
    },
    "other_menu": {
      "label": "その他",
      "state": {
        "open": "編集データを開く",
        "save": "編集データを保存"
      },
      "advanced": {
        "label": "Mod開発者向け",
        "save_mesh": "メッシュを保存 (.mesh)",
        "save_visual_component_source": "表示コンポーネントを保存 (.xml, .lua, .mesh)",
        "save_visual_component_bin": "表示コンポーネントを保存 (.bin)",
        "save_collision_component_source": "当たり判定コンポーネントを保存 (.xml)",
        "save_collision_component_bin": "当たり判定コンポーネントを保存 (.bin)"
      }
    }
  }
}
</i18n>
