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
  output_name: '',
  gates: 5000,
  max_log_gate: 0.05,
  train_steps: 240,
  lr: 0.005,
});

const submitting = ref(false);
const recommending = ref(false);

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

const canSubmit = computed(
  () =>
    !!form.value.base_model_id &&
    !!form.value.dataset_id &&
    form.value.output_name.trim().length > 0 &&
    isValidKnob(form.value.gates, 1) &&
    isValidKnob(form.value.max_log_gate, 0.001, 1) &&
    isValidKnob(form.value.train_steps, 1) &&
    isValidKnob(form.value.lr, 0.0001, 1),
);

// Surface *why* "Launch" is disabled: name the first unmet requirement so the
// user isn't left guessing at a greyed-out button. Mirrors `canSubmit`'s order
// and reuses `isValidKnob`, so the two can't drift. Empty string == ready.
const validationHint = computed(() => {
  if (!form.value.base_model_id) return t('hint.fine_tune_select_base');
  if (!form.value.dataset_id) return t('hint.fine_tune_select_dataset');
  if (form.value.output_name.trim().length === 0)
    return t('hint.fine_tune_enter_name');
  if (!isValidKnob(form.value.gates, 1)) return t('hint.fine_tune_gates_range');
  if (!isValidKnob(form.value.max_log_gate, 0.001, 1))
    return t('hint.fine_tune_max_log_gate_range');
  if (!isValidKnob(form.value.train_steps, 1))
    return t('hint.fine_tune_steps_range');
  if (!isValidKnob(form.value.lr, 0.0001, 1))
    return t('hint.fine_tune_lr_range');
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
      // Coerce to numbers: the custom Input wrapper emits raw strings, so an
      // edited field can hold a string. Guarantee a numeric payload (and
      // avoid tripping strict backend validation).
      hyperparams: {
        gates: Number(form.value.gates),
        max_log_gate: Number(form.value.max_log_gate),
        train_steps: Number(form.value.train_steps),
        lr: Number(form.value.lr),
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
        <!-- Base model picker (LLM rows with hf_model_id only). -->
        <div class="space-y-2">
          <Label for="ft-base-model">{{ t('label.base_llm') }}</Label>
          <Select v-model="form.base_model_id">
            <SelectTrigger id="ft-base-model" class="w-full">
              <SelectValue :placeholder="t('placeholder.select_llm')" />
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
            <div class="space-y-1">
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
            <div class="space-y-1">
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
              />
            </div>
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
