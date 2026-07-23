<script setup lang="ts">
import type { TrainDoorOptions } from '../types';

const FORMAT_OPTIONS_METER = {
  maximumFractionDigits: 5,
  style: 'unit',
  unit: 'meter',
} as const;

const { t } = useI18n({ useScope: 'local' });

/*const _doorTypeItems = computed(() => [
  {
    label: t('double_sliding'),
    value: 'double_sliding',
  },
  {
    label: t('single_sliding_left'),
    value: 'single_sliding_left',
  },
  {
    label: t('single_sliding_right'),
    value: 'single_sliding_right',
  },
]);*/

const state = defineModel<TrainDoorOptions>({ required: true });
</script>

<template>
  <div class="grid gap-4 lg:grid-cols-2">
    <FormCard :title="t('door_settings')">
      <!-- <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
        <UFormField :label="t('door_type')">
          <USelect
            v-model="state.doorType"
            :items="doorTypeItems"
            class="w-full"
          />
        </UFormField>
      </div> -->

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
    "double_sliding": "Double Sliding",
    "single_sliding_left": "Single Sliding (Left)",
    "single_sliding_right": "Single Sliding (Right)",
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
    "double_sliding": "両開き",
    "single_sliding_left": "片開き (左)",
    "single_sliding_right": "片開き (右)",
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
