<script setup lang="ts">
/**
 * Admin dialog to set one user's resource quota.
 *
 * Each resource has a "cap" switch and a value. The body sent to
 * `PUT /quotas/{user}` carries only the capped resources, because the API
 * treats a missing key as *no cap* — so switching a resource off lifts it.
 * The dialog stays open when the request fails (the API client has already
 * shown the toast) and closes only on a saved response.
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
import { Switch } from '~/components/ui/switch';
import { Spinner } from '~/components/ui/spinner';
import { useApi } from '@/composables/api';
import type { QuotaStatus, QuotaUpdateRequest } from '~/types/api.types';
import {
  memoryToUnit,
  toCpuQuantity,
  toMemoryQuantity,
  type MemoryUnit,
} from '~/utils/quota';

const props = defineProps<{
  open: boolean;
  userId: string;
  namespace: string;
  /** The user's current quota, to prefill the form; null when none. */
  current: QuotaStatus | null;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'saved', status: QuotaStatus): void;
}>();

const { t } = useI18n();
const { putQuota } = useApi();

/**
 * Field values are kept as strings: the inputs hand back strings, and an
 * emptied field must read as "no value" rather than as zero.
 */
const form = ref({
  cpu: { capped: true, cores: '4' },
  memory: { capped: true, value: '16', unit: 'Gi' as MemoryUnit },
  gpu: { capped: false, count: '0' },
});
const submitting = ref(false);

/**
 * The quantities the quota currently holds and how they were prefilled.
 * A field the admin did not touch is sent back as the original quantity,
 * not as its display rounding, so saving an unrelated cap cannot silently
 * shrink this one (e.g. 1500Mi shown as 1.46 GiB).
 */
const original = ref<{
  cpu: string | null;
  memory: string | null;
  gpu: string | null;
}>({
  cpu: null,
  memory: null,
  gpu: null,
});
const prefilled = ref({
  cpu: '',
  memory: '',
  memoryUnit: 'Gi' as MemoryUnit,
  gpu: '',
});

/** Fill the form from the current quota; sensible defaults when none. */
const prefill = () => {
  const rows = new Map(
    (props.current?.resources ?? []).map((r) => [r.resource, r]),
  );
  const cpu = rows.get('cpu');
  const memory = rows.get('memory');
  const gpu = rows.get('gpu');
  const memoryShown =
    memory?.hard_value != null
      ? memoryToUnit(memory.hard_value)
      : { value: 16, unit: 'Gi' as MemoryUnit };
  form.value = {
    cpu: {
      capped: cpu?.hard != null,
      cores: String(cpu?.hard_value ?? 4),
    },
    memory: {
      capped: memory?.hard != null,
      value: String(memoryShown.value),
      unit: memoryShown.unit,
    },
    gpu: {
      capped: gpu?.hard != null,
      count: String(gpu?.hard_value ?? 0),
    },
  };
  original.value = {
    cpu: cpu?.hard ?? null,
    memory: memory?.hard ?? null,
    gpu: gpu?.hard ?? null,
  };
  prefilled.value = {
    cpu: form.value.cpu.cores,
    memory: form.value.memory.value,
    memoryUnit: form.value.memory.unit,
    gpu: form.value.gpu.count,
  };
};

/** Numeric value of a field, NaN when it is empty. */
const num = (value: string | number): number =>
  String(value).trim() === '' ? NaN : Number(value);

watch(
  () => props.open,
  (open) => {
    if (open) prefill();
  },
  { immediate: true },
);

const cpuValid = computed(
  () => !form.value.cpu.capped || num(form.value.cpu.cores) > 0,
);
const memoryValid = computed(
  () => !form.value.memory.capped || num(form.value.memory.value) > 0,
);
const gpuValid = computed(
  () =>
    !form.value.gpu.capped ||
    (Number.isInteger(num(form.value.gpu.count)) &&
      num(form.value.gpu.count) >= 0),
);
const anyCapped = computed(
  () =>
    form.value.cpu.capped || form.value.memory.capped || form.value.gpu.capped,
);
const canSubmit = computed(
  () =>
    anyCapped.value && cpuValid.value && memoryValid.value && gpuValid.value,
);

/** Why the save button is disabled, or empty when it is not. */
const blockingReason = computed(() => {
  if (!anyCapped.value) return t('hint.quota_at_least_one');
  if (!cpuValid.value || !memoryValid.value)
    return t('hint.quota_positive_values');
  if (!gpuValid.value) return t('hint.quota_gpu_integer');
  return '';
});

const buildBody = (): QuotaUpdateRequest => {
  const body: QuotaUpdateRequest = {};
  const { cpu, memory, gpu } = form.value;
  if (cpu.capped) {
    const untouched = cpu.cores === prefilled.value.cpu && original.value.cpu;
    body.cpu = untouched ? original.value.cpu : toCpuQuantity(num(cpu.cores));
  }
  if (memory.capped) {
    const untouched =
      memory.value === prefilled.value.memory &&
      memory.unit === prefilled.value.memoryUnit &&
      original.value.memory;
    body.memory = untouched
      ? original.value.memory
      : toMemoryQuantity(num(memory.value), memory.unit);
  }
  if (gpu.capped) body.gpu = num(gpu.count);
  return body;
};

const handleSubmit = async () => {
  if (!canSubmit.value || submitting.value) return;
  submitting.value = true;
  try {
    const response = (await putQuota(props.userId, buildBody())) as {
      data?: QuotaStatus;
    } | null;
    // request() never throws: null means the toast is already on screen and
    // the admin should keep the form to retry.
    if (!response?.data) return;
    emit('saved', response.data);
    emit('update:open', false);
  } finally {
    submitting.value = false;
  }
};

const handleOpenChange = (value: boolean) => {
  if (!submitting.value) emit('update:open', value);
};
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-[520px]">
      <DialogHeader>
        <DialogTitle>{{ t('title.edit_quota') }}</DialogTitle>
        <DialogDescription>
          {{ t('description.quota_dialog', { name: userId }) }}
          <span class="font-mono">{{ namespace }}</span>
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-5 py-2">
        <!-- CPU -->
        <div class="grid grid-cols-[1fr_auto] items-center gap-3">
          <div class="flex items-center gap-3">
            <Switch
              id="quota-cpu-capped"
              v-model="form.cpu.capped"
              data-testid="quota-cpu-switch"
            />
            <Label for="quota-cpu-capped">{{ t('label.quota_cpu') }}</Label>
          </div>
          <div class="flex items-center gap-2">
            <Input
              id="quota-cpu"
              v-model="form.cpu.cores"
              type="number"
              :aria-label="`${t('label.quota_cpu')} (${t('label.cores')})`"
              min="0.5"
              step="0.5"
              class="w-28 text-right"
              :disabled="!form.cpu.capped"
              data-testid="quota-cpu-input"
            />
            <span class="text-sm text-muted-foreground w-10">
              {{ t('label.cores') }}
            </span>
          </div>
        </div>

        <!-- Memory -->
        <div class="grid grid-cols-[1fr_auto] items-center gap-3">
          <div class="flex items-center gap-3">
            <Switch
              id="quota-memory-capped"
              v-model="form.memory.capped"
              data-testid="quota-memory-switch"
            />
            <Label for="quota-memory-capped">
              {{ t('label.quota_memory') }}
            </Label>
          </div>
          <div class="flex items-center gap-2">
            <Input
              id="quota-memory"
              v-model="form.memory.value"
              type="number"
              :aria-label="`${t('label.quota_memory')} (${form.memory.unit}B)`"
              min="1"
              step="1"
              class="w-28 text-right"
              :disabled="!form.memory.capped"
              data-testid="quota-memory-input"
            />
            <Select v-model="form.memory.unit" :disabled="!form.memory.capped">
              <SelectTrigger
                class="w-[4.5rem]"
                data-testid="quota-memory-unit"
                :aria-label="t('label.memory_unit')"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Gi">GiB</SelectItem>
                <SelectItem value="Mi">MiB</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- GPU -->
        <div class="grid grid-cols-[1fr_auto] items-center gap-3">
          <div class="flex items-center gap-3">
            <Switch
              id="quota-gpu-capped"
              v-model="form.gpu.capped"
              data-testid="quota-gpu-switch"
            />
            <Label for="quota-gpu-capped">{{ t('label.quota_gpu') }}</Label>
          </div>
          <div class="flex items-center gap-2">
            <Input
              id="quota-gpu"
              v-model="form.gpu.count"
              type="number"
              :aria-label="t('label.quota_gpu')"
              min="0"
              step="1"
              class="w-28 text-right"
              :disabled="!form.gpu.capped"
              data-testid="quota-gpu-input"
            />
            <span class="text-sm text-muted-foreground w-10">
              {{ t('label.gpus_short') }}
            </span>
          </div>
        </div>

        <p class="text-xs text-muted-foreground">
          {{ t('hint.quota_uncapped_means_unlimited') }}
        </p>
      </div>

      <DialogFooter class="flex items-center gap-3">
        <span
          v-if="blockingReason"
          class="text-xs text-muted-foreground mr-auto"
          data-testid="quota-blocking-reason"
        >
          {{ blockingReason }}
        </span>
        <Button
          variant="outline"
          :disabled="submitting"
          @click="handleOpenChange(false)"
        >
          {{ t('action.cancel') }}
        </Button>
        <Button
          :disabled="!canSubmit || submitting"
          data-testid="quota-save"
          @click="handleSubmit"
        >
          <Spinner v-if="submitting" class="size-4 mr-2" />
          {{ t('action.save') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
