<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="sm:max-w-[640px]">
      <DialogHeader>
        <DialogTitle>Create model serving</DialogTitle>
        <DialogDescription>
          Configure a new serving endpoint for
          <span class="font-semibold">{{ model?.name ?? 'this model' }}</span>.
        </DialogDescription>
      </DialogHeader>

      <div class="mt-4 grid gap-4 py-2">
        <div class="space-y-4">
          <!-- Model info (mostly prefilled) -->
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right">Model name</Label>
            <Input
              v-model="form.model_name"
              class="col-span-3"
              :readonly="!!model"
            />
          </div>

          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="model_id" class="text-right">Model ID</Label>
            <Input
              id="model_id"
              v-model="form.model_id"
              class="col-span-3 font-mono text-xs"
              :readonly="!!model"
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

          <!-- Serving details -->
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="isvc_name" class="text-right">Service name</Label>
            <Input
              id="isvc_name"
              v-model="form.isvc_name"
              class="col-span-3"
              placeholder="e.g. fraud-detector"
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
            <Label for="model_format" class="text-right">Model format</Label>
            <div class="col-span-3">
              <Select v-model="form.model_format">
                <SelectTrigger id="model_format" class="w-full">
                  <SelectValue placeholder="Select model format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mlflow">mlflow</SelectItem>
                  <SelectItem value="sklearn">sklearn</SelectItem>
                  <SelectItem value="xgboost">xgboost</SelectItem>
                  <SelectItem value="lightgbm">lightgbm</SelectItem>
                  <SelectItem value="tensorflow">tensorflow</SelectItem>
                  <SelectItem value="pytorch">pytorch</SelectItem>
                  <SelectItem value="pmml">pmml</SelectItem>
                  <SelectItem value="paddle">paddle</SelectItem>
                  <SelectItem value="tensorrt">tensorrt</SelectItem>
                  <SelectItem value="other">other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right">Protocol version</Label>
            <div class="col-span-3">
              <RadioGroup
                v-model="form.protocol_version"
                class="flex gap-4"
                orientation="horizontal"
              >
                <div class="flex items-center space-x-2">
                  <RadioGroupItem id="protocol_v1_model" value="v1" />
                  <Label for="protocol_v1_model" class="font-normal cursor-pointer">
                    V1
                  </Label>
                </div>
                <div class="flex items-center space-x-2">
                  <RadioGroupItem id="protocol_v2_model" value="v2" />
                  <Label for="protocol_v2_model" class="font-normal cursor-pointer">
                    V2
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <!-- Transformer & metrics -->
          <div class="pt-2 space-y-3 border-t border-border/60">
            <div class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Transformer & metrics (optional)
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

            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="prometheus_url" class="text-right">
                PROMETHEUS_URL
              </Label>
              <Input
                id="prometheus_url"
                v-model="form.prometheus_url"
                class="col-span-3"
                placeholder="Optional"
              />
            </div>

            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="prometheus_metrics" class="text-right">
                PROMETHEUS_METRICS
              </Label>
              <Input
                id="prometheus_metrics"
                v-model="form.prometheus_metrics"
                class="col-span-3"
                placeholder="Optional"
              />
            </div>
          </div>
        </div>
      </div>

      <DialogFooter class="mt-2">
        <div
          class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <Button variant="outline" @click="handleClose">Cancel</Button>
          <div class="flex items-center gap-2">
            <Button
              :disabled="isSubmitting || !isValid"
              @click="handleSubmit"
            >
              <Icon
                v-if="isSubmitting"
                name="lucide:loader-2"
                class="mr-2 h-4 w-4 animate-spin"
              />
              Create serving
            </Button>
          </div>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
import type { ModelDetail, ModelSummary } from '~/types/model.types';
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
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';

const props = defineProps<{
  open: boolean;
  model: ModelDetail | ModelSummary | null;
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
  protocol_version: 'v1' as 'v1' | 'v2',
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

const resetForm = () => {
  form.model_id = '';
  form.isvc_name = '';
  form.model_name = '';
  form.model_version = '';
  form.dataset_id = '';
  form.transformer_image = '';
  form.prometheus_url = '';
  form.prometheus_metrics = '';
  form.protocol_version = 'v1';
  form.model_format = '';
};

watch(
  () => props.model,
  (m) => {
    resetForm();
    if (!m) return;
    form.model_id = String((m as any).id ?? '');
    form.model_name = String((m as any).name ?? '');
    form.model_version =
      (m as any).version !== undefined && (m as any).version !== null
        ? String((m as any).version)
        : '';
    form.isvc_name = form.model_name ? `${form.model_name}-serving` : '';
    if ((m as any).type) {
      form.model_format = String((m as any).type).toLowerCase();
    }
  },
  { immediate: true },
);

const handleClose = () => {
  resetForm();
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
      dataset_id: form.dataset_id || undefined,
      transformer_image: form.transformer_image || undefined,
      transformer_parameters:
        Object.keys(transformer_parameters).length > 0
          ? transformer_parameters
          : undefined,
      protocol_version: form.protocol_version,
      model_format: form.model_format,
    });

    toaster.show('success', 'Model serving created');
    emit('created');
    handleClose();
  } catch (error) {
    console.error('Failed to create model serving', error);
    toaster.show('error', 'Failed to create model serving');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

