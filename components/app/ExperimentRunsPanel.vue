<script setup lang="ts">
import { computed } from 'vue';
import {
  Check,
  Clock,
  Ban,
  SkipForward,
  Loader2,
  Pause,
  ChevronRight,
  ArrowRight,
  Inbox,
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
  finished_at?: string | null;
  duration?: string;
};

const props = defineProps<{
  runs: RunSummary[];
  experimentId: string;
  experimentName?: string;
}>();

const dayjs = useDayjs();

type StatusTone = {
  dot: string;
  pill: string;
  icon: typeof Check | null;
  iconClass?: string;
  label: string;
  /** Coarse bucket for aggregate stats. */
  bucket: 'success' | 'failure' | 'active' | 'neutral';
};

const STATUS_TONES: Record<string, StatusTone> = {
  SUCCEEDED: {
    dot: 'bg-emerald-500',
    pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30',
    icon: Check,
    label: 'Succeeded',
    bucket: 'success',
  },
  FAILED: {
    dot: 'bg-rose-500',
    pill: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/30',
    icon: null,
    label: 'Failed',
    bucket: 'failure',
  },
  RUNNING: {
    dot: 'bg-sky-500',
    pill: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/30',
    icon: Loader2,
    iconClass: 'animate-spin',
    label: 'Running',
    bucket: 'active',
  },
  PENDING: {
    dot: 'bg-slate-400',
    pill: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/30',
    icon: Clock,
    label: 'Pending',
    bucket: 'active',
  },
  CANCELED: {
    dot: 'bg-slate-400',
    pill: 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/30',
    icon: Ban,
    label: 'Canceled',
    bucket: 'neutral',
  },
  CANCELING: {
    dot: 'bg-slate-400',
    pill: 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/30',
    icon: Ban,
    label: 'Canceling',
    bucket: 'neutral',
  },
  SKIPPED: {
    dot: 'bg-slate-300',
    pill: 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/30',
    icon: SkipForward,
    label: 'Skipped',
    bucket: 'neutral',
  },
  PAUSED: {
    dot: 'bg-slate-400',
    pill: 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/30',
    icon: Pause,
    label: 'Paused',
    bucket: 'neutral',
  },
};

const FALLBACK: StatusTone = {
  dot: 'bg-slate-300',
  pill: 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/30',
  icon: null,
  label: 'Unknown',
  bucket: 'neutral',
};

const toneFor = (status: string): StatusTone => {
  const key = (status || '').toUpperCase();
  return STATUS_TONES[key] || { ...FALLBACK, label: status || 'Unknown' };
};

const total = computed(() => props.runs.length);
const succeeded = computed(
  () => props.runs.filter((r) => toneFor(r.status).bucket === 'success').length,
);
const failed = computed(
  () => props.runs.filter((r) => toneFor(r.status).bucket === 'failure').length,
);
const active = computed(
  () => props.runs.filter((r) => toneFor(r.status).bucket === 'active').length,
);

/**
 * Compact, human-readable "time ago" helper. Avoids pulling in the dayjs
 * relativeTime plugin (not configured in this app) and keeps output short
 * enough for a dense table cell.
 */
const relativeTime = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return 'just now';
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.floor(day / 7);
  if (wk < 4) return `${wk}w ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  const yr = Math.floor(day / 365);
  return `${yr}y ago`;
};

const runsPageHref = computed(
  () => `/pipelines/runs?experiment_id=${props.experimentId}`,
);
</script>

<template>
  <div class="pl-6 pr-4 py-3">
    <!-- Nested card -->
    <div
      class="relative rounded-md border border-border/70 bg-background shadow-sm overflow-hidden"
    >
      <!-- Accent bar -->
      <div
        class="absolute top-0 left-0 h-full w-[3px] bg-primary/60"
        aria-hidden="true"
      />

      <!-- Header -->
      <div
        class="flex items-center justify-between gap-4 px-4 py-2.5 border-b border-border/70 bg-muted/30"
      >
        <div class="flex items-center gap-3">
          <h4 class="text-sm font-semibold text-foreground">Recent runs</h4>
          <span
            class="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums"
          >
            {{ total }}
          </span>

          <!-- Aggregate stats -->
          <div
            v-if="total > 0"
            class="hidden sm:flex items-center gap-3 pl-1 text-xs text-muted-foreground"
          >
            <span v-if="succeeded > 0" class="inline-flex items-center gap-1">
              <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {{ succeeded }} succeeded
            </span>
            <span v-if="failed > 0" class="inline-flex items-center gap-1">
              <span class="h-1.5 w-1.5 rounded-full bg-rose-500" />
              {{ failed }} failed
            </span>
            <span v-if="active > 0" class="inline-flex items-center gap-1">
              <span class="h-1.5 w-1.5 rounded-full bg-sky-500" />
              {{ active }} active
            </span>
          </div>
        </div>

        <NuxtLink
          v-if="total > 0"
          :to="runsPageHref"
          class="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View all runs
          <ArrowRight class="h-3 w-3" :stroke-width="2.5" />
        </NuxtLink>
      </div>

      <!-- Empty state -->
      <div
        v-if="total === 0"
        class="flex flex-col items-center justify-center gap-2 py-8 text-center"
      >
        <div
          class="flex items-center justify-center h-10 w-10 rounded-full bg-muted/60"
        >
          <Inbox class="h-5 w-5 text-muted-foreground/60" />
        </div>
        <p class="text-sm text-muted-foreground">
          No runs yet for this experiment.
        </p>
      </div>

      <!-- Runs list -->
      <ul v-else class="divide-y divide-border/70">
        <TooltipProvider :delay-duration="200">
          <li v-for="run in runs" :key="run.run_id">
            <NuxtLink
              :to="`/pipelines/${run.run_id}`"
              class="group flex items-center gap-4 px-4 py-2 text-sm hover:bg-muted/40 transition-colors"
            >
              <!-- Status pill -->
              <span
                :class="[
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset shrink-0 w-[96px] justify-center',
                  toneFor(run.status).pill,
                ]"
              >
                <component
                  :is="toneFor(run.status).icon"
                  v-if="toneFor(run.status).icon"
                  :class="['h-2.5 w-2.5', toneFor(run.status).iconClass]"
                  :stroke-width="3"
                />
                <span
                  v-else
                  :class="['h-1.5 w-1.5 rounded-full', toneFor(run.status).dot]"
                />
                {{ toneFor(run.status).label }}
              </span>

              <!-- Run name -->
              <span
                class="flex-1 min-w-0 font-medium text-foreground truncate group-hover:text-primary"
                :title="run.run_name"
              >
                {{ run.run_name }}
              </span>

              <!-- Duration -->
              <span
                class="text-xs text-muted-foreground tabular-nums w-[72px] text-right shrink-0"
              >
                {{ run.duration && run.duration !== '-' ? run.duration : '—' }}
              </span>

              <!-- Start time (relative + absolute tooltip) -->
              <Tooltip v-if="run.created_at">
                <TooltipTrigger as-child>
                  <span
                    class="text-xs text-muted-foreground tabular-nums w-[84px] text-right shrink-0"
                  >
                    {{ relativeTime(run.created_at) }}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" class="px-3 py-2 text-xs">
                  Start:
                  {{ dayjs(run.created_at).format('DD/MM/YYYY, HH:mm:ss') }}
                </TooltipContent>
              </Tooltip>
              <span
                v-else
                class="text-xs text-muted-foreground w-[84px] text-right shrink-0"
              >
                —
              </span>

              <!-- Drill-in affordance -->
              <ChevronRight
                class="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary shrink-0"
                :stroke-width="2"
              />
            </NuxtLink>
          </li>
        </TooltipProvider>
      </ul>
    </div>
  </div>
</template>
