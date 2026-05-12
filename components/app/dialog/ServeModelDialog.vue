<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-[720px] p-0 gap-0">
      <div class="px-6 pt-6 pb-4">
        <DialogHeader>
          <DialogTitle>Serve model</DialogTitle>
          <DialogDescription>
            Deploy a classical model artifact or an LLM from the Hugging Face
            Hub.
          </DialogDescription>
        </DialogHeader>

        <!-- Type segmented control -->
        <div
          class="relative inline-flex h-10 shrink-0 items-stretch gap-0.5 rounded-lg bg-muted p-0.5 w-full mt-4"
        >
          <div
            :class="[
              'pointer-events-none absolute top-0.5 bottom-0.5 rounded-md bg-background shadow-sm transition-[left] duration-300 ease-in-out',
              mode === 'classical' ? 'left-0.5' : 'left-(--seg-llm-left)',
            ]"
            :style="{
              width: 'calc((100% - 0.625rem) / 2)',
              '--seg-llm-left':
                'calc(0.125rem + (100% - 0.625rem) / 2 + 0.125rem)',
            }"
          />
          <button
            type="button"
            :class="[
              'relative z-10 inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors duration-200 cursor-pointer',
              mode === 'classical'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            ]"
            @click="setMode('classical')"
          >
            <Icon
              name="lucide:box"
              :class="[
                'size-4 shrink-0 transition-colors duration-300',
                mode === 'classical' ? 'text-blue-500' : '',
              ]"
            />
            <span>Classical model</span>
          </button>
          <button
            type="button"
            :class="[
              'relative z-10 inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors duration-200 cursor-pointer',
              mode === 'llm'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            ]"
            @click="setMode('llm')"
          >
            <Icon
              name="lucide:sparkles"
              :class="[
                'size-4 shrink-0 transition-colors duration-300',
                mode === 'llm' ? 'text-purple-500' : '',
              ]"
            />
            <span>LLM from Hugging Face</span>
          </button>
        </div>
      </div>

      <Separator />

      <!-- Form body -->
      <form
        class="px-6 py-5 max-h-[60vh] overflow-y-auto"
        @submit.prevent="submit"
      >
        <!-- CLASSICAL -->
        <template v-if="mode === 'classical'">
          <SectionHeader title="Basics" />
          <div class="space-y-3">
            <FieldRow label="Service name">
              <Input
                v-model="classical.isvc_name"
                placeholder="e.g. hp3"
                :aria-invalid="
                  !!classical.isvc_name && !isValidIsvcName(classical.isvc_name)
                "
              />
              <p
                v-if="
                  !!classical.isvc_name && !isValidIsvcName(classical.isvc_name)
                "
                class="text-[11px] text-destructive flex items-center gap-1 mt-1"
              >
                <Icon name="lucide:alert-circle" class="w-3 h-3" />
                Use lowercase letters, numbers, and hyphens. Must start and end
                with alphanumeric.
              </p>
            </FieldRow>
            <FieldRow label="Model ID" required>
              <Input
                v-model="classical.model_id"
                placeholder="UUID of the trained model"
              />
            </FieldRow>
            <FieldRow label="Model name">
              <Input
                v-model="classical.model_name"
                placeholder="e.g. HyperParameterCalibrator"
              />
            </FieldRow>
            <FieldRow label="Version">
              <Input v-model="classical.model_version" placeholder="e.g. 1" />
            </FieldRow>
          </div>

          <SectionHeader title="Advanced" class="mt-6" />
          <div class="space-y-3">
            <FieldRow label="Protocol version">
              <Select v-model="classical.protocol_version">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Select protocol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="v1">v1</SelectItem>
                  <SelectItem value="v2">v2</SelectItem>
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="Model format">
              <Input
                v-model="classical.model_format"
                placeholder="e.g. sklearn, tensorflow, pytorch"
              />
            </FieldRow>
            <FieldRow label="Transformer image">
              <Input
                v-model="classical.transformer_image"
                placeholder="e.g. my/transformer:latest"
              />
            </FieldRow>
            <FieldRow label="Transformer parameters" align="top">
              <Textarea
                v-model="classical.transformer_parameters_json"
                placeholder='{"PROMETHEUS_URL": "...", "PROMETHEUS_METRICS": "..."}'
                class="min-h-[90px] font-mono text-xs"
              />
              <p
                v-if="
                  classical.transformer_parameters_json &&
                  !isValidJson(classical.transformer_parameters_json)
                "
                class="text-[11px] text-destructive flex items-center gap-1 mt-1"
              >
                <Icon name="lucide:alert-circle" class="w-3 h-3" />
                Not valid JSON
              </p>
            </FieldRow>
            <FieldRow label="LoRA model IDs">
              <Input
                v-model="classical.lora_model_ids_csv"
                placeholder="Comma-separated list"
              />
              <p class="text-[11px] text-muted-foreground mt-1">
                Leave empty if none.
              </p>
            </FieldRow>
          </div>
        </template>

        <!-- LLM -->
        <template v-else>
          <SectionHeader title="Basics" />
          <div class="space-y-3">
            <FieldRow label="Hugging Face model ID" required>
              <Input
                v-model="llm.hf_model_id"
                placeholder="e.g. Qwen/Qwen2.5-Coder-7B-Instruct"
              />
              <p class="text-[11px] text-muted-foreground mt-1">
                Format: <code class="font-mono">org/model</code>
              </p>
            </FieldRow>
            <FieldRow label="Service name">
              <Input
                v-model="llm.isvc_name"
                placeholder="e.g. qwen25-coder"
                :aria-invalid="
                  !!llm.isvc_name && !isValidIsvcName(llm.isvc_name)
                "
              />
              <p
                v-if="!!llm.isvc_name && !isValidIsvcName(llm.isvc_name)"
                class="text-[11px] text-destructive flex items-center gap-1 mt-1"
              >
                <Icon name="lucide:alert-circle" class="w-3 h-3" />
                Use lowercase letters, numbers, and hyphens. Must start and end
                with alphanumeric.
              </p>
            </FieldRow>
            <FieldRow label="Served model name">
              <Input
                v-model="llm.served_model_name"
                placeholder="Defaults to the HF model ID if left blank"
              />
            </FieldRow>
          </div>

          <SectionHeader title="Model settings" class="mt-6" />
          <div class="space-y-3">
            <FieldRow label="HF token">
              <Input
                v-model="llm.hf_token"
                type="password"
                placeholder="hf_..."
                autocomplete="off"
              />
              <p class="text-[11px] text-muted-foreground mt-1">
                Required only for gated / private models.
              </p>
            </FieldRow>
            <FieldRow label="Data type">
              <Select v-model="llm.dtype">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Select dtype" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bfloat16">bfloat16</SelectItem>
                  <SelectItem value="float16">float16</SelectItem>
                  <SelectItem value="float32">float32</SelectItem>
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="Max model length">
              <Input
                v-model.number="llm.max_model_len"
                type="number"
                min="1"
                placeholder="e.g. 4096"
              />
            </FieldRow>
            <FieldRow label="Tensor parallel size">
              <Input
                v-model.number="llm.tensor_parallel_size"
                type="number"
                min="1"
                placeholder="e.g. 1"
              />
            </FieldRow>
          </div>

          <SectionHeader title="Resources" class="mt-6" />
          <div class="grid grid-cols-3 gap-3 text-[11px]">
            <div />
            <div class="text-center font-medium">Requests</div>
            <div class="text-center font-medium">Limits</div>
            <Label class="flex items-center">CPU</Label>
            <Input v-model="llm.res_cpu_req" placeholder="e.g. 4" />
            <Input v-model="llm.res_cpu_lim" placeholder="e.g. 8" />
            <Label class="flex items-center">Memory</Label>
            <Input v-model="llm.res_mem_req" placeholder="e.g. 7Gi" />
            <Input v-model="llm.res_mem_lim" placeholder="e.g. 8Gi" />
            <Label class="flex items-center">GPU</Label>
            <Input v-model="llm.res_gpu_req" placeholder="e.g. 1" />
            <Input v-model="llm.res_gpu_lim" placeholder="e.g. 1" />
          </div>

          <div class="grid grid-cols-2 gap-3 mt-4">
            <FieldRow label="Min replicas" inline>
              <Input
                v-model.number="llm.min_replicas"
                type="number"
                min="0"
                placeholder="1"
              />
            </FieldRow>
            <FieldRow label="Max replicas" inline>
              <Input
                v-model.number="llm.max_replicas"
                type="number"
                min="0"
                placeholder="1"
              />
            </FieldRow>
          </div>

          <SectionHeader title="Tolerations" class="mt-6">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              class="h-7 px-2 text-xs cursor-pointer"
              @click="addToleration"
            >
              <Icon name="lucide:plus" class="h-3 w-3 mr-1" />
              Add
            </Button>
          </SectionHeader>
          <p
            v-if="llm.tolerations.length === 0"
            class="text-[11px] text-muted-foreground"
          >
            No tolerations. Click Add to schedule pods onto tainted nodes.
          </p>
          <div
            v-for="(tol, i) in llm.tolerations"
            :key="i"
            class="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 mb-2 items-center"
          >
            <Input v-model="tol.key" placeholder="key" />
            <Select v-model="tol.operator">
              <SelectTrigger>
                <SelectValue placeholder="operator" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Equal">Equal</SelectItem>
                <SelectItem value="Exists">Exists</SelectItem>
              </SelectContent>
            </Select>
            <Input v-model="tol.value" placeholder="value" />
            <Select v-model="tol.effect">
              <SelectTrigger>
                <SelectValue placeholder="effect" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NoSchedule">NoSchedule</SelectItem>
                <SelectItem value="PreferNoSchedule">
                  PreferNoSchedule
                </SelectItem>
                <SelectItem value="NoExecute">NoExecute</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              class="h-8 w-8 cursor-pointer"
              @click="removeToleration(i)"
            >
              <Icon name="lucide:x" class="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        </template>
      </form>

      <Separator />

      <!-- Footer -->
      <DialogFooter class="px-6 py-4">
        <Button
          variant="outline"
          class="cursor-pointer"
          :disabled="isSubmitting"
          @click="close"
        >
          Cancel
        </Button>
        <Button
          class="cursor-pointer"
          :disabled="!isValid || isSubmitting"
          @click="submit"
        >
          <Icon
            v-if="isSubmitting"
            name="lucide:loader-2"
            class="mr-2 h-4 w-4 animate-spin"
          />
          Serve
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
import { computed, defineComponent, h, reactive, ref, watch } from 'vue';
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
import { Textarea } from '~/components/ui/textarea';
import { Separator } from '~/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { useApi } from '@/composables/api';

type Mode = 'classical' | 'llm';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'created'): void;
}>();

const { postModelServing } = useApi();

const mode = ref<Mode>('classical');
const isSubmitting = ref(false);

const blankClassical = () => ({
  isvc_name: '',
  model_id: '',
  model_name: '',
  model_version: '',
  protocol_version: 'v2',
  model_format: '',
  transformer_image: '',
  transformer_parameters_json: '',
  lora_model_ids_csv: '',
});

const blankLlm = () => ({
  isvc_name: '',
  served_model_name: '',
  hf_model_id: '',
  hf_token: '',
  dtype: '',
  max_model_len: undefined as number | undefined,
  tensor_parallel_size: undefined as number | undefined,
  res_cpu_req: '',
  res_cpu_lim: '',
  res_mem_req: '',
  res_mem_lim: '',
  res_gpu_req: '',
  res_gpu_lim: '',
  min_replicas: undefined as number | undefined,
  max_replicas: undefined as number | undefined,
  tolerations: [
    {
      key: 'storage-type',
      operator: 'Equal',
      value: 'local',
      effect: 'NoSchedule',
    },
  ] as Array<{
    key: string;
    operator: string;
    value: string;
    effect: string;
  }>,
});

const classical = reactive(blankClassical());
const llm = reactive(blankLlm());

const ISVC_REGEX = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;
const isValidIsvcName = (name: string) => ISVC_REGEX.test(name.trim());

const isValidJson = (raw: string) => {
  try {
    JSON.parse(raw);
    return true;
  } catch {
    return false;
  }
};

const isValid = computed(() => {
  if (mode.value === 'classical') {
    return (
      !!classical.model_id.trim() &&
      (!classical.isvc_name.trim() || isValidIsvcName(classical.isvc_name)) &&
      (!classical.transformer_parameters_json.trim() ||
        isValidJson(classical.transformer_parameters_json))
    );
  }
  return (
    !!llm.hf_model_id.trim() &&
    (!llm.isvc_name.trim() || isValidIsvcName(llm.isvc_name))
  );
});

const setMode = (next: Mode) => {
  mode.value = next;
};

const addToleration = () => {
  llm.tolerations.push({
    key: '',
    operator: 'Equal',
    value: '',
    effect: 'NoSchedule',
  });
};

const removeToleration = (i: number) => {
  llm.tolerations.splice(i, 1);
};

const resetState = () => {
  Object.assign(classical, blankClassical());
  Object.assign(llm, blankLlm());
  mode.value = 'classical';
  isSubmitting.value = false;
};

watch(
  () => props.open,
  (open) => {
    if (!open) resetState();
  },
);

const handleOpenChange = (v: boolean) => {
  if (!v && !isSubmitting.value) close();
};

const close = () => {
  emit('close');
};

type ClassicalPayload = {
  model_id: string;
  isvc_name?: string;
  model_name?: string;
  model_version?: string;
  protocol_version?: string;
  model_format?: string;
  transformer_image?: string;
  transformer_parameters?: Record<string, unknown>;
  lora_model_ids?: string[];
};

type LlmPayload = {
  hf_model_id: string;
  isvc_name?: string;
  served_model_name?: string;
  hf_token?: string;
  dtype?: string;
  max_model_len?: number;
  tensor_parallel_size?: number;
  resources?: {
    requests?: Record<string, string>;
    limits?: Record<string, string>;
  };
  tolerations?: Array<{
    key?: string;
    operator?: string;
    value?: string;
    effect?: string;
  }>;
  min_replicas?: number;
  max_replicas?: number;
};

const buildClassicalPayload = (): ClassicalPayload => {
  const payload: ClassicalPayload = {
    model_id: classical.model_id.trim(),
  };
  if (classical.isvc_name.trim())
    payload.isvc_name = classical.isvc_name.trim();
  if (classical.model_name.trim())
    payload.model_name = classical.model_name.trim();
  if (classical.model_version.trim())
    payload.model_version = classical.model_version.trim();
  if (classical.protocol_version)
    payload.protocol_version = classical.protocol_version;
  if (classical.model_format.trim())
    payload.model_format = classical.model_format.trim();
  if (classical.transformer_image.trim())
    payload.transformer_image = classical.transformer_image.trim();
  const tpJson = classical.transformer_parameters_json.trim();
  if (tpJson) {
    try {
      payload.transformer_parameters = JSON.parse(tpJson);
    } catch {
      /* guarded by isValid */
    }
  }
  const loraIds = classical.lora_model_ids_csv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (loraIds.length) payload.lora_model_ids = loraIds;
  return payload;
};

const buildLlmPayload = (): LlmPayload => {
  const payload: LlmPayload = {
    hf_model_id: llm.hf_model_id.trim(),
  };
  if (llm.isvc_name.trim()) payload.isvc_name = llm.isvc_name.trim();
  if (llm.served_model_name.trim())
    payload.served_model_name = llm.served_model_name.trim();
  if (llm.hf_token.trim()) payload.hf_token = llm.hf_token.trim();
  if (llm.dtype) payload.dtype = llm.dtype;
  if (typeof llm.max_model_len === 'number')
    payload.max_model_len = llm.max_model_len;
  if (typeof llm.tensor_parallel_size === 'number')
    payload.tensor_parallel_size = llm.tensor_parallel_size;

  const requests: Record<string, string> = {};
  const limits: Record<string, string> = {};
  if (llm.res_cpu_req.trim()) requests.cpu = llm.res_cpu_req.trim();
  if (llm.res_mem_req.trim()) requests.memory = llm.res_mem_req.trim();
  if (llm.res_gpu_req.trim())
    requests['nvidia.com/gpu'] = llm.res_gpu_req.trim();
  if (llm.res_cpu_lim.trim()) limits.cpu = llm.res_cpu_lim.trim();
  if (llm.res_mem_lim.trim()) limits.memory = llm.res_mem_lim.trim();
  if (llm.res_gpu_lim.trim()) limits['nvidia.com/gpu'] = llm.res_gpu_lim.trim();
  const resources: LlmPayload['resources'] = {};
  if (Object.keys(requests).length) resources.requests = requests;
  if (Object.keys(limits).length) resources.limits = limits;
  if (Object.keys(resources).length) payload.resources = resources;

  const tolerations: NonNullable<LlmPayload['tolerations']> = llm.tolerations
    .map((t) => {
      const cleaned: NonNullable<LlmPayload['tolerations']>[number] = {};
      if (t.key.trim()) cleaned.key = t.key.trim();
      if (t.operator) cleaned.operator = t.operator;
      if (t.value.trim()) cleaned.value = t.value.trim();
      if (t.effect) cleaned.effect = t.effect;
      return cleaned;
    })
    .filter((t) => Object.keys(t).length > 0);
  if (tolerations.length) payload.tolerations = tolerations;

  if (typeof llm.min_replicas === 'number')
    payload.min_replicas = llm.min_replicas;
  if (typeof llm.max_replicas === 'number')
    payload.max_replicas = llm.max_replicas;
  return payload;
};

const submit = async () => {
  if (!isValid.value || isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    const payload =
      mode.value === 'classical' ? buildClassicalPayload() : buildLlmPayload();
    // DEBUG: inspect request body before sending to the backend
    console.log('[ServeModelDialog] POST /models-serving', {
      mode: mode.value,
      body: payload,
    });
    await postModelServing(payload, {
      successMessage: 'model_serving_created',
    });
    emit('created');
    emit('close');
  } catch (err) {
    console.error('Failed to create model serving', err);
    // Error toast is shown by the request helper
  } finally {
    isSubmitting.value = false;
  }
};

const SectionHeader = defineComponent({
  name: 'SectionHeader',
  props: {
    title: { type: String, required: true },
  },
  setup(sectionProps, { slots }) {
    return () =>
      h(
        'div',
        {
          class:
            'flex items-center justify-between mb-3 pb-2 border-b border-border/60',
        },
        [
          h('h4', { class: 'text-sm font-semibold' }, sectionProps.title),
          slots.default?.(),
        ],
      );
  },
});

const FieldRow = defineComponent({
  name: 'FieldRow',
  props: {
    label: { type: String, required: true },
    required: { type: Boolean, default: false },
    align: { type: String as () => 'center' | 'top', default: 'center' },
    inline: { type: Boolean, default: false },
  },
  setup(fieldProps, { slots }) {
    return () => {
      const labelNode = h(
        'label',
        { class: 'text-xs font-medium text-muted-foreground' },
        [
          fieldProps.label,
          fieldProps.required
            ? h('span', { class: 'text-destructive ml-0.5' }, '*')
            : null,
        ],
      );
      if (fieldProps.inline) {
        return h('div', { class: 'space-y-1.5' }, [
          labelNode,
          slots.default?.(),
        ]);
      }
      return h(
        'div',
        {
          class: [
            'grid grid-cols-[160px_1fr] gap-3',
            fieldProps.align === 'top' ? 'items-start' : 'items-center',
          ],
        },
        [labelNode, h('div', {}, slots.default?.())],
      );
    };
  },
});
</script>
