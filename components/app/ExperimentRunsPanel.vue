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
  Inbox,
} from 'lucide-vue-next';

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

/**
 * Human-readable "time ago" helper. Uses dayjs's calendar-aware `.diff()`
 * so month/year boundaries respect the actual calendar. For longer spans
 * (months, years) it includes the next smaller unit for precision — e.g.
 * "1 month 5 days ago" instead of a coarse "1mo ago". Avoids the dayjs
 * `relativeTime` plugin (not configured in this app).
 *
 * Thresholds:
 *   < 60s  → "Ns ago"
 *   < 60m  → "Nm ago"
 *   < 24h  → "Nh ago"
 *   < 30d  → "Nd ago"                   (keeps "28 days ago" from becoming "0mo ago")
 *   < 12mo → "N month[s] M day[s] ago"
 *   else   → "N year[s] M month[s] ago"
 */
const pluralize = (n: number, unit: string): string =>
  `${n} ${unit}${n === 1 ? '' : 's'}`;

const relativeTime = (iso: string): string => {
  const target = dayjs(iso);
  const now = dayjs();

  if (now.diff(target) < 0) return 'just now';

  const sec = now.diff(target, 'second');
  if (sec < 60) return `${sec}s ago`;

  const min = now.diff(target, 'minute');
  if (min < 60) return `${min}m ago`;

  const hr = now.diff(target, 'hour');
  if (hr < 24) return `${hr}h ago`;

  const day = now.diff(target, 'day');
  if (day < 30) return `${day}d ago`;

  const months = now.diff(target, 'month');
  if (months < 12) {
    // Calendar-accurate leftover days after the whole months.
    const remDays = now.diff(target.add(months, 'month'), 'day');
    if (months === 0) return `${day}d ago`;
    return remDays > 0
      ? `${pluralize(months, 'month')} ${pluralize(remDays, 'day')} ago`
      : `${pluralize(months, 'month')} ago`;
  }

  const years = now.diff(target, 'year');
  const remMonths = now.diff(target.add(years, 'year'), 'month');
  return remMonths > 0
    ? `${pluralize(years, 'year')} ${pluralize(remMonths, 'month')} ago`
    : `${pluralize(years, 'year')} ago`;
};

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

              <!-- Start time (date + time on one line, relative label below) -->
              <span
                v-if="run.created_at"
                class="flex flex-col items-end text-xs w-[200px] shrink-0 leading-tight"
              >
                <span class="text-foreground tabular-nums">
                  {{ dayjs(run.created_at).format('DD-MMM-YYYY HH:mm:ss') }}
                </span>
                <span class="text-muted-foreground/80 text-[11px] mt-0.5">
                  {{ relativeTime(run.created_at) }}
                </span>
              </span>
              <span
                v-else
                class="text-xs text-muted-foreground w-[200px] text-right shrink-0"
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
