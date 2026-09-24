<script setup lang="ts">
/**
 * Fine-tune launch dialog.
 *
 * Submits `POST /cogapi/models/fine-tune` against the existing
 * `FineTuneRequest` schema. Two methods are offered:
 *
 * - `ntk` (default): trains an NTK controller (a few thousand gate scalars
 *   on a frozen base). The user picks the export: `ntk_model` keeps the
 *   raw controller as a `model_info(type='ntk_controller')` row that the
 *   serving dialog attaches exactly via `llm_adapter`, while `lora`
 *   converts it to a PEFT adapter (`model_info(type='lora')`) for the
 *   stock vLLM LoRA path.
 * - `lora`: standard PEFT LoRA training (low-rank matrices on every linear
 *   layer). The export is always `lora` (the backend rejects `ntk_model`),
 *   gates/max_log_gate are ignored, and `lora_rank`/`lora_alpha` apply.
 *
 * Either output row appears in the serving dialog's adapter picker once
 * the run completes.
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

/** Backend `FineTuneRequest.method` values. */
type FineTuneMethod = 'ntk' | 'lora';

/** Backend `FineTuneRequest.export` values. */
type FineTuneExport = 'ntk_model' | 'lora';

/** Method picker rows; `labelKey` resolves under `label.*`. */
const METHOD_OPTIONS: Array<{ value: FineTuneMethod; labelKey: string }> = [
  { value: 'ntk', labelKey: 'label.method_ntk' },
  { value: 'lora', labelKey: 'label.method_lora' },
];

// Per-method learning-rate default. Applied on method switch unless the
// user has already edited the field (see `lrTouched`).
const DEFAULT_LR: Record<FineTuneMethod, number> = {
  ntk: 0.005,
  lora: 0.0002,
};

/** Export picker rows; `labelKey` resolves under `label.*`. */
const EXPORT_OPTIONS: Array<{ value: FineTuneExport; labelKey: string }> = [
  { value: 'ntk_model', labelKey: 'label.export_ntk_model' },
  { value: 'lora', labelKey: 'label.export_lora' },
];

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'created', payload: { model_id: string; run_id?: string | null }): void;
}>();

const { getModels, getDatasets, createFineTune, recommendFineTune } = useApi();
const { t } = useI18n();

// `5` == DatasetTypeEnum.JSONL on the backend; only JSONL is accepted
// for NTK fine-tune (matches ntkmirror's load_jsonl_examples).
const JSONL_DATASET_TYPE = 5;

const baseModels = ref<ModelOption[]>([]);
const datasets = ref<DatasetOption[]>([]);
const loadingPickers = ref(false);

const form = ref({
  base_model_id: '',
  dataset_id: '',
  // Optional held-out JSONL dataset; the backend evaluates the exported
  // adapter against it and logs the metrics on the MLflow run.
  eval_dataset_id: '',
  output_name: '',
  // Training recipe: NTK controller (default) or standard PEFT LoRA.
  method: 'ntk' as FineTuneMethod,
  // What the run registers: the exact NTK controller (default) or a LoRA
  // approximation of it. Only meaningful for `method: 'ntk'`; the LoRA
  // method always exports `lora`.
  export: 'ntk_model' as FineTuneExport,
  gates: 5000,
  max_log_gate: 0.05,
  train_steps: 240,
  lr: DEFAULT_LR.ntk,
  // LoRA-only knobs (PEFT defaults).
  lora_rank: 8,
  lora_alpha: 16,
});

const submitting = ref(false);
const recommending = ref(false);

// True once the user has typed into the learning-rate field. A method switch
// only overwrites `lr` with that method's default while this is false, so an
// explicit user value survives toggling NTK <-> LoRA.
const lrTouched = ref(false);

const isLora = computed(() => form.value.method === 'lora');

// The eval picker offers the same JSONL rows as the training picker, minus
// the one currently chosen for training — evaluating on the training set
// would only measure memorisation.
const evalDatasets = computed(() =>
  datasets.value.filter((d) => d.id !== form.value.dataset_id),
);

// Sentinel for the eval picker's "none" row: reka-ui's Select cannot select
// an empty-string item, so a real value stands in and maps to '' on submit.
const NO_EVAL_DATASET = '__none__';

// Coerce-then-validate a knob. The custom Input wrapper emits raw strings
// (it doesn't implement modelModifiers, so `v-model.number` would be a no-op),
// and a pasted '1e999' becomes Infinity once coerced (which JSON.stringify
// would emit as `null` on submit). Number() +
// Number.isFinite() rejects empty/NaN/Infinity/string and an out-of-range
// value in one shot; the bounds mirror each input's min/max and the backend
// (max_log_gate & lr le=1.0). `gates`/`train_steps` have no semantic upper
// bound, so the backend stays authoritative for those.
const isValidKnob = (value: unknown, min: number, max = Infinity) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max;
};

// LoRA rank/alpha must be positive integers (the backend types them as int).
const isValidIntKnob = (value: unknown, min: number) =>
  isValidKnob(value, min) && Number.isInteger(Number(value));

// Only the knobs shown for the current method gate submit: gates/max_log_gate
// are hidden (and ignored by the backend) under LoRA, rank/alpha under NTK.
const canSubmit = computed(
  () =>
    !!form.value.base_model_id &&
    !!form.value.dataset_id &&
    form.value.output_name.trim().length > 0 &&
    (isLora.value ||
      (isValidKnob(form.value.gates, 1) &&
        isValidKnob(form.value.max_log_gate, 0.001, 1))) &&
    isValidKnob(form.value.train_steps, 1) &&
    isValidKnob(form.value.lr, 0.0001, 1) &&
    (!isLora.value ||
      (isValidIntKnob(form.value.lora_rank, 1) &&
        isValidIntKnob(form.value.lora_alpha, 1))),
);

// Surface *why* "Launch" is disabled: name the first unmet requirement so the
// user isn't left guessing at a greyed-out button. Mirrors `canSubmit`'s order
// and reuses `isValidKnob`, so the two can't drift. Empty string == ready.
const validationHint = computed(() => {
  if (!form.value.base_model_id) return t('hint.fine_tune_select_base');
  if (!form.value.dataset_id) return t('hint.fine_tune_select_dataset');
  if (form.value.output_name.trim().length === 0)
    return t('hint.fine_tune_enter_name');
  if (!isLora.value) {
    if (!isValidKnob(form.value.gates, 1))
      return t('hint.fine_tune_gates_range');
    if (!isValidKnob(form.value.max_log_gate, 0.001, 1))
      return t('hint.fine_tune_max_log_gate_range');
  }
  if (!isValidKnob(form.value.train_steps, 1))
    return t('hint.fine_tune_steps_range');
  if (!isValidKnob(form.value.lr, 0.0001, 1))
    return t('hint.fine_tune_lr_range');
  if (isLora.value) {
    if (!isValidIntKnob(form.value.lora_rank, 1))
      return t('hint.fine_tune_lora_rank_range');
    if (!isValidIntKnob(form.value.lora_alpha, 1))
      return t('hint.fine_tune_lora_alpha_range');
  }
  return '';
});

const handleOpenChange = (value: boolean) => {
  // Don't let outside-click / Escape / Cancel close the dialog mid-submit
  // (matches ServeModelDialog) — a late success would otherwise re-close or
  // navigate away confusingly.
  if (!value && submitting.value) return;
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
    // request() already surfaces its own error toast on HTTP/network failure
    // (it returns null rather than throwing, and toasts connection_error/
    // server_error unconditionally), so we don't add a second one here. A
    // failed/empty load just narrows to empty pickers, which render their own
    // "register an LLM / upload a dataset" hints.
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
  } finally {
    // Only the most recent load owns the loading flag.
    if (loadId === pickersLoadId) loadingPickers.value = false;
  }
};

// Monotonic token mirroring `pickersLoadId`: a rapid base-model switch can
// leave an earlier recommend() in flight. Only the latest call may apply
// results or own the `recommending` spinner — so a slow earlier response
// can't overwrite the newer model's knobs, nor clear the spinner while the
// current request is still loading.
let recommendId = 0;

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

  const loadId = ++recommendId;
  recommending.value = true;
  try {
    const resp = await recommendFineTune({
      hf_model_id: selected.hf_model_id,
      method: 'ntk',
    });
    // A newer recommend (model switch or close) started while this one was in
    // flight — drop it so it can't overwrite the newer model's knobs.
    if (loadId !== recommendId) return;
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
    // Only the most recent recommend owns the spinner flag.
    if (loadId === recommendId) recommending.value = false;
  }
};

// Coerce a stale, hidden NTK knob to a number the schema accepts. Blank
// strings (Number('') === 0), NaN, Infinity and non-positive values all fall
// back: the backend requires gates >= 1 and max_log_gate > 0.
const positiveOr = (value: unknown, fallback: number) => {
  if (typeof value === 'string' && value.trim() === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const handleSubmit = async () => {
  if (!canSubmit.value || submitting.value) return;
  submitting.value = true;
  try {
    const lora = isLora.value;
    const evalDatasetId =
      form.value.eval_dataset_id &&
      form.value.eval_dataset_id !== NO_EVAL_DATASET
        ? form.value.eval_dataset_id
        : '';
    const resp = await createFineTune({
      base_model_id: form.value.base_model_id,
      dataset_id: form.value.dataset_id,
      // Omit the key entirely when no eval set was picked: the backend treats
      // `eval_dataset_id` as optional and must not receive an empty string.
      ...(evalDatasetId ? { eval_dataset_id: evalDatasetId } : {}),
      output_name: form.value.output_name.trim(),
      method: form.value.method,
      // The LoRA method only ever produces a PEFT adapter; the backend
      // rejects `ntk_model` there, so the export picker is hidden and the
      // value forced.
      export: lora ? 'lora' : form.value.export,
      // Coerce to numbers: the custom Input wrapper emits raw strings, so an
      // edited field can hold a string. Guarantee a numeric payload (and
      // avoid tripping strict backend validation).
      hyperparams: {
        // Under LoRA these two are hidden, unvalidated and ignored by the
        // backend, but the schema still wants numbers — fall back to the
        // static defaults if a stale NTK edit left them non-finite.
        gates: lora
          ? positiveOr(form.value.gates, 5000)
          : Number(form.value.gates),
        max_log_gate: lora
          ? positiveOr(form.value.max_log_gate, 0.05)
          : Number(form.value.max_log_gate),
        train_steps: Number(form.value.train_steps),
        lr: Number(form.value.lr),
        ...(lora
          ? {
              lora_rank: Number(form.value.lora_rank),
              lora_alpha: Number(form.value.lora_alpha),
            }
          : {}),
      },
    });
    const data = resp?.data;
    if (data?.model_id) {
      emit('created', { model_id: data.model_id, run_id: data.run_id });
      // Closing resets the form via the `open` watcher — single source of truth.
      emit('update:open', false);
    } else if (resp) {
      // A 2xx without `model_id` shouldn't happen — the backend always reserves
      // one. If it ever does, the API layer has already fired the success
      // toast, so don't emit `created`/close on an incomplete response; keep
      // the dialog open and leave a breadcrumb for diagnosis. (A genuine
      // HTTP/network error returns `resp === null`, already toasted upstream.)
      console.warn('Fine-tune response missing model_id', resp);
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
    eval_dataset_id: '',
    output_name: '',
    method: 'ntk',
    export: 'ntk_model',
    gates: 5000,
    max_log_gate: 0.05,
    train_steps: 240,
    lr: DEFAULT_LR.ntk,
    lora_rank: 8,
    lora_alpha: 16,
  };
  lrTouched.value = false;
};

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      loadPickers();
    } else {
      // On close (Cancel / outside-click / Escape / parent-driven):
      // invalidate any in-flight picker load (so a late response can't apply
      // results or toast after close), clear the cached options/flag (so they
      // can't flash on the next open before the fresh reload), and clear the
      // form selections (so a reopen can't keep IDs absent from the reload).
      // Bump the recommend token too, so an in-flight recommend can't apply
      // its knobs onto the just-reset form after close.
      pickersLoadId += 1;
      recommendId += 1;
      baseModels.value = [];
      datasets.value = [];
      loadingPickers.value = false;
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

// Each method has its own sensible learning rate (NTK 0.005, LoRA 0.0002).
// Switching applies the new method's default unless the user has typed a
// value themselves, in which case their choice is kept.
watch(
  () => form.value.method,
  (method) => {
    if (!lrTouched.value) form.value.lr = DEFAULT_LR[method];
  },
);

// Picking the eval set as the training set (or vice versa) would silently
// hand the backend the same id twice — drop the eval choice instead.
watch(
  () => form.value.dataset_id,
  (trainingId) => {
    if (trainingId && form.value.eval_dataset_id === trainingId) {
      form.value.eval_dataset_id = '';
    }
  },
);
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-[640px] p-0 gap-0">
      <div class="px-6 pt-6 pb-4">
        <DialogHeader>
          <DialogTitle>{{ t('title.fine_tune') }}</DialogTitle>
          <DialogDescription>
            {{ t('description.fine_tune_dialog') }}
          </DialogDescription>
        </DialogHeader>
      </div>

      <div class="px-6 pb-4 space-y-4">
        <!-- Base model picker (LLM rows with hf_model_id only). The short
             id suffix disambiguates duplicate catalog names sharing one
             hf_model_id; SelectValue mirrors the item text, so the trigger
             shows the same suffix for the picked row. -->
        <div class="space-y-2">
          <Label for="ft-base-model">{{ t('label.base_llm') }}</Label>
          <Select v-model="form.base_model_id">
            <SelectTrigger id="ft-base-model" class="w-full">
              <SelectValue :placeholder="t('placeholder.select_llm')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="m in baseModels" :key="m.id" :value="m.id">
                {{ m.name }} ({{ m.hf_model_id }}) · {{ m.id.slice(0, 8) }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p
            v-if="!loadingPickers && baseModels.length === 0"
            class="text-sm text-muted-foreground"
          >
            {{ t('hint.fine_tune_no_llm') }}
          </p>
        </div>

        <!-- Dataset picker (JSONL only, per backend FineTuneRequest). -->
        <div class="space-y-2">
          <Label for="ft-dataset">{{ t('label.jsonl_dataset') }}</Label>
          <Select v-model="form.dataset_id">
            <SelectTrigger id="ft-dataset" class="w-full">
              <SelectValue
                :placeholder="t('placeholder.select_jsonl_dataset')"
              />
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
            {{ t('hint.fine_tune_no_dataset') }}
          </p>
        </div>

        <!-- Optional held-out eval dataset (JSONL, excludes the training set). -->
        <div class="space-y-2">
          <Label for="ft-eval-dataset">{{ t('label.eval_dataset') }}</Label>
          <Select v-model="form.eval_dataset_id">
            <SelectTrigger id="ft-eval-dataset" class="w-full">
              <SelectValue
                :placeholder="t('placeholder.select_eval_dataset')"
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-if="evalDatasets.length" :value="NO_EVAL_DATASET">
                {{ t('label.none') }}
              </SelectItem>
              <SelectItem v-for="d in evalDatasets" :key="d.id" :value="d.id">
                {{ d.dataset_name || d.name }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p class="text-sm text-muted-foreground">
            {{ t('hint.fine_tune_eval_dataset') }}
          </p>
        </div>

        <div class="space-y-2">
          <Label for="ft-output-name">{{
            t('label.output_adapter_name')
          }}</Label>
          <Input
            id="ft-output-name"
            v-model="form.output_name"
            :placeholder="t('placeholder.output_adapter_name')"
          />
        </div>

        <!-- Method: NTK controller (default) or standard PEFT LoRA. Drives
             which export/knob fields are shown below. -->
        <div class="space-y-2">
          <Label for="ft-method">{{ t('label.method') }}</Label>
          <Select v-model="form.method">
            <SelectTrigger id="ft-method" class="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="opt in METHOD_OPTIONS"
                :key="opt.value"
                :value="opt.value"
              >
                {{ t(opt.labelKey) }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p class="text-sm text-muted-foreground">
            {{ t('hint.fine_tune_method') }}
          </p>
        </div>

        <!-- Export (NTK only): both train the same NTK controller;
             `ntk_model` keeps it exact, `lora` converts the result to an
             approximate adapter. The LoRA method always exports `lora`, so
             the picker is hidden there. -->
        <div v-if="!isLora" class="space-y-2">
          <Label for="ft-export">{{ t('label.export') }}</Label>
          <Select v-model="form.export">
            <SelectTrigger id="ft-export" class="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="opt in EXPORT_OPTIONS"
                :key="opt.value"
                :value="opt.value"
              >
                {{ t(opt.labelKey) }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p class="text-sm text-muted-foreground">
            {{ t('hint.fine_tune_export') }}
          </p>
        </div>

        <!-- Hyperparams; pre-filled from the recommender when a base
             model is selected. User edits override on submit. -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium">{{
              t('label.training_knobs')
            }}</span>
            <Spinner v-if="recommending" class="size-3" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <!-- Gates / max log gate are NTK-only; the backend ignores them
                 for LoRA. -->
            <div v-if="!isLora" class="space-y-1">
              <Label for="ft-gates" class="text-xs">{{
                t('label.gates')
              }}</Label>
              <Input
                id="ft-gates"
                v-model="form.gates"
                type="number"
                min="1"
                step="1"
              />
            </div>
            <div v-if="!isLora" class="space-y-1">
              <Label for="ft-max-log-gate" class="text-xs">
                {{ t('label.max_log_gate') }}
              </Label>
              <Input
                id="ft-max-log-gate"
                v-model="form.max_log_gate"
                type="number"
                step="0.01"
                min="0.001"
                max="1"
              />
            </div>
            <div class="space-y-1">
              <Label for="ft-train-steps" class="text-xs">{{
                t('label.steps')
              }}</Label>
              <Input
                id="ft-train-steps"
                v-model="form.train_steps"
                type="number"
                min="1"
                step="1"
              />
            </div>
            <div class="space-y-1">
              <Label for="ft-lr" class="text-xs">{{
                t('label.learning_rate')
              }}</Label>
              <Input
                id="ft-lr"
                v-model="form.lr"
                type="number"
                step="0.0001"
                min="0.0001"
                max="1"
                @update:model-value="lrTouched = true"
              />
            </div>
            <!-- LoRA-only adapter shape (PEFT defaults r=8, alpha=16). -->
            <template v-if="isLora">
              <div class="space-y-1">
                <Label for="ft-lora-rank" class="text-xs">{{
                  t('label.lora_rank')
                }}</Label>
                <Input
                  id="ft-lora-rank"
                  v-model="form.lora_rank"
                  type="number"
                  min="1"
                  step="1"
                />
              </div>
              <div class="space-y-1">
                <Label for="ft-lora-alpha" class="text-xs">{{
                  t('label.lora_alpha')
                }}</Label>
                <Input
                  id="ft-lora-alpha"
                  v-model="form.lora_alpha"
                  type="number"
                  min="1"
                  step="1"
                />
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Tells the user which requirement is blocking submit, rather than
           leaving "Launch" greyed out with no explanation. -->
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
        <Button :disabled="!canSubmit || submitting" @click="handleSubmit">
          <Spinner v-if="submitting" class="size-3 mr-2" />
          {{ t('action.launch_fine_tune') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
