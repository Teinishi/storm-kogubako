<script setup lang="ts">
const { t } = useI18n({
  useScope: 'local',
});

const props = defineProps<{
  label?: string;
  removable?: boolean;
}>();
const file = defineModel<File | null>();
const emit = defineEmits<{
  (e: 'update:image', value: HTMLImageElement | null): void;
}>();

const imgUrl = ref<string | undefined>(undefined);

const loadFile = (loadedFile: File | null | undefined) => {
  if (!loadedFile) {
    file.value = null;
    emit('update:image', null);
    imgUrl.value = undefined;
    return;
  }

  file.value = loadedFile;

  const reader = new FileReader();
  reader.addEventListener('load', (evt) => {
    const img = new Image();
    img.onload = () => {
      emit('update:image', img);
    };
    img.src = evt.target?.result as string;
    imgUrl.value = img.src;
  });
  reader.readAsDataURL(loadedFile);
};

watch(file, loadFile);
</script>

<template>
  <UFormField :label="props.label">
    <UFileUpload
      v-slot="{ open, removeFile }"
      v-model="file"
      accept="image/*"
    >
      <div class="flex flex-wrap items-center gap-3">
        <UAvatar
          size="lg"
          :src="imgUrl"
          icon="i-lucide-image"
        />

        <template v-if="file">
          <span
            class="text-xs text-muted"
          >{{ file.name }}</span>

          <UButton
            v-if="props.removable"
            color="error"
            icon="i-lucide-trash"
            variant="ghost"
            size="xs"
            @click="removeFile(); loadFile(null)"
          />
        </template>

        <UButton
          icon="i-lucide-upload"
          :label="t('pick')"
          color="neutral"
          variant="outline"
          @click="open()"
        />
      </div>
    </UFileUpload>
  </UFormField>
</template>

<i18n lang="json">
{
  "en": {
    "pick": "Pick"
  },
  "ja": {
    "pick": "選択"
  }
}
</i18n>
