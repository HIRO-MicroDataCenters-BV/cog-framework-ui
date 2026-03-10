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

      <!-- Step indicator (same style as dataset dialog) -->
      <nav class="flex items-center mt-5 text-sm" aria-label="Progress">
        <template v-for="(step, i) in steps" :key="step.id">
          <button
            type="button"
            class="flex items-center gap-2 text-sm transition-colors whitespace-nowrap"
            :class="
              i <= currentStep
                ? 'text-foreground'
                : 'text-muted-foreground/60'
            "
            :disabled="i > currentStep"
            @click="goToStep(i)"
          >
            <span
              class="flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium transition-all duration-200"
              :class="
                i < currentStep
                  ? 'bg-primary text-primary-foreground'
                  : i === currentStep
                    ? 'border border-primary text-foreground'
                    : 'bg-muted text-muted-foreground'
              "
            >
              <Icon
                v-if="i < currentStep"
                name="lucide:check"
                class="w-3.5 h-3.5"
              />
              <span v-else>{{ i + 1 }}</span>
            </span>
            <span class="hidden sm:inline font-medium">
              {{ step.label }}
            </span>
          </button>
          <Separator
            v-if="i < steps.length - 1"
            class="flex-1 mx-3 transition-colors duration-200"
            :class="i < currentStep ? 'bg-primary!' : 'bg-border!'"
          />
        </template>
      </nav>

      <div class="mt-2 grid gap-4 py-2">
        <!-- Step 0: Required details -->
        <div v-if="currentStep === 0" class="space-y-4">
          <div
            v-if="availableVersions.length"
            class="grid grid-cols-4 items-center gap-4"
          >
            <Label class="text-right">Select model</Label>
            <Select v-model="selectedModelId">
              <SelectTrigger class="col-span-3 min-w-[320px]">
                <span
                  v-if="form.model_name"
                  class="truncate max-w-full"
                >
                  {{ form.model_name }}
                </span>
                <span
                  v-else
                  class="text-muted-foreground"
                >
                  Choose model / version
                </span>
              </SelectTrigger>
              <SelectContent class="min-w-[min(420px,90vw)]">
                <SelectItem
                  v-for="opt in availableVersions"
                  :key="opt.id"
                  :value="opt.id"
                >
                  <div class="flex flex-col gap-0.5">
                    <span>
                      {{ opt.name }} · v{{ opt.version
                      }}<span v-if="opt.type"> ({{ opt.type }})</span>
                    </span>
                    <span class="break-all text-[10px] font-mono text-muted-foreground">
                      {{ opt.id }}
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid grid-cols-4 items-start gap-4">
            <div />
            <div class="col-span-3 flex flex-col gap-2">
              <template v-if="!selectedModelId">
                <Input
                  id="model_id"
                  v-model="form.model_id"
                  placeholder="Required"
                />
                <Input
                  id="model_version"
                  v-model="form.model_version"
                  placeholder="Version"
                />
                <Input
                  id="model_format"
                  v-model="form.model_format"
                  placeholder="Format (e.g. mlflow, sklearn)"
                />
              </template>
              <div
                v-if="form.model_id || form.model_version || form.model_format"
                class="mt-1 rounded-md border border-amber-400/60 bg-amber-400/10 dark:bg-amber-400/15 px-2.5 py-1.5 text-[11px] flex flex-col gap-0.5"
              >
                <div class="flex items-center gap-2 text-amber-900 dark:text-amber-50">
                  <span
                    class="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block shrink-0"
                  />
                  <span
                    v-if="form.model_id"
                    class="font-mono text-[10px]"
                  >
                    {{ form.model_id }}
                  </span>
                </div>
                <div
                  v-if="form.model_version || form.model_format"
                  class="flex items-center gap-2 text-amber-900 dark:text-amber-50"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block shrink-0"
                  />
                  <span v-if="form.model_version">v{{ form.model_version }}</span>
                  <span v-if="form.model_format">({{ form.model_format }})</span>
                </div>
              </div>
            </div>
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

          
        </div>

        <!-- Step 1: Optional / advanced -->
        <div v-else-if="currentStep === 1" class="space-y-4">
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
        </div>
      </div>

      <DialogFooter class="mt-2">
        <Button variant="outline" @click="handleClose">Cancel</Button>
        <Button
          v-if="currentStep > 0"
          variant="ghost"
          size="sm"
          @click="previousStep"
        >
          Back
        </Button>
        <Button
          v-if="currentStep < steps.length - 1"
          size="sm"
          :disabled="!canGoNext"
          @click="nextStep"
        >
          Next
        </Button>
        <Button
          v-else
          :disabled="isSubmitting || !isValid"
          @click="handleSubmit"
        >
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
import { Select, SelectContent, SelectItem, SelectTrigger } from '~/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type { ModelServing } from '~/types/model.types';

const props = defineProps<{
  open: boolean;
  baseServing: ModelServing | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'created'): void;
}>();

const { postModelServing, getModels } = useApi();
const toaster = useToaster();

const isSubmitting = ref(false);
const currentStep = ref(0);

const steps = [
  { id: 'details', label: 'Details' },
  { id: 'advanced', label: 'Transformer & Metrics' },
];

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

type ModelSummary = {
  id: string;
  name: string;
  type?: string;
  version?: string | number;
};

const availableVersions = ref<ModelSummary[]>([]);
const loadingModelDetails = ref(false);
const selectedModelId = ref('');

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
    form.dataset_id = value.dataset_id ?? '';
    form.isvc_name = `${value.isvc_name}-canary`;
    const name = value.model_name || value.isvc_name;
    if (name) {
      loadModelDetailsByName(name);
    }
  },
  { immediate: true },
);

const canGoNext = computed(() => {
  if (currentStep.value === 0) {
    return (
      !!form.model_id &&
      !!form.isvc_name &&
      !!form.model_name &&
      !!form.model_version
    );
  }
  return true;
});

const handleClose = () => {
  emit('close');
};

const nextStep = () => {
  if (currentStep.value < steps.length - 1 && canGoNext.value) {
    currentStep.value++;
  }
};

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
};

const goToStep = (index: number) => {
  if (index <= currentStep.value) {
    currentStep.value = index;
  }
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

const loadModelDetailsByName = async (name: string) => {
  loadingModelDetails.value = true;
  try {
    const res = await getModels({ name });
    const items = (res as any)?.data ?? [];
    if (items.length > 0) {
      const primary = items[0] as any;
      form.model_id = String(primary.id ?? form.model_id);
      form.model_name = String(primary.name ?? form.model_name ?? '');
      if (primary.version !== undefined && primary.version !== null) {
        form.model_version = String(primary.version);
      }
      if (primary.type && !form.model_format) {
        form.model_format = String(primary.type);
      }
    }
    availableVersions.value = items.map(
      (m: any): ModelSummary => ({
        id: String(m.id),
        name: String(m.name ?? ''),
        type: m.type ? String(m.type) : undefined,
        version:
          m.version !== undefined && m.version !== null
            ? String(m.version)
            : undefined,
      }),
    );
    if (availableVersions.value.length) {
      selectedModelId.value = availableVersions.value[0].id;
    }
  } catch (error) {
    console.error('Failed to load model details', error);
  } finally {
    loadingModelDetails.value = false;
  }
};

const selectVersion = (opt: ModelSummary) => {
  if (opt.version !== undefined) {
    form.model_version = String(opt.version);
  }
  form.model_id = opt.id;
   if (opt.name) {
    form.model_name = opt.name;
  }
  if (opt.type) {
    form.model_format = opt.type;
  }
};

watch(
  selectedModelId,
  (id) => {
    if (!id) return;
    const opt = availableVersions.value.find((m) => m.id === id);
    if (opt) {
      selectVersion(opt);
    }
  },
);
</script>

