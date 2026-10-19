<script setup lang="ts">
/**
 * Training-job launch dialog.
 *
 * Submits `POST /cogapi/training-jobs`. The form is driven by the algorithm
 * catalog (`GET /cogapi/training-jobs/algorithms`): picking an algorithm
 * shows its framework/task, narrows the dataset picker to the dataset shape
 * it accepts, and renders one input per declared hyperparameter (type,
 * default and bounds come from the spec, so a new catalog entry needs no UI
 * change). The backend re-validates everything; the client checks mirror
 * its bounds only to explain a greyed-out Launch button.
 */
import { computed, ref, watch } from 'vue';
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
import { Spinner } from '~/components/ui/spinner';
import { useApi } from '@/composables/api';
import type {
  TrainingAlgorithm,
  TrainingHyperparamSpec,
  TrainingJob,
} from '~/types/api.types';

interface DatasetOption {
  id: string;
  dataset_name?: string;
  name?: string;
  train_and_inference_type?: number;
  data_source_type?: number;
}

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'created', payload: TrainingJob): void;
}>();

const {
  getTrainingAlgorithms,
  getDatasets,
  getDatasetFileDetails,
  createTrainingJob,
} = useApi();
const { t } = useI18n();

const algorithms = ref<TrainingAlgorithm[]>([]);
const datasets = ref<DatasetOption[]>([]);
const loadingPickers = ref(false);
const submitting = ref(false);

const form = ref({
  algorithm_id: '',
  dataset_id: '',
  output_name: '',
  target_column: '',
  workers: 1,
  gpus: 0,
});

/** Hyperparameter values keyed by name; reset from the spec on algorithm change. */
const hyperparams = ref<Record<string, unknown>>({});

// The dataset list carries no file name, so the uploaded file's extension is
// checked against the algorithm's `file_extensions` when a dataset is picked.
// '' = accepted; otherwise the hint shown under the picker (and submit is blocked).
const datasetFileIssue = ref('');
const checkingDataset = ref(false);
const datasetFileName = ref('');
// Monotonic token: a quick dataset switch must not let an earlier file
// lookup land on the later selection. Declared here, before the immediate
// `open` watcher below runs `resetForm()` (which bumps it) on a closed mount.
let datasetCheckId = 0;

const selectedAlgorithm = computed(
  () => algorithms.value.find((a) => a.id === form.value.algorithm_id) ?? null,
);

/** Datasets the selected algorithm accepts (type + source rules from the catalog). */
const compatibleDatasets = computed(() => {
  const spec = selectedAlgorithm.value;
  if (!spec) return datasets.value;
  const req = spec.dataset_requirements;
  return datasets.value.filter(
    (d) =>
      req.dataset_types.includes(Number(d.train_and_inference_type)) &&
      req.data_source_types.includes(Number(d.data_source_type ?? 0)),
  );
});

const defaultsFor = (spec: TrainingAlgorithm): Record<string, unknown> =>
  Object.fromEntries(spec.hyperparams.map((h) => [h.name, h.default]));

// Coerce-then-validate one knob against its spec. The Input wrapper emits raw
// strings, so numbers are parsed here; the bounds mirror the backend's.
const knobValid = (spec: TrainingHyperparamSpec, value: unknown): boolean => {
  if (value === '' || value === null || value === undefined) {
    return !spec.required;
  }
  if (spec.type === 'int' || spec.type === 'float') {
    const n = Number(value);
    if (!Number.isFinite(n)) return false;
    if (spec.type === 'int' && !Number.isInteger(n)) return false;
    if (spec.min !== null && spec.min !== undefined && n < spec.min)
      return false;
    if (spec.max !== null && spec.max !== undefined && n > spec.max)
      return false;
    return true;
  }
  if (spec.type === 'enum') {
    return !spec.choices || spec.choices.includes(String(value));
  }
  return true;
};

const firstInvalidKnob = computed(() => {
  const spec = selectedAlgorithm.value;
  if (!spec) return null;
  return (
    spec.hyperparams.find((h) => !knobValid(h, hyperparams.value[h.name])) ??
    null
  );
});

const workersValid = computed(() => {
  const n = Number(form.value.workers);
  return Number.isInteger(n) && n >= 1 && n <= 8;
});
const gpusValid = computed(() => {
  const n = Number(form.value.gpus);
  return Number.isInteger(n) && n >= 0 && n <= 4;
});

const canSubmit = computed(
  () =>
    !!selectedAlgorithm.value &&
    !!form.value.dataset_id &&
    !checkingDataset.value &&
    datasetFileIssue.value === '' &&
    form.value.output_name.trim().length > 0 &&
    form.value.target_column.trim().length > 0 &&
    firstInvalidKnob.value === null &&
    workersValid.value &&
    gpusValid.value,
);

// Names the first unmet requirement, in `canSubmit`'s order. Empty == ready.
const validationHint = computed(() => {
  if (!selectedAlgorithm.value) return t('hint.training_job_select_algorithm');
  if (!form.value.dataset_id) return t('hint.training_job_select_dataset');
  if (checkingDataset.value) return t('hint.training_job_dataset_checking');
  if (datasetFileIssue.value) return datasetFileIssue.value;
  if (form.value.output_name.trim().length === 0)
    return t('hint.training_job_enter_name');
  if (form.value.target_column.trim().length === 0)
    return t('hint.training_job_enter_target');
  if (firstInvalidKnob.value)
    return t('hint.training_job_hyperparam_invalid', {
      name: firstInvalidKnob.value.name,
    });
  if (!workersValid.value) return t('hint.training_job_workers');
  if (!gpusValid.value) return t('hint.training_job_gpus');
  return '';
});

const handleOpenChange = (value: boolean) => {
  if (!value && submitting.value) return;
  emit('update:open', value);
};

// Monotonic token so a rapid close/reopen cannot let a stale picker load
// overwrite newer state (same guard as FineTuneCreate).
let pickersLoadId = 0;

const loadPickers = async () => {
  const loadId = ++pickersLoadId;
  loadingPickers.value = true;
  try {
    const [algorithmsRes, datasetsRes] = await Promise.all([
      getTrainingAlgorithms(),
      getDatasets({ limit: 200 }),
    ]);
    if (loadId !== pickersLoadId) return;
    algorithms.value = (algorithmsRes?.data || []) as TrainingAlgorithm[];
    datasets.value = (datasetsRes?.data || []) as DatasetOption[];
  } catch (err) {
    if (loadId !== pickersLoadId) return;
    console.error('Failed to load training-job pickers', err);
  } finally {
    if (loadId === pickersLoadId) loadingPickers.value = false;
  }
};

/** Serialise the form's knobs with the types the backend expects. */
const buildHyperparams = (spec: TrainingAlgorithm): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const h of spec.hyperparams) {
    const raw = hyperparams.value[h.name];
    if (raw === '' || raw === null || raw === undefined) continue;
    if (h.type === 'int' || h.type === 'float') out[h.name] = Number(raw);
    else if (h.type === 'bool') out[h.name] = raw === true || raw === 'true';
    else out[h.name] = String(raw);
  }
  return out;
};

const handleSubmit = async () => {
  const spec = selectedAlgorithm.value;
  if (!canSubmit.value || submitting.value || !spec) return;
  submitting.value = true;
  try {
    const resp = await createTrainingJob({
      algorithm_id: spec.id,
      dataset_id: form.value.dataset_id,
      output_name: form.value.output_name.trim(),
      target_column: form.value.target_column.trim(),
      hyperparams: buildHyperparams(spec),
      workers: Number(form.value.workers),
      gpus: Number(form.value.gpus),
    });
    const data = resp?.data as TrainingJob | undefined;
    if (data?.id) {
      emit('created', data);
      emit('update:open', false);
    } else if (resp) {
      console.warn('Training-job response missing id', resp);
    }
  } catch (err) {
    console.error('Training-job submission failed', err);
  } finally {
    submitting.value = false;
  }
};

const resetForm = () => {
  form.value = {
    algorithm_id: '',
    dataset_id: '',
    output_name: '',
    target_column: '',
    workers: 1,
    gpus: 0,
  };
  hyperparams.value = {};
  datasetCheckId += 1;
  datasetFileIssue.value = '';
  datasetFileName.value = '';
  checkingDataset.value = false;
};

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      loadPickers();
    } else {
      pickersLoadId += 1;
      algorithms.value = [];
      datasets.value = [];
      loadingPickers.value = false;
      resetForm();
    }
  },
  { immediate: true },
);

// A new algorithm brings its own knobs and dataset rules: reset the knobs to
// the catalog defaults, drop a dataset the new algorithm cannot use, and
// clear resource settings the new algorithm does not support (the inputs
// are disabled, so a stale value could not be corrected by the user).
watch(selectedAlgorithm, (spec) => {
  hyperparams.value = spec ? defaultsFor(spec) : {};
  if (
    form.value.dataset_id &&
    !compatibleDatasets.value.some((d) => d.id === form.value.dataset_id)
  ) {
    form.value.dataset_id = '';
  }
  if (spec && spec.supports_distributed === false) form.value.workers = 1;
  if (spec && spec.supports_gpu === false) form.value.gpus = 0;
  // The accepted extensions may differ per algorithm: re-check the file.
  void checkDatasetFile(form.value.dataset_id);
});

const checkDatasetFile = async (datasetId: string) => {
  const checkId = ++datasetCheckId;
  datasetFileIssue.value = '';
  datasetFileName.value = '';
  const spec = selectedAlgorithm.value;
  if (!datasetId || !spec) {
    checkingDataset.value = false;
    return;
  }
  checkingDataset.value = true;
  try {
    const res = await getDatasetFileDetails(datasetId);
    if (checkId !== datasetCheckId) return;
    const details = (res?.data ?? null) as
      | { file_name?: string }
      | Array<{ file_name?: string }>
      | null;
    const first = Array.isArray(details) ? details[0] : details;
    const fileName = first?.file_name ?? '';
    datasetFileName.value = fileName;
    if (!fileName) {
      datasetFileIssue.value = t('hint.training_job_dataset_file_unknown');
      return;
    }
    const allowed = spec.dataset_requirements.file_extensions.map((e) =>
      e.toLowerCase(),
    );
    const ok = allowed.some((ext) => fileName.toLowerCase().endsWith(ext));
    datasetFileIssue.value = ok
      ? ''
      : t('hint.training_job_dataset_file_type', {
          name: fileName,
          types: allowed.join(', '),
        });
  } catch (err) {
    if (checkId !== datasetCheckId) return;
    console.error('Failed to read dataset file details', err);
    datasetFileIssue.value = t('hint.training_job_dataset_file_unknown');
  } finally {
    if (checkId === datasetCheckId) checkingDataset.value = false;
  }
};

watch(
  () => form.value.dataset_id,
  (datasetId) => {
    void checkDatasetFile(datasetId);
  },
);

const inputStep = (h: TrainingHyperparamSpec) =>
  h.type === 'int' ? '1' : 'any';
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-[680px] p-0 gap-0">
      <div class="px-6 pt-6 pb-4">
        <DialogHeader>
          <DialogTitle>{{ t('title.training_job_create') }}</DialogTitle>
          <DialogDescription>
            {{ t('description.training_job_dialog') }}
          </DialogDescription>
        </DialogHeader>
      </div>

      <div class="px-6 pb-4 space-y-4 max-h-[70vh] overflow-y-auto">
        <!-- Algorithm picker (catalog). -->
        <div class="space-y-2">
          <Label for="tj-algorithm">{{ t('label.algorithm') }}</Label>
          <Select v-model="form.algorithm_id">
            <SelectTrigger id="tj-algorithm" class="w-full">
              <SelectValue :placeholder="t('placeholder.select_algorithm')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="a in algorithms" :key="a.id" :value="a.id">
                {{ a.name }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p
            v-if="!loadingPickers && algorithms.length === 0"
            class="text-sm text-muted-foreground"
          >
            {{ t('hint.training_job_no_algorithms') }}
          </p>
          <p
            v-if="selectedAlgorithm"
            data-testid="algorithm-summary"
            class="text-sm text-muted-foreground"
          >
            <span class="font-medium">{{ t('label.framework') }}:</span>
            {{ selectedAlgorithm.framework }} ·
            <span class="font-medium">{{ t('label.task') }}:</span>
            {{ selectedAlgorithm.task }} — {{ selectedAlgorithm.description }}
          </p>
        </div>

        <!-- Dataset picker, narrowed to what the algorithm accepts. -->
        <div class="space-y-2">
          <Label for="tj-dataset">{{ t('label.training_dataset') }}</Label>
          <Select v-model="form.dataset_id">
            <SelectTrigger id="tj-dataset" class="w-full">
              <SelectValue
                :placeholder="t('placeholder.select_training_dataset')"
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="d in compatibleDatasets"
                :key="d.id"
                :value="d.id"
              >
                {{ d.dataset_name || d.name }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p
            v-if="!loadingPickers && compatibleDatasets.length === 0"
            class="text-sm text-muted-foreground"
          >
            {{ t('hint.training_job_no_dataset') }}
          </p>
          <p
            v-else-if="selectedAlgorithm?.dataset_requirements.description"
            class="text-sm text-muted-foreground"
          >
            {{ selectedAlgorithm.dataset_requirements.description }}
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-2">
            <Label for="tj-output-name">{{
              t('label.output_model_name')
            }}</Label>
            <Input
              id="tj-output-name"
              v-model="form.output_name"
              :placeholder="t('placeholder.output_model_name')"
            />
          </div>
          <div class="space-y-2">
            <Label for="tj-target-column">{{ t('label.target_column') }}</Label>
            <Input
              id="tj-target-column"
              v-model="form.target_column"
              :placeholder="t('placeholder.target_column')"
            />
          </div>
        </div>

        <!-- Hyperparameters, one field per catalog spec entry. -->
        <div v-if="selectedAlgorithm">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium">{{
              t('label.hyperparams')
            }}</span>
            <Spinner v-if="loadingPickers" class="size-3" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div
              v-for="h in selectedAlgorithm.hyperparams"
              :key="h.name"
              class="space-y-1"
              :data-testid="`hyperparam-${h.name}`"
            >
              <Label :for="`tj-hp-${h.name}`" class="text-xs">
                {{ h.name }}
              </Label>
              <Select
                v-if="h.type === 'enum'"
                v-model="hyperparams[h.name] as string"
              >
                <SelectTrigger :id="`tj-hp-${h.name}`" class="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="choice in h.choices || []"
                    :key="choice"
                    :value="choice"
                  >
                    {{ choice }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select
                v-else-if="h.type === 'bool'"
                :model-value="String(hyperparams[h.name] ?? false)"
                @update:model-value="
                  (v) => (hyperparams[h.name] = v === 'true')
                "
              >
                <SelectTrigger :id="`tj-hp-${h.name}`" class="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">true</SelectItem>
                  <SelectItem value="false">false</SelectItem>
                </SelectContent>
              </Select>
              <Input
                v-else
                :id="`tj-hp-${h.name}`"
                v-model="hyperparams[h.name] as string | number"
                :type="h.type === 'str' ? 'text' : 'number'"
                :step="h.type === 'str' ? undefined : inputStep(h)"
                :min="h.min ?? undefined"
                :max="h.max ?? undefined"
              />
              <p v-if="h.description" class="text-[11px] text-muted-foreground">
                {{ h.description }}
              </p>
            </div>
          </div>
        </div>

        <!-- Resource shape. -->
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1">
            <Label for="tj-workers" class="text-xs">{{
              t('label.workers')
            }}</Label>
            <Input
              id="tj-workers"
              v-model="form.workers"
              type="number"
              min="1"
              max="8"
              step="1"
              :disabled="selectedAlgorithm?.supports_distributed === false"
            />
            <p class="text-[11px] text-muted-foreground">
              {{ t('hint.training_job_workers') }}
            </p>
          </div>
          <div class="space-y-1">
            <Label for="tj-gpus" class="text-xs">{{ t('label.gpus') }}</Label>
            <Input
              id="tj-gpus"
              v-model="form.gpus"
              type="number"
              min="0"
              max="4"
              step="1"
              :disabled="selectedAlgorithm?.supports_gpu === false"
            />
            <p class="text-[11px] text-muted-foreground">
              {{ t('hint.training_job_gpus') }}
            </p>
          </div>
        </div>
      </div>

      <p
        v-if="validationHint && !submitting"
        class="px-6 pb-2 text-sm text-muted-foreground"
      >
        {{ validationHint }}
      </p>

      <DialogFooter class="px-6 py-4 border-t">
        <Button
          variant="outline"
          :disabled="submitting"
          @click="handleOpenChange(false)"
        >
          {{ t('action.cancel') }}
        </Button>
        <Button
          data-testid="launch-training-job"
          :disabled="!canSubmit || submitting"
          @click="handleSubmit"
        >
          <Spinner v-if="submitting" class="size-3 mr-2" />
          {{ t('action.launch_training_job') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
