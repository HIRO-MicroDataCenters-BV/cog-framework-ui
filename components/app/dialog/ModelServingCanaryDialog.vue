<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="sm:max-w-[640px]">
      <DialogHeader>
        <DialogTitle>Create canary rollout</DialogTitle>
        <DialogDescription>
          Configure a new canary serving for
          <span class="font-semibold">{{ baseServing?.isvc_name }}</span>.
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="model_id" class="text-right">Model ID</Label>
          <Input
            id="model_id"
            v-model="form.model_id"
            class="col-span-3"
            placeholder="Required"
          />
        </div>

        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="isvc_name" class="text-right">Service name</Label>
          <Input
            id="isvc_name"
            v-model="form.isvc_name"
            class="col-span-3"
            placeholder="e.g. my-model-canary"
          />
        </div>

        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="model_name" class="text-right">Model name</Label>
          <Input
            id="model_name"
            v-model="form.model_name"
            class="col-span-3"
            placeholder="Required"
          />
        </div>

        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="model_version" class="text-right">Model version</Label>
          <Input
            id="model_version"
            v-model="form.model_version"
            class="col-span-3"
            placeholder="Required"
          />
        </div>

        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="dataset_id" class="text-right">Dataset ID</Label>
          <Input
            id="dataset_id"
            v-model="form.dataset_id"
            class="col-span-3"
            placeholder="Optional"
          />
        </div>

        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="transformer_image" class="text-right">
            Transformer image
          </Label>
          <Input
            id="transformer_image"
            v-model="form.transformer_image"
            class="col-span-3"
            placeholder="Optional"
          />
        </div>

        <div class="grid grid-cols-4 items-start gap-4">
          <Label class="text-right pt-2">Prometheus</Label>
          <div class="col-span-3 grid gap-2">
            <Input
              v-model="form.prometheus_url"
              placeholder="PROMETHEUS_URL (optional)"
            />
            <Input
              v-model="form.prometheus_metrics"
              placeholder="PROMETHEUS_METRICS (optional)"
            />
          </div>
        </div>

        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="protocol_version" class="text-right">
            Protocol version
          </Label>
          <Select v-model="form.protocol_version">
            <SelectTrigger id="protocol_version" class="col-span-3">
              <SelectValue placeholder="Select version" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="v1">V1</SelectItem>
              <SelectItem value="v2">V2</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="model_format" class="text-right">Model format</Label>
          <Input
            id="model_format"
            v-model="form.model_format"
            class="col-span-3"
            placeholder="e.g. mlflow, sklearn"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleClose">Cancel</Button>
        <Button :disabled="isSubmitting || !isValid" @click="handleSubmit">
          <Icon
            v-if="isSubmitting"
            name="lucide:loader-2"
            class="mr-2 h-4 w-4 animate-spin"
          />
          Create
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import type { ModelServing } from '~/types/model.types';

const props = defineProps<{
  open: boolean;
  baseServing: ModelServing | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'created'): void;
}>();

const { postModelServing } = useApi();
const toaster = useToaster();

const isSubmitting = ref(false);

const form = reactive({
  model_id: '',
  isvc_name: '',
  model_name: '',
  model_version: '',
  dataset_id: '',
  transformer_image: '',
  prometheus_url: '',
  prometheus_metrics: '',
  protocol_version: 'v1',
  model_format: '',
});

const isValid = computed(
  () =>
    !!form.model_id &&
    !!form.isvc_name &&
    !!form.model_name &&
    !!form.model_version &&
    !!form.protocol_version &&
    !!form.model_format,
);

watch(
  () => props.baseServing,
  (value) => {
    if (!value) return;
    form.model_id = value.model_id ?? '';
    form.model_name = value.model_name ?? '';
    form.model_version = value.model_version ?? '';
    form.dataset_id = value.dataset_id ?? '';
    form.isvc_name = `${value.isvc_name}-canary`;
  },
  { immediate: true },
);

const handleClose = () => {
  emit('close');
};

const handleSubmit = async () => {
  if (!isValid.value) return;
  isSubmitting.value = true;
  try {
    const transformer_parameters: Record<string, unknown> = {};
    if (form.prometheus_url) {
      transformer_parameters.PROMETHEUS_URL = form.prometheus_url;
    }
    if (form.prometheus_metrics) {
      transformer_parameters.PROMETHEUS_METRICS = form.prometheus_metrics;
    }

    await postModelServing({
      model_id: form.model_id,
      isvc_name: form.isvc_name,
      model_name: form.model_name,
      model_version: form.model_version,
      dataset_id: form.dataset_id,
      transformer_image: form.transformer_image,
      transformer_parameters,
      protocol_version: form.protocol_version,
      model_format: form.model_format,
    });

    toaster.show('success', 'Canary serving created');
    emit('created');
    handleClose();
  } catch (error) {
    console.error('Failed to create canary serving', error);
    toaster.show('error', 'Failed to create canary serving');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

