<script setup lang="ts">
/**
 * Fine-tune launch dialog.
 *
 * Submits `POST /cogapi/models/fine-tune` against the existing
 * `FineTuneRequest` schema. Phase 1 supports the NTK method with LoRA
 * export only; the resulting `model_info(type='lora')` row appears in
 * the existing LoRA picker once the kfp run completes.
 *
 * Hyperparam knobs are filled by `POST /cogapi/fine-tune/recommend`
 * when a base model is selected: the recommended gates/max_log_gate/
 * train_steps overwrite the current form values. The response also
 * carries a `rationale` block (pinned vs default per knob); Phase 1
 * does not surface it yet.
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

interface ModelOption {
  id: string;
  name: string;
  type?: string;
  hf_model_id?: string | null;
}

interface DatasetOption {
  id: string;
  dataset_name?: string;
  name?: string;
  train_and_inference_type?: number;
}

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'created', payload: { model_id: string; run_id?: string | null }): void;
}>();

const { getModels, getDatasets, createFineTune, recommendFineTune } = useApi();
const toaster = useToaster();

// `5` == DatasetTypeEnum.JSONL on the backend; only JSONL is accepted
// for NTK fine-tune (matches ntkmirror's load_jsonl_examples).
const JSONL_DATASET_TYPE = 5;

const baseModels = ref<ModelOption[]>([]);
const datasets = ref<DatasetOption[]>([]);
const loadingPickers = ref(false);

const form = ref({
  base_model_id: '',
  dataset_id: '',
  output_name: '',
  gates: 5000,
  max_log_gate: 0.05,
  train_steps: 240,
  lr: 0.005,
});

const submitting = ref(false);
const recommending = ref(false);

const canSubmit = computed(
  () =>
    !!form.value.base_model_id &&
    !!form.value.dataset_id &&
    form.value.output_name.trim().length > 0 &&
    form.value.gates >= 1 &&
    // Bounds mirror the input min/max + the backend (max_log_gate le=1.0).
    form.value.max_log_gate >= 0.001 &&
    form.value.max_log_gate <= 1 &&
    form.value.train_steps >= 1 &&
    form.value.lr >= 0.0001,
);

const handleOpenChange = (value: boolean) => {
  emit('update:open', value);
};

// Monotonic token: a rapid close/reopen can fire loadPickers() again while a
// previous request is still in flight. Only the latest invocation may apply
// results or clear the loading flag, so a slow earlier response can't clobber
// newer state.
let pickersLoadId = 0;

const loadPickers = async () => {
  const loadId = ++pickersLoadId;
  loadingPickers.value = true;
  try {
    const [modelsRes, datasetsRes] = await Promise.all([
      // getModels has no type filter — fetch a page and narrow client-side
      // to LLM rows that also carry an hf_model_id (the kfp component needs it).
      getModels({ limit: 200 }),
      getDatasets({ limit: 200 }),
    ]);
    // A newer load started while this one was in flight — drop this result.
    if (loadId !== pickersLoadId) return;
    // The shared request() helper catches HTTP/network errors and returns
    // null instead of throwing, so a null response (not just a thrown error)
    // is how a failed load surfaces here.
    if (!modelsRes || !datasetsRes) {
      toaster.show('error', 'fine_tune_load_failed');
    }
    const modelRows: ModelOption[] = (modelsRes?.data || []) as ModelOption[];
    baseModels.value = modelRows.filter(
      (m) => m.type === 'llm' && !!m.hf_model_id,
    );

    const dsRows: DatasetOption[] = (datasetsRes?.data ||
      []) as DatasetOption[];
    datasets.value = dsRows.filter(
      (d) => d.train_and_inference_type === JSONL_DATASET_TYPE,
    );
  } catch (err) {
    if (loadId !== pickersLoadId) return;
    console.error('Failed to load fine-tune pickers', err);
    toaster.show('error', 'fine_tune_load_failed');
  } finally {
    // Only the most recent load owns the loading flag.
    if (loadId === pickersLoadId) loadingPickers.value = false;
  }
};

// Re-fill hyperparams from the recommender whenever the base model changes.
// Phase 1 keeps it simple: the recommended gates/max_log_gate/train_steps
// always overwrite the current form values (so switching base model surfaces
// that model's recommended knobs). The recommender response also flags each
// knob in `rationale.<knob>` as 'pinned'/'default' for future surfacing.
const fillFromRecommender = async () => {
  if (!form.value.base_model_id) return;
  const selected = baseModels.value.find(
    (m) => m.id === form.value.base_model_id,
  );
  if (!selected || !selected.hf_model_id) return;

  recommending.value = true;
  try {
    const resp = await recommendFineTune({
      hf_model_id: selected.hf_model_id,
      method: 'ntk',
    });
    // Guard against a stale response: if the user switched base model while
    // this request was in flight, drop it so it can't overwrite the newer
    // model's knobs.
    if (form.value.base_model_id !== selected.id) return;
    const rec = resp?.data;
    if (rec) {
      form.value.gates = rec.gates ?? form.value.gates;
      form.value.max_log_gate = rec.max_log_gate ?? form.value.max_log_gate;
      form.value.train_steps = rec.train_steps ?? form.value.train_steps;
    }
  } catch (err) {
    // Recommender failure isn't blocking — the form's static defaults
    // are already ntkmirror's library defaults.
    console.warn('Recommender fill failed, using defaults', err);
  } finally {
    recommending.value = false;
  }
};

const handleSubmit = async () => {
  if (!canSubmit.value || submitting.value) return;
  submitting.value = true;
  try {
    const resp = await createFineTune({
      base_model_id: form.value.base_model_id,
      dataset_id: form.value.dataset_id,
      output_name: form.value.output_name.trim(),
      method: 'ntk',
      export: 'lora',
      hyperparams: {
        gates: form.value.gates,
        max_log_gate: form.value.max_log_gate,
        train_steps: form.value.train_steps,
        lr: form.value.lr,
      },
    });
    const data = resp?.data;
    if (data?.model_id) {
      emit('created', { model_id: data.model_id, run_id: data.run_id });
      // Closing resets the form via the `open` watcher — single source of truth.
      emit('update:open', false);
    }
  } catch (err) {
    console.error('Fine-tune submission failed', err);
  } finally {
    submitting.value = false;
  }
};

const resetForm = () => {
  form.value = {
    base_model_id: '',
    dataset_id: '',
    output_name: '',
    gates: 5000,
    max_log_gate: 0.05,
    train_steps: 240,
    lr: 0.005,
  };
};

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      loadPickers();
    } else {
      // Clear stale selections on close (Cancel / outside-click / Escape /
      // parent-driven) so a reopen doesn't keep base/dataset IDs that may no
      // longer exist in the freshly loaded options — and can't submit them.
      resetForm();
    }
  },
  // ``immediate`` so an already-open dialog (mounted with ``open=true``)
  // loads pickers on first render rather than waiting for the next
  // toggle. Matters for tests and for any caller that conditionally
  // renders the dialog with ``v-if`` based on its own state.
  { immediate: true },
);

watch(() => form.value.base_model_id, fillFromRecommender);
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-[640px] p-0 gap-0">
      <div class="px-6 pt-6 pb-4">
        <DialogHeader>
          <DialogTitle>Fine-tune an LLM</DialogTitle>
          <DialogDescription>
            Train an ntkmirror controller over a JSONL dataset; the result is
            exported as a standard LoRA adapter and appears in the existing
            model-serving picker once the run completes.
          </DialogDescription>
        </DialogHeader>
      </div>

      <div class="px-6 pb-4 space-y-4">
        <!-- Base model picker (LLM rows with hf_model_id only). -->
        <div class="space-y-2">
          <Label for="ft-base-model">Base LLM</Label>
          <Select v-model="form.base_model_id">
            <SelectTrigger id="ft-base-model" class="w-full">
              <SelectValue placeholder="Select an LLM..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="m in baseModels" :key="m.id" :value="m.id">
                {{ m.name }} ({{ m.hf_model_id }})
              </SelectItem>
            </SelectContent>
          </Select>
          <p
            v-if="!loadingPickers && baseModels.length === 0"
            class="text-sm text-muted-foreground"
          >
            No LLM rows with a Hugging Face ID were found. Register an LLM with
            hf_model_id first.
          </p>
        </div>

        <!-- Dataset picker (JSONL only, per backend FineTuneRequest). -->
        <div class="space-y-2">
          <Label for="ft-dataset">JSONL dataset</Label>
          <Select v-model="form.dataset_id">
            <SelectTrigger id="ft-dataset" class="w-full">
              <SelectValue placeholder="Select a JSONL dataset..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="d in datasets" :key="d.id" :value="d.id">
                {{ d.dataset_name || d.name }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p
            v-if="!loadingPickers && datasets.length === 0"
            class="text-sm text-muted-foreground"
          >
            No JSONL datasets registered yet. Upload one via the datasets page
            (type JSONL).
          </p>
        </div>

        <div class="space-y-2">
          <Label for="ft-output-name">Output adapter name</Label>
          <Input
            id="ft-output-name"
            v-model="form.output_name"
            placeholder="e.g. qwen-math-lora-v1"
          />
        </div>

        <!-- Hyperparams; pre-filled from the recommender when a base
             model is selected. User edits override on submit. -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium">Training knobs</span>
            <Spinner v-if="recommending" class="size-3" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <Label for="ft-gates" class="text-xs">Gates</Label>
              <Input
                id="ft-gates"
                v-model.number="form.gates"
                type="number"
                min="1"
              />
            </div>
            <div class="space-y-1">
              <Label for="ft-max-log-gate" class="text-xs">
                Max log gate
              </Label>
              <Input
                id="ft-max-log-gate"
                v-model.number="form.max_log_gate"
                type="number"
                step="0.01"
                min="0.001"
                max="1"
              />
            </div>
            <div class="space-y-1">
              <Label for="ft-train-steps" class="text-xs">Steps</Label>
              <Input
                id="ft-train-steps"
                v-model.number="form.train_steps"
                type="number"
                min="1"
              />
            </div>
            <div class="space-y-1">
              <Label for="ft-lr" class="text-xs">Learning rate</Label>
              <Input
                id="ft-lr"
                v-model.number="form.lr"
                type="number"
                step="0.0001"
                min="0.0001"
              />
            </div>
          </div>
        </div>
      </div>

      <DialogFooter class="px-6 py-4 border-t">
        <Button variant="outline" @click="handleOpenChange(false)">
          Cancel
        </Button>
        <Button :disabled="!canSubmit || submitting" @click="handleSubmit">
          <Spinner v-if="submitting" class="size-3 mr-2" />
          Launch fine-tune
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
