<script setup lang="ts">
import { PolygonEditor } from '~/features/polygon-editor';
import TheTrainDoorSettings from './TheTrainDoorSettings.vue';
import TheTrainDoorPreviewClient from './TheTrainDoorPreview.client.vue';
import { useCustomTrainDoor } from '../composables';
import { createMeshFiles, createVisualDefinition } from '../utils';

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
    label: t('save_visual_component_xml'),
    onSelect: saveVisualComponentXmlClicked,
  },
  {
    label: t('save_collision_component_xml'),
  },
  {
    label: t('save_visual_component_bin'),
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

function saveMeshClicked() {
  const meshes = createMeshFiles(state, outsidePolygonEditorValue.value, insidePolygonEditorValue.value);
  const files = meshes.map(({ id, data }) => ({
    filename: `train_door_${id}.mesh`,
    blob: new Blob([data], { type: 'application/octet-stream' }),
  }));
  saveFiles(files, 'train_door_meshes.zip');
}

function saveVisualComponentXmlClicked() {
  const xml = createVisualDefinition(state);
  const blob = new Blob([xml], { type: 'application/xml' });
  saveFile(blob, 'train_door_visual.xml');
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
    "save_visual_component_xml": "Save Visual Component XML (.xml)",
    "save_collision_component_xml": "Save Collision Component XML (.bin)",
    "save_visual_component_bin": "Save Visual Component (.bin)",
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
    "save_visual_component_xml": "表示コンポーネントXMLを保存 (.xml)",
    "save_collision_component_xml": "当たり判定コンポーネントXMLを保存 (.xml)",
    "save_visual_component_bin": "表示コンポーネントを保存 (.bin)",
    "save_collision_component_bin": "当たり判定コンポーネントXMLを保存 (.bin)"
  }
}
</i18n>
