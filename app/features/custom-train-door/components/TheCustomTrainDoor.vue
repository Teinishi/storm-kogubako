<script setup lang="ts">
import { PolygonEditor } from '~/features/polygon-editor';
import TheTrainDoorSettings from './TheTrainDoorSettings.vue';
import TheTrainDoorPreviewClient from './TheTrainDoorPreview.client.vue';
import { useCustomTrainDoor } from '../composables';
import { createMeshFiles, createVisualDefinition, getFingerprint as getFingerprintFromJson, toJson, createComponentBin, type CreateVisualDefinitionOptions, createCollisionDefinition } from '../utils';
import { createLuaScript } from '../doorTypes';

const { t } = useI18n({ useScope: 'local' });

const { saveFile, saveFiles } = useFileSave();

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
    onSelect: saveMeshClicked,
  },
  {
    label: t('save_visual_component_source'),
    onSelect: saveVisualComponentSourceClicked,
  },
  {
    label: t('save_visual_component_bin'),
    onSelect: saveVisualComponentBinClicked,
  },
  {
    label: t('save_collision_component_source'),
    onSelect: saveCollisionComponentSourceClicked,
  },
  {
    label: t('save_collision_component_bin'),
  },
]);

const {
  state,
  outsidePolygonEditorValue,
  insidePolygonEditorValue,
  outsideEditorProps,
  insideEditorProps,
} = useCustomTrainDoor();

function getFingerprint() {
  return getFingerprintFromJson(toJson({
    state,
    outsidePaint: outsidePolygonEditorValue.value,
    insidePaint: insidePolygonEditorValue.value,
  }));
}

function getMeshFiles(fingerprint: string) {
  const meshes = createMeshFiles(state, outsidePolygonEditorValue.value, insidePolygonEditorValue.value);
  return meshes.map(({ id, data }) => ({
    filename: `train_door_${id}_${fingerprint}.mesh`,
    data,
    type: 'application/octet-stream',
  }));
}

function getLuaScriptFile(fingerprint: string) {
  return {
    filename: `train_door_visual_${fingerprint}.lua`,
    data: createLuaScript(state),
    type: 'text/plain',
  };
}

function getVisualDefinitionFile(fingerprint: string, options?: DeepReadonly<CreateVisualDefinitionOptions>) {
  return {
    filename: `train_door_visual_${fingerprint}.xml`,
    data: createVisualDefinition(state, fingerprint, options),
    type: 'application/xml',
  };
}

function getCollisionDefinitionFile(fingerprint: string) {
  return {
    filename: `train_door_collision_${fingerprint}.xml`,
    data: createCollisionDefinition(state, fingerprint),
    type: 'application/xml',
  };
}

function saveMeshClicked() {
  const fingerprint = getFingerprint();
  const files = getMeshFiles(fingerprint);
  saveFiles(files, `train_door_meshes_${fingerprint}.zip`);
}

function saveVisualComponentSourceClicked() {
  const fingerprint = getFingerprint();

  const meshFiles = getMeshFiles(fingerprint);
  const luaFile = getLuaScriptFile(fingerprint);
  const definitionFile = getVisualDefinitionFile(fingerprint, {
    meshes: meshFiles.map(m => m.filename),
    luaFilename: luaFile.filename,
  });

  saveFiles([definitionFile, luaFile, ...meshFiles], `train_door_visual_${fingerprint}.zip`);
}

function saveVisualComponentBinClicked() {
  const fingerprint = getFingerprint();

  const meshFiles = getMeshFiles(fingerprint);
  const luaFile = getLuaScriptFile(fingerprint);
  const definitionFile = getVisualDefinitionFile(fingerprint, {
    meshes: meshFiles.map(m => m.filename),
    luaFilename: luaFile.filename,
  });

  const data = createComponentBin(definitionFile.filename, definitionFile.data, [luaFile, ...meshFiles]);

  saveFile({
    filename: `train_door_visual_${fingerprint}.bin`,
    data,
    type: 'application/octet-stream',
  });
}

function saveCollisionComponentSourceClicked() {
  const fingerprint = getFingerprint();

  const definitionFile = getCollisionDefinitionFile(fingerprint);

  saveFile(definitionFile);
}

function saveDoorUnitClicked() {}
</script>

<template>
  <div class="h-full grid sm:grid-cols-[7fr_5fr]">
    <div class="h-screen flex flex-col">
      <AppTitle />

      <div class="grow px-4 sm:min-h-0">
        <UTabs
          :items="tabItems"
          :unmount-on-hide="false"
          :ui="{ root: 'gap-4', content: 'grow min-h-0 pb-18 sm:pb-4' }"
          class="h-full"
        >
          <template #settings>
            <TheTrainDoorSettings v-model="state" />
            <div class="mt-4 flex gap-4">
              <UButton
                block
                size="xl"
                color="primary"
                :label="t('save_door_unit')"
                @click="saveDoorUnitClicked"
              />
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
              v-model="outsidePolygonEditorValue"
              v-bind="outsideEditorProps"
              class="h-full overflow-y-auto"
            />
          </template>

          <template #inside>
            <PolygonEditor
              ref="insideEditor"
              v-model="insidePolygonEditorValue"
              v-bind="insideEditorProps"
              class="h-full overflow-y-auto"
            />
          </template>
        </UTabs>
      </div>
    </div>

    <ResponsivePanel
      icon="i-lucide-box"
      :label="t('preview')"
    >
      <ClientOnly>
        <TheTrainDoorPreviewClient
          :state="state"
          :outside-paint="outsidePolygonEditorValue"
          :inside-paint="insidePolygonEditorValue"
        />
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
    "advanced": "Mod 開発者向け",
    "save_mesh": "メッシュを保存 (.mesh)",
    "save_visual_component_source": "表示コンポーネントを保存 (.xml, .lua, .mesh)",
    "save_visual_component_bin": "表示コンポーネントを保存 (.bin)",
    "save_collision_component_source": "当たり判定コンポーネントを保存 (.xml)",
    "save_collision_component_bin": "当たり判定コンポーネントを保存 (.bin)"
  }
}
</i18n>
