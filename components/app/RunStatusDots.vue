<script setup lang="ts">
import { computed } from 'vue';
import { Check, X, Minus } from 'lucide-vue-next';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';

type RunSummary = {
  run_id: string;
  run_name: string;
  status: string;
  created_at: string | null;
};

const props = defineProps<{
  runs: RunSummary[];
}>();

const dayjs = useDayjs();

type StatusStyle = {
  bg: string;
  icon: typeof Check | null;
  label: string;
  message: string;
};

const RUN_STATUS_STYLE: Record<string, StatusStyle> = {
  SUCCEEDED: {
    bg: 'bg-emerald-500',
    icon: Check,
    label: 'Succeeded',
    message: 'Run succeeded',
  },
  FAILED: {
    bg: 'bg-rose-500',
    icon: X,
    label: 'Failed',
    message: 'Resource failed to execute',
  },
  RUNNING: {
    bg: 'bg-sky-500',
    icon: null,
    label: 'Running',
    message: 'Run is running',
  },
  PENDING: {
    bg: 'bg-slate-400',
    icon: null,
    label: 'Pending',
    message: 'Run is pending',
  },
  CANCELED: {
    bg: 'bg-slate-400',
    icon: Minus,
    label: 'Canceled',
    message: 'Run was canceled',
  },
  CANCELING: {
    bg: 'bg-slate-400',
    icon: Minus,
    label: 'Canceling',
    message: 'Run is being canceled',
  },
  SKIPPED: {
    bg: 'bg-slate-300',
    icon: Minus,
    label: 'Skipped',
    message: 'Run was skipped',
  },
  PAUSED: {
    bg: 'bg-slate-400',
    icon: null,
    label: 'Paused',
    message: 'Run is paused',
  },
};

const getStyle = (status: string): StatusStyle => {
  const key = (status || '').toUpperCase();
  return (
    RUN_STATUS_STYLE[key] || {
      bg: 'bg-slate-300',
      icon: null,
      label: status || 'Unknown',
      message: status ? `Status: ${status}` : 'Unknown status',
    }
  );
};

// KFP shows oldest → newest left-to-right; API returns newest-first.
const ordered = computed(() => [...(props.runs || [])].reverse());
</script>

<template>
  <span v-if="!ordered.length" class="text-muted-foreground text-sm">-</span>
  <TooltipProvider v-else :delay-duration="150">
    <div class="flex items-center gap-1.5">
      <Tooltip v-for="run in ordered" :key="run.run_id">
        <TooltipTrigger as-child>
          <span
            :class="[
              'inline-flex h-4 w-4 items-center justify-center rounded-full text-white',
              getStyle(run.status).bg,
            ]"
          >
            <component
              :is="getStyle(run.status).icon"
              v-if="getStyle(run.status).icon"
              class="h-2.5 w-2.5"
              :stroke-width="3"
            />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" class="px-3 py-2">
          <div class="flex flex-col gap-0.5 text-xs">
            <div class="font-medium">
              {{ getStyle(run.status).message }}
            </div>
            <div v-if="run.created_at" class="opacity-80">
              Start: {{ dayjs(run.created_at).format('DD/MM/YYYY, HH:mm:ss') }}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  </TooltipProvider>
</template>
