<script setup lang="ts">
import { computed } from 'vue';
import {
  Check,
  Clock,
  Ban,
  SkipForward,
  Loader2,
  Pause,
} from 'lucide-vue-next';
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

type IconLike = typeof Check;

type StatusStyle = {
  bg: string;
  icon: IconLike | null;
  /** Shown in the center of the dot when no icon (e.g. raw glyph). */
  glyph?: string;
  /** Extra classes for the icon element. */
  iconClass?: string;
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
    icon: null,
    glyph: '!',
    label: 'Failed',
    message: 'Resource failed to execute',
  },
  RUNNING: {
    bg: 'bg-sky-500',
    icon: Loader2,
    iconClass: 'animate-spin',
    label: 'Running',
    message: 'Run is running',
  },
  PENDING: {
    bg: 'bg-slate-400',
    icon: Clock,
    label: 'Pending',
    message: 'Run is pending',
  },
  CANCELED: {
    bg: 'bg-slate-400',
    icon: Ban,
    label: 'Canceled',
    message: 'Run was canceled',
  },
  CANCELING: {
    bg: 'bg-slate-400',
    icon: Ban,
    label: 'Canceling',
    message: 'Run is being canceled',
  },
  SKIPPED: {
    bg: 'bg-slate-300',
    icon: SkipForward,
    label: 'Skipped',
    message: 'Run was skipped',
  },
  PAUSED: {
    bg: 'bg-slate-400',
    icon: Pause,
    label: 'Paused',
    message: 'Run is paused',
  },
};

const FALLBACK_STYLE: StatusStyle = {
  bg: 'bg-slate-300',
  icon: null,
  glyph: '?',
  label: 'Unknown',
  message: 'Unknown status',
};

const getStyle = (status: string): StatusStyle => {
  const key = (status || '').toUpperCase();
  if (!key) return FALLBACK_STYLE;
  return (
    RUN_STATUS_STYLE[key] || {
      ...FALLBACK_STYLE,
      message: `Status: ${status}`,
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
              'inline-flex h-4 w-4 items-center justify-center rounded-full text-white shadow-sm transition-transform hover:scale-110',
              getStyle(run.status).bg,
            ]"
          >
            <component
              :is="getStyle(run.status).icon"
              v-if="getStyle(run.status).icon"
              :class="['h-2.5 w-2.5', getStyle(run.status).iconClass]"
              :stroke-width="3"
            />
            <span
              v-else-if="getStyle(run.status).glyph"
              class="text-[10px] font-bold leading-none"
            >
              {{ getStyle(run.status).glyph }}
            </span>
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
