<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{{ t('title.edit_model_serving') }}</DialogTitle>
        <DialogDescription>
          {{
            t('description.edit_model_serving', {
              name: modelServing?.isvc_name,
            })
          }}
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="traffic" class="text-right">
            {{ t('label.canary_traffic_percent') }}
          </Label>
          <Input
            id="traffic"
            v-model="trafficPercent"
            type="number"
            min="0"
            max="100"
            class="col-span-3"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="handleClose">
          {{ t('action.cancel') }}
        </Button>
        <Button :disabled="isLoading" @click="handleSave">
          <Icon
            v-if="isLoading"
            name="lucide:loader-2"
            class="mr-2 h-4 w-4 animate-spin"
          />
          {{ t('action.save') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
import type { ModelServing } from '~/types/model.types';

const { t } = useI18n();
const { patchModelServing } = useApi();

const props = defineProps<{
  open: boolean;
  modelServing: ModelServing | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved'): void;
}>();

const isLoading = ref(false);
const trafficPercent = ref(0);

watch(
  () => props.modelServing,
  (value) => {
    if (value) {
      trafficPercent.value =
        value.canary_traffic_percent ?? value.traffic_percentage ?? 0;
    }
  },
  { immediate: true },
);

const handleClose = () => {
  emit('close');
};

const handleSave = async () => {
  if (!props.modelServing) return;

  isLoading.value = true;
  try {
    await patchModelServing({
      isvc_name: props.modelServing.isvc_name,
      canary_traffic_percent: trafficPercent.value,
    });
    emit('saved');
    handleClose();
  } catch (error) {
    console.error('Failed to update model serving:', error);
  } finally {
    isLoading.value = false;
  }
};
</script>
