<template>
  <AppDialog
    :open="open"
    :title="t('title.upload_component')"
    :actions="['upload']"
    @on-close="handleClose"
    @on-action="handleAction"
  >
    <div class="space-y-6">
      <div>
        <Label for="yaml-file" class="text-sm font-medium">
          {{ t('label.yaml_file') }}
        </Label>
        <Input
          id="yaml-file"
          ref="fileInput"
          type="file"
          accept=".yaml,.yml"
          class="mt-2"
          @change="onFileChange"
        />
        <p v-if="error" class="text-sm text-red-500 mt-1">{{ error }}</p>
      </div>

      <div>
        <Label for="category" class="text-sm font-medium">
          {{ t('label.category') }}
        </Label>
        <Input
          id="category"
          v-model="category"
          type="text"
          :placeholder="t('placeholder.category')"
          class="mt-2"
        />
      </div>
    </div>
  </AppDialog>
</template>

<script lang="ts" setup>
const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    open?: boolean;
  }>(),
  {
    open: false,
  },
);

const open = ref(props.open);
const selectedFile = ref<File | null>(null);
const category = ref('');
const error = ref('');
const fileInput = ref<HTMLInputElement | null>(null);

watch(
  () => props.open,
  (value) => {
    open.value = value;
    if (value) {
      // Reset form when dialog opens
      selectedFile.value = null;
      category.value = '';
      error.value = '';
      if (fileInput.value) {
        fileInput.value.value = '';
      }
    }
  },
);

const emit = defineEmits<{
  (e: 'on-close'): void;
}>();

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    // Validate file type
    const allowedTypes = ['.yaml', '.yml'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (allowedTypes.includes(fileExtension)) {
      selectedFile.value = file;
      error.value = '';
    } else {
      error.value = t('message.error.invalid_file_type');
      selectedFile.value = null;
    }
  }
};

const handleClose = async () => {
  emit('on-close');
  return true;
};

const handleAction = async (action: string | number | boolean) => {
  const actionStr = String(action);
  if (actionStr === 'close') {
    await handleClose();
  } else if (actionStr === 'upload') {
    await handleUpload();
  }
};

const handleUpload = async () => {
  if (!selectedFile.value) {
    error.value = t('message.error.no_file_selected');
    return;
  }

  try {
    const { postTrainingBuilderComponentFile } = useApi();

    const formData = new FormData();
    formData.append('yaml_file', selectedFile.value);

    if (category.value.trim()) {
      formData.append('category', category.value.trim());
    }

    const response = await postTrainingBuilderComponentFile(formData);

    if (response && 'data' in response && response.data) {
      await handleClose();
    }
  } catch (error) {
    console.error('Upload error:', error);
  }
};
</script>
