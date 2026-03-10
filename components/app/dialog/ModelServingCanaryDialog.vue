<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="sm:max-w-[640px]">
      <DialogHeader>
        <DialogTitle>Create canary rollout</DialogTitle>
        <DialogDescription>
          Configure a new canary serving for
          <span class="font-semibold">{{ baseServing?.isvc_name }}</span>
        </DialogDescription>
      </DialogHeader>

      <!-- Step indicator (same style as dataset dialog) -->
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
          <div
            v-if="availableVersions.length"
            class="grid grid-cols-4 items-center gap-4"
          >
            <Label class="text-right">Select model</Label>
            <Select v-model="selectedModelId">
              <SelectTrigger class="col-span-3 min-w-[320px]">
                <span v-if="form.model_name" class="truncate max-w-full">
                  {{ form.model_name }}
                </span>
                <span v-else class="text-muted-foreground">
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
                    <span
                      class="break-all text-[10px] font-mono text-muted-foreground"
                    >
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
              </template>
              <div
                v-if="form.model_id || form.model_version || form.model_format"
                class="mt-1 rounded-md border border-amber-400/60 bg-amber-400/10 dark:bg-amber-400/15 px-2.5 py-1.5 text-[11px] flex flex-col gap-0.5"
              >
                <div
                  class="flex items-center gap-2 text-amber-900 dark:text-amber-50"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block shrink-0"
                  />
                  <span v-if="form.model_id" class="font-mono text-[10px]">
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
                  <span v-if="form.model_version"
                    >v{{ form.model_version }}</span
                  >
                  <span v-if="form.model_format"
                    >({{ form.model_format }})</span
                  >
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
            class="rounded-md border border-border/60 bg-muted/30 px-3 py-2 space-y-3"
          >
            <div class="flex items-center justify-between">
              <span
                class="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Model
              </span>
              <span
                class="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-800"
              >
                Canary preview
              </span>
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
    form.isvc_name = `${value.isvc_name}-canary`;
    const name = value.model_name || value.isvc_name;
    if (name) {
      loadModelDetailsByName(name);
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
  availableVersions.value = [];
  selectedModelId.value = '';
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
      dataset_id: form.dataset_id,
      transformer_image: form.transformer_image,
      transformer_parameters,
      protocol_version: form.protocol_version,
      model_format: form.model_format,
    });

    toaster.show('success', 'Canary serving created');
    emit('created');
    resetState();
    emit('close');
  } catch (error) {
    console.error('Failed to create canary serving', error);
    toaster.show('error', 'Failed to create canary serving');
  } finally {
    isSubmitting.value = false;
  }
};

interface ModelsApiItem {
  id?: string;
  name?: string;
  version?: number | null;
  type?: string;
}
interface ModelsApiResponse {
  data?: ModelsApiItem[];
}

const loadModelDetailsByName = async (name: string) => {
  loadingModelDetails.value = true;
  try {
    const res = (await getModels({ name })) as ModelsApiResponse | null;
    const items = res?.data ?? [];
    if (items.length > 0) {
      const primary = items[0];
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
      (m: ModelsApiItem): ModelSummary => ({
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

watch(selectedModelId, (id) => {
  if (!id) return;
  const opt = availableVersions.value.find((m) => m.id === id);
  if (opt) {
    selectVersion(opt);
  }
});
</script>
