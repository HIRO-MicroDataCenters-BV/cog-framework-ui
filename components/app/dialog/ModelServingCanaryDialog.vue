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

      <!-- Step indicator (same style as dataset dialog) - hidden when no versions available -->
      <nav
        v-if="!noVersionsAvailable || loadingModelDetails"
        class="flex items-center mt-5 text-sm"
        aria-label="Progress"
      >
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
      <Separator
        v-if="!noVersionsAvailable || loadingModelDetails"
        class="mt-3 mb-2"
      />

      <!-- Separator and warning when no versions available -->
      <template v-if="noVersionsAvailable && !loadingModelDetails">
        <Separator class="mt-5 mb-4" />
        <div
          class="rounded-md border border-amber-400/60 bg-amber-50 dark:bg-amber-950/30 px-4 py-4 flex items-start gap-3 my-4"
        >
          <Icon
            name="lucide:alert-triangle"
            class="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
          />
          <div class="text-sm">
            <p class="font-medium text-amber-800 dark:text-amber-200">
              {{
                modelFetchError
                  ? $t('message.warning.canary_fetch_error_title')
                  : $t('message.warning.canary_no_versions_title')
              }}
            </p>
            <p class="text-amber-700 dark:text-amber-300/80 text-xs mt-1">
              {{
                modelFetchError
                  ? $t('message.warning.canary_fetch_error_description')
                  : $t('message.warning.canary_no_versions_description')
              }}
            </p>
          </div>
        </div>
      </template>

      <div
        v-if="!noVersionsAvailable || loadingModelDetails"
        class="grid gap-4 py-2"
      >
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
                v-if="form.model_id || form.model_version"
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
                  v-if="form.model_version"
                  class="flex items-center gap-2 text-amber-900 dark:text-amber-50"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block shrink-0"
                  />
                  <span>v{{ form.model_version }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Artifact Path Selection -->
          <div
            v-if="selectedModelId && (loadingArtifacts || artifactPaths.length)"
            class="grid grid-cols-4 items-center gap-4"
          >
            <Label class="text-right">Artifact *</Label>
            <div class="col-span-3">
              <div
                v-if="loadingArtifacts"
                class="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Icon name="lucide:loader-2" class="w-4 h-4 animate-spin" />
                Loading artifacts...
              </div>
              <Select v-else v-model="selectedArtifactPath">
                <SelectTrigger class="w-full">
                  <span v-if="selectedArtifactPath" class="truncate">
                    {{ selectedArtifactPath }}
                  </span>
                  <span v-else class="text-muted-foreground">
                    Select artifact
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="path in artifactPaths"
                    :key="path"
                    :value="path"
                  >
                    {{ path }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="isvc_name" class="text-right">Service name</Label>
            <Input
              id="isvc_name"
              v-model="form.isvc_name"
              class="col-span-3"
              placeholder="e.g. my-model-canary"
              disabled
            />
          </div>

          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right">Canary traffic</Label>
            <div class="col-span-3 flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                class="h-6 w-6 shrink-0"
                :class="
                  form.canary_traffic_percent <= 0
                    ? 'cursor-not-allowed opacity-50'
                    : 'cursor-pointer'
                "
                :disabled="form.canary_traffic_percent <= 0"
                :title="'-5'"
                @click="stepCanary(-5)"
              >
                <Icon name="lucide:minus" class="h-3 w-3" />
              </Button>
              <div class="flex-1 flex items-center gap-1.5 min-w-0">
                <input
                  v-model.number="form.canary_traffic_percent"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  class="flex-1 min-w-0 h-1 rounded-full appearance-none bg-muted dark:bg-zinc-700 accent-amber-500"
                />
                <span
                  class="text-[10px] font-medium tabular-nums w-8 text-right shrink-0"
                >
                  {{ form.canary_traffic_percent }}%
                </span>
              </div>
              <Button
                variant="outline"
                size="icon"
                class="h-6 w-6 shrink-0"
                :class="
                  form.canary_traffic_percent >= 100
                    ? 'cursor-not-allowed opacity-50'
                    : 'cursor-pointer'
                "
                :disabled="form.canary_traffic_percent >= 100"
                :title="'+5'"
                @click="stepCanary(5)"
              >
                <Icon name="lucide:plus" class="h-3 w-3" />
              </Button>
            </div>
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
            <Label class="pt-2 text-left">Transformer parameters</Label>
            <div class="col-span-3">
              <textarea
                v-model="form.transformer_parameters_json"
                :aria-invalid="
                  !isValidJson && !!form.transformer_parameters_json?.trim()
                "
                class="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-[13px] font-mono leading-snug shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                rows="4"
                placeholder='Optional - e.g. {"key": "value"}'
              />
              <p
                v-if="
                  !isValidJson && !!form.transformer_parameters_json?.trim()
                "
                class="mt-1 text-xs text-destructive flex items-center gap-1"
              >
                <Icon name="lucide:alert-circle" class="w-3 h-3" />
                Invalid JSON format
              </p>
            </div>
          </div>

          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right">Tag routing</Label>
            <div class="col-span-3 flex items-center gap-3">
              <Switch v-model="form.enable_tag_routing" />
              <span class="text-sm text-muted-foreground">
                {{ form.enable_tag_routing ? 'Enabled' : 'Disabled' }}
              </span>
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
                <div class="text-xs text-muted-foreground">Version</div>
                <div>
                  {{ form.model_version ? `v${form.model_version}` : '—' }}
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
              <div class="col-span-4 space-y-1">
                <div class="text-xs text-muted-foreground">Service name</div>
                <div class="font-medium truncate">
                  {{ form.isvc_name || '—' }}
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
              <div class="col-span-4 space-y-1">
                <div class="text-xs text-muted-foreground">
                  Canary traffic percentage
                </div>
                <div class="text-sm">{{ form.canary_traffic_percent }}%</div>
              </div>
              <div class="col-span-4 space-y-1">
                <div class="text-xs text-muted-foreground">Tag routing</div>
                <div class="text-sm">
                  {{ form.enable_tag_routing ? 'Enabled' : 'Disabled' }}
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
        <!-- Simple close button when no versions available -->
        <template v-if="noVersionsAvailable && !loadingModelDetails">
          <Button
            variant="outline"
            class="w-full sm:w-auto"
            @click="handleClose"
          >
            Close
          </Button>
        </template>

        <!-- Normal footer with navigation -->
        <template v-else>
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
        </template>
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
import { Switch } from '@/components/ui/switch';
import type { ModelServing } from '~/types/model.types';
import type {
  ModelArtifactFile,
  ModelArtifactsResponse,
} from '~/types/api.types';

const props = defineProps<{
  open: boolean;
  baseServing: ModelServing | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'created'): void;
}>();

const { patchModelServing, getModels, getModelArtifacts } = useApi();
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
  enable_tag_routing: false,
  // default 10% traffic to canary; user can adjust
  canary_traffic_percent: 10,
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
const noVersionsAvailable = ref(false);
const modelFetchError = ref(false);
const artifactPaths = ref<string[]>([]);
const selectedArtifactPath = ref('');
const loadingArtifacts = ref(false);

const isValidJson = computed(() => {
  const json = form.transformer_parameters_json?.trim();
  if (!json) return true; // Empty is valid (optional field)
  try {
    JSON.parse(json);
    return true;
  } catch {
    return false;
  }
});

const isValid = computed(() => {
  const hasRequiredBasics =
    !!form.model_id &&
    !!form.isvc_name &&
    !!form.model_name &&
    !!form.model_version;
  const hasRequiredArtifact =
    !artifactPaths.value.length || !!selectedArtifactPath.value;
  const traffic =
    typeof form.canary_traffic_percent === 'number'
      ? form.canary_traffic_percent
      : Number(form.canary_traffic_percent);
  const hasValidTraffic =
    !Number.isNaN(traffic) && traffic >= 0 && traffic <= 100;
  return (
    hasRequiredBasics &&
    hasRequiredArtifact &&
    hasValidTraffic &&
    isValidJson.value
  );
});

watch(
  () => props.baseServing,
  (value) => {
    if (!value) return;
    form.isvc_name = value.isvc_name ?? '';
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
  noVersionsAvailable.value = false;
  modelFetchError.value = false;
  artifactPaths.value = [];
  selectedArtifactPath.value = '';
  loadingArtifacts.value = false;
};

const canGoNext = computed(() => {
  if (currentStep.value === 0) {
    const hasRequiredArtifact =
      !artifactPaths.value.length || !!selectedArtifactPath.value;
    const traffic =
      typeof form.canary_traffic_percent === 'number'
        ? form.canary_traffic_percent
        : Number(form.canary_traffic_percent);
    const hasValidTraffic =
      !Number.isNaN(traffic) && traffic >= 0 && traffic <= 100;
    return (
      !!form.model_id &&
      !!form.isvc_name &&
      !!form.model_name &&
      !!form.model_version &&
      hasRequiredArtifact &&
      hasValidTraffic
    );
  }
  if (currentStep.value === 1) {
    return isValidJson.value;
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
    let transformer_parameters: Record<string, unknown> | undefined;
    if (raw) {
      try {
        transformer_parameters = JSON.parse(raw);
      } catch {
        transformer_parameters = undefined;
      }
    }

    const traffic =
      typeof form.canary_traffic_percent === 'number'
        ? form.canary_traffic_percent
        : Number(form.canary_traffic_percent);

    await patchModelServing(
      {
        model_id: form.model_id,
        isvc_name: form.isvc_name,
        model_name: form.model_name,
        model_version: form.model_version,
        artifact_path: selectedArtifactPath.value || undefined,
        dataset_id: form.dataset_id || undefined,
        transformer_image: form.transformer_image || undefined,
        transformer_parameters,
        enable_tag_routing: form.enable_tag_routing,
        canary_traffic_percent: traffic,
      },
      {
        successMessage: 'canary_serving_created',
      },
    );
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
  noVersionsAvailable.value = false;
  modelFetchError.value = false;
  try {
    const res = (await getModels(
      { name },
      { showToast: false },
    )) as ModelsApiResponse | null;
    const items = res?.data ?? [];

    // Check if we have any versions different from the current one
    const currentVersion = props.baseServing?.model_version;
    const differentVersions = items.filter(
      (m) =>
        m.version !== undefined &&
        m.version !== null &&
        String(m.version) !== String(currentVersion),
    );

    if (items.length === 0 || differentVersions.length === 0) {
      noVersionsAvailable.value = true;
    }

    if (items.length > 0) {
      const primary = items[0];
      form.model_id = String(primary.id ?? form.model_id);
      form.model_name = String(primary.name ?? form.model_name ?? '');
      if (primary.version !== undefined && primary.version !== null) {
        form.model_version = String(primary.version);
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
    modelFetchError.value = true;
    noVersionsAvailable.value = true;
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
};

const fetchModelArtifacts = async (modelId: string) => {
  if (!modelId) return;
  loadingArtifacts.value = true;
  artifactPaths.value = [];
  selectedArtifactPath.value = '';
  try {
    const res = await getModelArtifacts(modelId, { showToast: false });
    if (res?.data?.length && res.data[0]?.artifacts?.model_files) {
      const modelFiles = res.data[0].artifacts.model_files;
      // Extract unique first-level folder paths (first segment before "/")
      const folders = new Set<string>();
      modelFiles.forEach((file: ModelArtifactFile) => {
        const path = file.artifact_path;
        // Get only the first-level folder (e.g., "model" from "model/artifacts/file.pkl")
        const firstFolder = path.includes('/') ? path.split('/')[0] : path;
        if (firstFolder) {
          folders.add(firstFolder);
        }
      });
      artifactPaths.value = Array.from(folders);
    }
  } catch (error) {
    console.error('Failed to load model artifacts', error);
    artifactPaths.value = [];
  } finally {
    loadingArtifacts.value = false;
  }
};

watch(selectedModelId, (id) => {
  if (!id) return;
  const opt = availableVersions.value.find((m) => m.id === id);
  if (opt) {
    selectVersion(opt);
    fetchModelArtifacts(id);
  }
});
</script>
