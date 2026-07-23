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

const { saveFile, saveFiles, saveZip, handleError } = useFileSave();

const tabItems = computed(() => [
  {
    label: t('settings'),
    icon: 'i-lucide-wrench',
    slot: 'settings' as const,
  },
  {
    label: t('outside_paint'),
    icon: 'i-lucide-brush',
    slot: 'outside' as const,
  },
  {
    label: t('inside_paint'),
    icon: 'i-lucide-brush',
    slot: 'inside' as const,
  },
]);

const advancedItems = computed(() => [
  {
    label: t('save_mesh'),
    icon: 'i-lucide-box',
    onSelect: saveMeshClicked,
  },
  {
    label: t('save_visual_component_source'),
    icon: 'i-lucide-code-xml',
    onSelect: saveVisualComponentSourceClicked,
  },
  {
    label: t('save_visual_component_bin'),
    icon: 'i-lucide-binary',
    onSelect: saveVisualComponentBinClicked,
  },
  {
    label: t('save_collision_component_source'),
    icon: 'i-lucide-code-xml',
    onSelect: saveCollisionComponentSourceClicked,
  },
  {
    label: t('save_collision_component_bin'),
    icon: 'i-lucide-binary',
    onSelect: saveCollisionComponentBinClicked,
  },
]);

const state = useLocalStorage(STORAGE_KEY, createDefaultEditTrainDoorState, {
  initOnMounted: true,
  serializer: {
    read: fromJson,
    write: toJson,
  },
});

const { outsideEditorProps, insideEditorProps, editorLogicalBounds } = useCustomTrainDoor(state);

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
                :label="t('save_door_unit')"
                @click="saveDoorUnitClicked"
              />

              <UModal :title="t('usage_title')" :ui="{ content: 'sm:max-w-3xl' }">
                <UButton
                  block
                  size="xl"
                  color="primary"
                  variant="subtle"
                  icon="i-lucide-circle-question-mark"
                  :label="t('usage')"
                  class="flex-1"
                />
                <template #body>
                  <UsageInstructions />
                </template>
              </UModal>

              <UDropdownMenu :items="advancedItems">
                <UButton
                  block
                  size="xl"
                  color="primary"
                  variant="outline"
                  icon="i-lucide-chevron-down"
                  :label="t('advanced')"
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
    "settings": "Settings",
    "outside_paint": "Outside Paint",
    "inside_paint": "Inside Paint",
    "preview": "Preview",
    "save_door_unit": "Save Door Unit",
    "usage": "Usage",
    "usage_title": "Installing the Door Unit",
    "advanced": "Advanced",
    "save_mesh": "Save Mesh (.mesh)",
    "save_visual_component_xml": "Save Visual Component (.xml, .lua, .mesh)",
    "save_visual_component_bin": "Save Visual Component (.bin)",
    "save_collision_component_xml": "Save Collision Component (.xml)",
    "save_collision_component_bin": "Save Collision Component (.bin)"
  },
  "ja": {
    "settings": "設定",
    "outside_paint": "外側ペイント",
    "inside_paint": "内側ペイント",
    "preview": "プレビュー",
    "save_door_unit": "ドアユニットを保存",
    "usage": "使い方",
    "usage_title": "ドアユニットの導入方法",
    "advanced": "Mod 開発者向け",
    "save_mesh": "メッシュを保存 (.mesh)",
    "save_visual_component_source": "表示コンポーネントを保存 (.xml, .lua, .mesh)",
    "save_visual_component_bin": "表示コンポーネントを保存 (.bin)",
    "save_collision_component_source": "当たり判定コンポーネントを保存 (.xml)",
    "save_collision_component_bin": "当たり判定コンポーネントを保存 (.bin)"
  }
}
</i18n>
