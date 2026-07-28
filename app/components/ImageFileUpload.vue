<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' });

const props = defineProps<{
  label?: string;
  removable?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:image', value: HTMLImageElement | null): void;
}>();

const file = defineModel<File | null>();

const imgUrl = ref<string | undefined>(undefined);

const dropZoneRef = useTemplateRef('dropZoneRef');

const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop(files) {
    if (files !== null) {
      loadFile(files[0]);
    }
  },
  dataTypes: (types) => types.every((type) => type.startsWith('image/')),
  multiple: false,
  preventDefaultForUnhandled: true,
});

function loadFile(loadedFile: File | null | undefined) {
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
}

watch(file, loadFile);
</script>

<template>
  <UFormField :label="props.label">
    <UFileUpload v-slot="{ open, removeFile }" v-model="file" accept="image/*">
      <div ref="dropZoneRef" class="relative">
        <div class="flex flex-wrap items-center gap-3">
          <UAvatar class="rounded-sm" size="lg" :src="imgUrl" icon="i-lucide-image" />

          <template v-if="file">
            <span class="text-muted text-xs">{{ file.name }}</span>

            <UButton
              v-if="props.removable"
              color="error"
              icon="i-lucide-trash"
              variant="ghost"
              size="xs"
              @click="
                removeFile();
                loadFile(null);
              "
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

        <div
          v-if="isOverDropZone"
          class="border-primary bg-default absolute inset-0 flex items-center gap-3 rounded-sm border border-dashed px-3 shadow-sm"
        >
          <UIcon name="i-lucide-upload" class="text-primary size-5" />

          <p class="text-sm font-semibold">
            {{ t('fileUpload.dropTitle') }}
          </p>
        </div>
      </div>
    </UFileUpload>
  </UFormField>
</template>

<i18n lang="json">
{
  "en": {
    "pick": "Pick",
    "fileUpload": {
      "dropTitle": "Drop image to upload"
    }
  },
  "ja": {
    "pick": "選択",
    "fileUpload": {
      "dropTitle": "画像をドロップ"
    }
  }
}
</i18n>
