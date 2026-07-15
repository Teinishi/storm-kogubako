<script setup lang="ts">
import { useCustomTrainDoor } from '~/composables/useCustomTrainDoor';

const { t: gt } = useI18n({ useScope: 'global' });
const { t } = useI18n({ useScope: 'local' });

useHead({ title: gt('custom_train_door') });
definePageMeta({ layout: 'app' });

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

const outsideEditor = useTemplateRef('outsideEditor');
const insideEditor = useTemplateRef('insideEditor');

const {
  state,
  windowPolygon,
  outsidePolygonEditorValue,
  insidePolygonEditorValue,
  outsideEditorProps,
  insideEditorProps,
} = useCustomTrainDoor(
  () => outsideEditor.value?.renderCanvas(),
  () => insideEditor.value?.renderCanvas(),
);
</script>

<template>
  <div class="h-full grid sm:grid-cols-[7fr_5fr]">
    <div class="h-screen flex flex-col">
      <AppTitle />

      <div class="grow px-4 pt-0 pb-18 sm:pb-4 min-h-0">
        <UTabs
          :items="tabItems"
          :unmount-on-hide="false"
          :ui="{ root: 'gap-4', content: 'grow min-h-0' }"
          class="h-full"
        >
          <template #settings>
            <TrainDoorState v-model="state" />
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
        <TrainDoorPreview
          :state="state"
          :window-hole="windowPolygon"
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
    "preview": "Preview"
  },
  "ja": {
    "settings": "設定",
    "outside_paint": "外側ペイント",
    "inside_paint": "内側ペイント",
    "preview": "プレビュー"
  }
}
</i18n>
