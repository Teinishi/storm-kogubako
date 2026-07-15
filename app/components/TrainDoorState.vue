<script setup lang="ts">
import type { TrainDoorState } from '~/composables/useCustomTrainDoor';

const FORMAT_OPTIONS_METER = {
  maximumFractionDigits: 5,
  style: 'unit',
  unit: 'meter',
} as const;

const { t } = useI18n({ useScope: 'local' });

const state = defineModel<TrainDoorState>({ required: true });
</script>

<template>
  <div class="grid lg:grid-cols-2 gap-4">
    <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
        <UFormField :label="t('door_width')">
          <div class="flex items-center gap-2">
            <UInputNumber
              v-model="state.doorWidth"
              :step="1"
              :min="1"
              class="flex-1"
            />
            <span class="text-muted">{{ t('blocks') }}</span>
          </div>
        </UFormField>

        <UFormField :label="t('door_height')">
          <div class="flex items-center gap-2">
            <UInputNumber
              v-model="state.doorHeight"
              :step="1"
              :min="1"
              class="flex-1"
            />
            <span class="text-muted">{{ t('blocks') }}</span>
          </div>
        </UFormField>

        <UFormField :label="t('door_thickness')">
          <UInputNumber
            v-model="state.doorThickness"
            :step="0.05"
            :min="0.05"
            class="w-full"
            :format-options="FORMAT_OPTIONS_METER"
          />
        </UFormField>

        <UFormField :label="t('door_z_offset')">
          <UInputNumber
            v-model="state.doorZOffset"
            :step="0.05"
            class="w-full"
            :format-options="FORMAT_OPTIONS_METER"
          />
        </UFormField>

        <ColorPicker
          v-model="state.outsideColor"
          :label="t('outside_color')"
        />

        <ColorPicker
          v-model="state.insideColor"
          :label="t('inside_color')"
        />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
        <UFormField :label="t('rubber_thickness')">
          <UInputNumber
            v-model="state.rubberThickness"
            :step="0.01"
            :min="0"
            class="w-full"
            :format-options="FORMAT_OPTIONS_METER"
          />
        </UFormField>

        <ColorPicker
          v-model="state.rubberColor"
          :label="t('rubber_color')"
        />
      </div>
    </div>

    <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
        <UFormField :label="t('window_x_offset')">
          <UInputNumber
            v-model="state.windowXOffset"
            :step="0.0625"
            class="w-full"
            :format-options="FORMAT_OPTIONS_METER"
          />
        </UFormField>

        <UFormField :label="t('window_y_offset')">
          <UInputNumber
            v-model="state.windowYOffset"
            :step="0.0625"
            class="w-full"
            :format-options="FORMAT_OPTIONS_METER"
          />
        </UFormField>

        <UFormField :label="t('window_width')">
          <UInputNumber
            v-model="state.windowWidth"
            :step="0.0625"
            :min="0"
            class="w-full"
            :format-options="FORMAT_OPTIONS_METER"
          />
        </UFormField>

        <UFormField :label="t('window_height')">
          <UInputNumber
            v-model="state.windowHeight"
            :step="0.0625"
            :min="0"
            class="w-full"
            :format-options="FORMAT_OPTIONS_METER"
          />
        </UFormField>

        <UFormField :label="t('window_corner_radius')">
          <UInputNumber
            v-model="state.windowCornerRadius"
            :step="0.01"
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
            class="w-full"
          />
        </UFormField>
      </div>
    </div>
  </div>
</template>

<i18n lang="json">
{
  "en": {
    "blocks": "Blocks",
    "door_width": "Door Width",
    "door_height": "Door Height",
    "door_thickness": "Door Thickness",
    "door_z_offset": "Door Z Offset",
    "outside_color": "Outside Base Color",
    "inside_color": "Inside Base Color",
    "rubber_thickness": "Rubber Thickness",
    "rubber_color": "Rubber Color",
    "window_x_offset": "Window X Offset",
    "window_y_offset": "Window Y Offset",
    "window_width": "Window Width",
    "window_height": "Window Height",
    "window_corner_radius": "Window Corner Radius",
    "window_corner_divisions": "Window Corner Divisions"
  },
  "ja": {
    "blocks": "ブロック",
    "door_width": "ドア幅",
    "door_height": "ドア高さ",
    "door_thickness": "ドア厚み",
    "door_z_offset": "ドアZ",
    "outside_color": "外側ベースカラー",
    "inside_color": "内側ベースカラー",
    "rubber_thickness": "戸先ゴム厚み",
    "rubber_color": "戸先ゴムカラー",
    "window_x_offset": "窓X",
    "window_y_offset": "窓Y",
    "window_width": "窓幅",
    "window_height": "窓高さ",
    "window_corner_radius": "窓角丸",
    "window_corner_divisions": "窓角分割数"
  }
}
</i18n>
