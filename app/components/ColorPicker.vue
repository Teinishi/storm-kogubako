<script setup lang="ts">
const props = defineProps<{
  label?: string;
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:model-value', value: string | undefined): void;
}>();

const { t } = useI18n({
  useScope: 'local',
});

const hexColor = ref<string | undefined>(undefined);
const rgb = computed(() => hexColor.value !== undefined ? hexToRgb(hexColor.value) : { r: 0, g: 0, b: 0 });

const updateHex = (value: string | undefined) => {
  if (value === undefined) return;
  const hex = rgbToHex(hexToRgb(value));
  hexColor.value = hex;
  emit('update:model-value', hex);
};

const updateRgb = (value: number | null, channel: 'r' | 'g' | 'b') => {
  if (!value) return;
  const newColor = { ...rgb.value };
  if (channel === 'r') {
    newColor.r = value;
  }
  else if (channel === 'g') {
    newColor.g = value;
  }
  else if (channel === 'b') {
    newColor.b = value;
  }
  const hex = rgbToHex(newColor);
  hexColor.value = hex;
  emit('update:model-value', hex);
};

onBeforeMount(() => {
  updateHex(props.modelValue);
});
</script>

<template>
  <UPopover class="grow">
    <UButton
      :label="label ?? t('pick_color')"
      color="neutral"
      variant="outline"
    >
      <template #leading>
        <span
          :style="{ backgroundColor: modelValue }"
          class="size-3 rounded-full ring ring-accented"
        />
      </template>
    </UButton>

    <template #content>
      <div class="p-4 flex flex-col gap-2">
        <UColorPicker
          :model-value="modelValue"
          @update:model-value="updateHex"
        />

        <UFormField
          label="HEX"
          size="sm"
        >
          <UInput
            v-model="hexColor"
            class="w-full"
            @change="updateHex(hexColor)"
          />
        </UFormField>

        <div class="grid grid-cols-3 gap-1">
          <UFormField
            label="R"
            size="sm"
          >
            <UInputNumber
              :model-value="rgb.r"
              :min="0"
              :max="255"
              orientation="vertical"
              placeholder="R"
              class="w-16"
              @update:model-value="updateRgb($event, 'r')"
            />
          </UFormField>
          <UFormField
            label="G"
            size="sm"
          >
            <UInputNumber
              :model-value="rgb.g"
              :min="0"
              :max="255"
              orientation="vertical"
              placeholder="G"
              size="sm"
              class="w-16"
              @update:model-value="updateRgb($event, 'g')"
            />
          </UFormField>
          <UFormField
            label="B"
            size="sm"
          >
            <UInputNumber
              :model-value="rgb.b"
              :min="0"
              :max="255"
              orientation="vertical"
              placeholder="B"
              size="sm"
              class="w-16"
              @update:model-value="updateRgb($event, 'b')"
            />
          </UFormField>
        </div>
      </div>
    </template>
  </UPopover>
</template>

<i18n lang="json">
{
  "en": {
    "pick_color": "Pick Color"
  },
  "ja": {
    "pick_color": "色を選択"
  }
}
</i18n>
