<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="sm:max-w-[640px]">
      <DialogHeader>
        <DialogTitle>Create model serving</DialogTitle>
        <DialogDescription>
          Configure a new serving endpoint for
          <span class="font-semibold">{{ model?.name ?? 'this model' }}</span>
        </DialogDescription>
      </DialogHeader>

      <!-- Step indicator (same as ModelServingCanaryDialog) -->
      <nav class="flex items-center mt-5 text-sm" aria-label="Progress">
        <template v-for="(step, i) in steps" :key="step.id">
          <button
            type="button"
            class="flex items-center gap-2 text-sm transition-colors whitespace-nowrap"
            :class="
              i <= currentStep ? 'text-foreground' : 'text-muted-foreground/60'
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
      <Separator class="mt-3 mb-2" />

      <div class="grid gap-4 py-2">
        <!-- Step 0: Required details -->
        <div v-if="currentStep === 0" class="space-y-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right">Model name</Label>
            <span class="col-span-3 text-sm">{{ form.model_name || '—' }}</span>
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right">Model ID</Label>
            <span
              class="col-span-3 font-mono text-xs text-muted-foreground break-all"
              >{{ form.model_id || '—' }}</span
            >
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right">Model version</Label>
            <span class="col-span-3 text-sm">{{
              form.model_version ? `v${form.model_version}` : '—'
            }}</span>
          </div>

          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="isvc_name" class="text-right">Service name</Label>
            <Input
              id="isvc_name"
              v-model="form.isvc_name"
              class="col-span-3"
              placeholder="e.g. my-model-serving"
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
                </SelectContent>
              </Select>
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
            <Label class="text-right pt-2">Transformer parameters</Label>
            <div class="col-span-3">
              <textarea
                v-model="form.transformer_parameters_json"
                class="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-[13px] font-mono leading-snug shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                rows="4"
                placeholder="Optional"
              />
            </div>
          </div>
        </div>

        <!-- Step 2: Review -->
        <div v-else-if="currentStep === 2" class="space-y-4 text-sm">
          <div
            class="rounded-md border border-border/60 bg-muted/20 px-3 py-2 space-y-3"
          >
            <div
              class="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Model
            </div>
            <div class="grid grid-cols-4 gap-3">
              <div class="col-span-2 space-y-1">
                <div class="text-xs text-muted-foreground">Name</div>
                <div class="font-medium truncate">
                  {{ form.model_name || '—' }}
                </div>
              </div>
              <div class="col-span-2 space-y-1">
                <div class="text-xs text-muted-foreground">
                  Version / Format
                </div>
                <div>
                  {{ form.model_version ? `v${form.model_version}` : '—' }}
                  <span v-if="form.model_format">
                    · {{ form.model_format }}
                  </span>
                </div>
              </div>
              <div class="col-span-4 space-y-1">
                <div class="text-xs text-muted-foreground">Model ID</div>
                <div class="font-mono text-[11px] break-all">
                  {{ form.model_id || '—' }}
                </div>
              </div>
            </div>
          </div>

          <div
            class="rounded-md border border-border/60 bg-muted/20 px-3 py-2 space-y-3"
          >
            <div
              class="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Deployment
            </div>
            <div class="grid grid-cols-4 gap-3">
              <div class="col-span-2 space-y-1">
                <div class="text-xs text-muted-foreground">Service name</div>
                <div class="font-medium truncate">
                  {{ form.isvc_name || '—' }}
                </div>
              </div>
              <div class="col-span-2 space-y-1">
                <div class="text-xs text-muted-foreground">Protocol</div>
                <div class="font-medium">
                  {{ form.protocol_version?.toUpperCase() || '—' }}
                </div>
              </div>
              <div class="col-span-4 space-y-1">
                <div class="text-xs text-muted-foreground">
                  Dataset ID (optional)
                </div>
                <div class="font-mono text-[11px] break-all">
                  {{ form.dataset_id || '—' }}
                </div>
              </div>
            </div>
          </div>

          <div
            class="rounded-md border border-border/60 bg-muted/10 px-3 py-2 space-y-3"
          >
            <div
              class="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Transformer & metrics
            </div>
            <div class="space-y-2">
              <div class="space-y-1">
                <div class="text-xs text-muted-foreground">
                  Transformer image
                </div>
                <div class="font-mono text-[11px] break-all">
                  {{ form.transformer_image || '—' }}
                </div>
              </div>
              <div class="space-y-1">
                <div class="text-xs text-muted-foreground">
                  Transformer parameters (optional)
                </div>
                <div
                  class="font-mono text-[11px] wrap-break-word max-h-24 overflow-y-auto rounded-sm bg-background/40 px-2 py-1 border border-border/40"
                >
                  {{ form.transformer_parameters_json || '—' }}
                </div>
              </div>
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
import { Separator } from '@/components/ui/separator';

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
const currentStep = ref(0);

const steps = [
  { id: 'details', label: 'Details' },
  { id: 'advanced', label: 'Transformer & Metrics' },
  { id: 'review', label: 'Review' },
];

const blankForm = () => ({
  model_id: '',
  isvc_name: '',
  model_name: '',
  model_version: '',
  dataset_id: '',
  transformer_image: '',
  transformer_parameters_json: '',
  protocol_version: 'v1' as 'v1' | 'v2',
  model_format: '',
});

const form = reactive(blankForm());

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
  () => props.model,
  (m) => {
    Object.assign(form, blankForm());
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

watch(
  () => props.open,
  (open) => {
    if (!open) {
      resetState();
    }
  },
);

const resetState = () => {
  Object.assign(form, blankForm());
  currentStep.value = 0;
  isSubmitting.value = false;
};

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
  resetState();
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
    const raw = form.transformer_parameters_json?.trim();
    const transformer_parameters = raw ? (raw as unknown) : undefined;

    await postModelServing({
      model_id: form.model_id,
      isvc_name: form.isvc_name,
      model_name: form.model_name,
      model_version: form.model_version,
      dataset_id: form.dataset_id || undefined,
      transformer_image: form.transformer_image || undefined,
      transformer_parameters,
      protocol_version: form.protocol_version,
      model_format: form.model_format,
    });

    toaster.show('success', 'Model serving created');
    emit('created');
    resetState();
    emit('close');
  } catch (error) {
    console.error('Failed to create model serving', error);
    toaster.show('error', 'Failed to create model serving');
  } finally {
    isSubmitting.value = false;
  }
};
</script>
