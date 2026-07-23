<script setup lang="ts">
import type { TrainDoorOptions } from '../types';

const FORMAT_OPTIONS_METER = {
  maximumFractionDigits: 5,
  style: 'unit',
  unit: 'meter',
} as const;

const { t } = useI18n({ useScope: 'local' });

const directionItems = computed(() => [
  {
    label: t('direction.double'),
    value: 'double',
  },
  {
    label: t('direction.left'),
    value: 'left',
  },
  {
    label: t('direction.right'),
    value: 'right',
  },
]);

const state = defineModel<TrainDoorOptions>({ required: true });
</script>

<template>
  <div class="grid gap-4 @2xl:grid-cols-2">
    <FormCard :title="t('door_settings')">
      <div class="grid grid-cols-1 items-end gap-4 sm:grid-cols-2">
        <UFormField :label="t('direction.label')">
          <USelect v-model="state.direction" :items="directionItems" class="w-full" />
        </UFormField>
      </div>

      <div class="grid grid-cols-1 items-end gap-2 sm:grid-cols-2">
        <UFormField :label="t('door_width')">
          <div class="flex items-center gap-2">
            <UInputNumber v-model="state.doorWidth" :step="1" :min="1" class="flex-1" />
            <span class="text-muted">{{ t('blocks') }}</span>
          </div>
        </UFormField>

        <UFormField :label="t('door_height')">
          <div class="flex items-center gap-2">
            <UInputNumber v-model="state.doorHeight" :step="1" :min="1" class="flex-1" />
            <span class="text-muted">{{ t('blocks') }}</span>
          </div>
        </UFormField>

        <UFormField :label="t('door_thickness')">
          <UInputNumber
            v-model="state.doorThickness"
            :step="0.05"
            :step-snapping="false"
            :min="0.05"
            class="w-full"
            :format-options="FORMAT_OPTIONS_METER"
          />
        </UFormField>

        <UFormField :label="t('door_z_offset')">
          <UInputNumber
            v-model="state.doorZOffset"
            :step="0.05"
            :step-snapping="false"
            class="w-full"
            :format-options="FORMAT_OPTIONS_METER"
          />
        </UFormField>

        <ColorPicker v-model="state.outsideColor" :label="t('outside_color')" />

        <ColorPicker v-model="state.insideColor" :label="t('inside_color')" />
      </div>

      <div class="grid grid-cols-1 items-end gap-2 sm:grid-cols-2">
        <UFormField :label="t('rubber_thickness')">
          <UInputNumber
            v-model="state.rubberThickness"
            :step="0.01"
            :step-snapping="false"
            :min="0"
            :max="0.1"
            class="w-full"
            :format-options="FORMAT_OPTIONS_METER"
          />
        </UFormField>

        <ColorPicker v-model="state.rubberColor" :label="t('rubber_color')" />
      </div>
    </FormCard>

    <FormCard :title="t('window_settings')">
      <div class="grid grid-cols-1 items-end gap-2 sm:grid-cols-2">
        <UFormField :label="t('window_x_offset')">
          <UInputNumber
            v-model="state.windowXOffset"
            :step="0.005"
            :step-snapping="false"
            class="w-full"
            :format-options="FORMAT_OPTIONS_METER"
          />
        </UFormField>

        <UFormField :label="t('window_y_offset')">
          <UInputNumber
            v-model="state.windowYOffset"
            :step="0.005"
            :step-snapping="false"
            class="w-full"
            :format-options="FORMAT_OPTIONS_METER"
          />
        </UFormField>

        <UFormField :label="t('window_width')">
          <UInputNumber
            v-model="state.windowWidth"
            :step="0.01"
            :step-snapping="false"
            :min="0.01"
            class="w-full"
            :format-options="FORMAT_OPTIONS_METER"
          />
        </UFormField>

        <UFormField :label="t('window_height')">
          <UInputNumber
            v-model="state.windowHeight"
            :step="0.01"
            :step-snapping="false"
            :min="0.01"
            class="w-full"
            :format-options="FORMAT_OPTIONS_METER"
          />
        </UFormField>

        <UFormField :label="t('window_corner_radius')">
          <UInputNumber
            v-model="state.windowCornerRadius"
            :step="0.01"
            :step-snapping="false"
            :min="0"
            class="w-full"
            :format-options="FORMAT_OPTIONS_METER"
          />
        </UFormField>

        <UFormField :label="t('window_corner_divisions')">
          <UInputNumber
            v-model="state.windowCornerDivisions"
            :step="1"
            :min="1"
            :max="5"
            class="w-full"
          />
        </UFormField>
      </div>

      <div class="grid grid-cols-1 items-end gap-2 sm:grid-cols-2">
        <UFormField :label="t('window_frame_thickness')">
          <UInputNumber
            v-model="state.windowFrameThickness"
            :step="0.01"
            :step-snapping="false"
            :min="0"
            :max="0.1"
            class="w-full"
            :format-options="FORMAT_OPTIONS_METER"
          />
        </UFormField>

        <ColorPicker v-model="state.windowFrameColor" :label="t('window_frame_color')" />
      </div>
    </FormCard>
  </div>
</template>

<i18n lang="json">
{
  "en": {
    "blocks": "Blocks",
    "door_settings": "Door Settings",
    "door_type": "Door Type",
    "direction": {
      "label": "Direction",
      "double": "Double",
      "left": "Left",
      "right": "Right"
    },
    "door_width": "Width",
    "door_height": "Height",
    "door_thickness": "Thickness",
    "door_z_offset": "Z Offset",
    "outside_color": "Outside Base Color",
    "inside_color": "Inside Base Color",
    "rubber_thickness": "Rubber Thickness",
    "rubber_color": "Rubber Color",
    "window_settings": "Window Settings",
    "window_x_offset": "Window X Offset",
    "window_y_offset": "Window Y Offset",
    "window_width": "Window Width",
    "window_height": "Window Height",
    "window_corner_radius": "Window Corner Radius",
    "window_corner_divisions": "Window Corner Divisions",
    "window_frame_thickness": "Window Frame Thickness",
    "window_frame_color": "Window Frame Color"
  },
  "ja": {
    "blocks": "ブロック",
    "door_settings": "ドア設定",
    "door_type": "タイプ",
    "direction": {
      "label": "向き",
      "double": "両開き",
      "left": "左",
      "right": "右"
    },
    "door_width": "幅",
    "door_height": "高さ",
    "door_thickness": "厚み",
    "door_z_offset": "Z位置",
    "outside_color": "外側ベースカラー",
    "inside_color": "内側ベースカラー",
    "rubber_thickness": "戸先ゴム厚み",
    "rubber_color": "戸先ゴムカラー",
    "window_settings": "窓設定",
    "window_x_offset": "X位置",
    "window_y_offset": "Y位置",
    "window_width": "幅",
    "window_height": "高さ",
    "window_corner_radius": "角丸",
    "window_corner_divisions": "角分割数",
    "window_frame_thickness": "枠太さ",
    "window_frame_color": "枠カラー"
  }
}
</i18n>
