<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  Check,
  Clock,
  Ban,
  SkipForward,
  Loader2,
  Pause,
  ChevronRight,
  Inbox,
  Archive as ArchiveIcon,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-vue-next';
import { toast as sonnerToast } from 'vue-sonner';
import type { PipelineRunsTab } from '@/composables/usePipelineActions';
import { useApi } from '@/composables/api';

type RunSummary = {
  run_id: string;
  run_name: string;
  status: string;
  created_at: string | null;
  finished_at?: string | null;
  duration?: string;
};

type BulkAction = 'archive' | 'restore' | 'delete';

const props = withDefaults(
  defineProps<{
    runs: RunSummary[];
    experimentId: string;
    experimentName?: string;
    tab?: PipelineRunsTab;
  }>(),
  { tab: 'active' },
);

const emit = defineEmits<{
  (e: 'mutated'): void;
}>();

const dayjs = useDayjs();
const router = useRouter();
const api = useApi();
const toaster = useToaster();
const { t } = useI18n();

const goToRun = (runId: string) => {
  void router.push(`/pipelines/${runId}`);
};

// ---------------------------------------------------------------------------
// Multi-select + bulk actions
// ---------------------------------------------------------------------------

/** Set of run_ids currently selected via checkbox. */
const selectedIds = ref<Set<string>>(new Set());

/**
 * Reset selection whenever the parent refreshes the runs list (e.g. after a
 * successful bulk archive) so stale ids don't linger in the selection set.
 */
watch(
  () => props.runs,
  () => {
    selectedIds.value = new Set();
  },
);

const selectedCount = computed(() => selectedIds.value.size);

const isSelected = (id: string) => selectedIds.value.has(id);

const toggleOne = (id: string, value: boolean | 'indeterminate') => {
  const next = new Set(selectedIds.value);
  if (value) next.add(id);
  else next.delete(id);
  selectedIds.value = next;
};

const allSelected = computed(
  () => props.runs.length > 0 && selectedIds.value.size === props.runs.length,
);

const headerCheckboxState = computed<boolean | 'indeterminate'>(() => {
  if (selectedIds.value.size === 0) return false;
  if (allSelected.value) return true;
  return 'indeterminate';
});

const toggleAll = (value: boolean | 'indeterminate') => {
  if (value === true) {
    selectedIds.value = new Set(props.runs.map((r) => r.run_id));
  } else {
    selectedIds.value = new Set();
  }
};

// -- Bulk confirmation dialog -----------------------------------------------
//
// IMPORTANT: We capture the action + selected ids into a closure
// (`pendingConfirmFn`) at the moment the dialog is *opened*. Reka-ui's
// `AlertDialogAction` internally calls `onOpenChange(false)` on click and
// Vue's attrs fallthrough can cause that close callback to run *before* our
// `@click` handler on the same button — which would otherwise clear the
// pending state and make the confirm button appear to do nothing. Holding the
// closure means the close path can't invalidate the action.

const isBulkDialogOpen = ref(false);
const pendingBulkAction = ref<BulkAction | null>(null);
const pendingConfirmFn = ref<(() => Promise<void>) | null>(null);
const pendingSelectedCount = ref(0);
const bulkInFlight = ref(false);

const pluralRun = (n: number) => (n === 1 ? 'run' : 'runs');

const executeBulkAction = async (action: BulkAction, ids: string[]) => {
  if (ids.length === 0) return;

  const caller =
    action === 'archive'
      ? (id: string) => api.archivePipelineRun(id)
      : action === 'restore'
        ? (id: string) => api.unarchivePipelineRun(id)
        : (id: string) => api.deletePipelineRun(id);

  const results = await Promise.allSettled(ids.map((id) => caller(id)));
  const ok = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.length - ok;

  if (failed === 0) {
    const plural = ok === 1 ? 'one' : 'other';
    const key =
      action === 'archive'
        ? (`bulk_runs_archived_${plural}` as const)
        : action === 'restore'
          ? (`bulk_runs_restored_${plural}` as const)
          : (`bulk_runs_deleted_${plural}` as const);
    toaster.show('success', key, ok === 1 ? undefined : { count: ok });
  } else if (ok === 0) {
    sonnerToast.error(
      t('message.error.bulk_runs_all_failed', { count: failed }),
      { duration: 5000 },
    );
  } else {
    sonnerToast.warning(
      t('message.warning.bulk_runs_partial', {
        ok,
        failed,
        total: ok + failed,
      }),
      { duration: 5000 },
    );
  }

  if (ok > 0) emit('mutated');
};

const openBulkDialog = (action: BulkAction) => {
  if (selectedCount.value === 0) return;
  const ids = Array.from(selectedIds.value);
  pendingBulkAction.value = action;
  pendingSelectedCount.value = ids.length;
  pendingConfirmFn.value = () => executeBulkAction(action, ids);
  isBulkDialogOpen.value = true;
};

const clearPendingBulk = () => {
  pendingBulkAction.value = null;
  pendingConfirmFn.value = null;
  pendingSelectedCount.value = 0;
};

const closeBulkDialog = () => {
  if (bulkInFlight.value) return;
  isBulkDialogOpen.value = false;
  clearPendingBulk();
};

const bulkDialogTitle = computed(() => {
  const n = pendingSelectedCount.value;
  switch (pendingBulkAction.value) {
    case 'archive':
      return `Archive ${n} ${pluralRun(n)}?`;
    case 'restore':
      return `Restore ${n} ${pluralRun(n)}?`;
    case 'delete':
      return `Delete ${n} ${pluralRun(n)}?`;
    default:
      return '';
  }
});

const bulkConfirmLabel = computed(() => {
  switch (pendingBulkAction.value) {
    case 'archive':
      return 'Archive';
    case 'restore':
      return 'Restore';
    case 'delete':
      return 'Delete';
    default:
      return 'Confirm';
  }
});

const bulkConfirmIsDestructive = computed(
  () => pendingBulkAction.value === 'delete',
);

const runBulkAction = async () => {
  const fn = pendingConfirmFn.value;
  if (!fn || bulkInFlight.value) return;

  bulkInFlight.value = true;
  try {
    await fn();
  } finally {
    bulkInFlight.value = false;
    isBulkDialogOpen.value = false;
    clearPendingBulk();
  }
};

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
  /** Background color for the small status circle. */
  dot: string;
  /** Text color for the status label. */
  text: string;
  icon: typeof Check | null;
  iconClass?: string;
  /** Glyph shown inside the dot when no icon is set (e.g. "!"). */
  glyph?: string;
  label: string;
  /** Coarse bucket for aggregate stats. */
  bucket: 'success' | 'failure' | 'active' | 'neutral';
};

const STATUS_TONES: Record<string, StatusTone> = {
  SUCCEEDED: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    icon: Check,
    label: 'Succeeded',
    bucket: 'success',
  },
  FAILED: {
    dot: 'bg-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
    icon: null,
    glyph: '!',
    label: 'Failed',
    bucket: 'failure',
  },
  RUNNING: {
    dot: 'bg-sky-500',
    text: 'text-sky-600 dark:text-sky-400',
    icon: Loader2,
    iconClass: 'animate-spin',
    label: 'Running',
    bucket: 'active',
  },
  PENDING: {
    dot: 'bg-slate-400',
    text: 'text-slate-600 dark:text-slate-300',
    icon: Clock,
    label: 'Pending',
    bucket: 'active',
  },
  CANCELED: {
    dot: 'bg-slate-400',
    text: 'text-slate-500 dark:text-slate-400',
    icon: Ban,
    label: 'Canceled',
    bucket: 'neutral',
  },
  CANCELING: {
    dot: 'bg-slate-400',
    text: 'text-slate-500 dark:text-slate-400',
    icon: Ban,
    label: 'Canceling',
    bucket: 'neutral',
  },
  SKIPPED: {
    dot: 'bg-slate-300',
    text: 'text-slate-500 dark:text-slate-400',
    icon: SkipForward,
    label: 'Skipped',
    bucket: 'neutral',
  },
  PAUSED: {
    dot: 'bg-slate-400',
    text: 'text-slate-500 dark:text-slate-400',
    icon: Pause,
    label: 'Paused',
    bucket: 'neutral',
  },
};

const FALLBACK: StatusTone = {
  dot: 'bg-slate-300',
  text: 'text-slate-500 dark:text-slate-400',
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
      class="relative rounded-md border border-border/70 bg-background shadow-md ring-1 ring-black/5 dark:ring-white/5 overflow-hidden"
    >
      <!-- Accent bar -->
      <div
        class="absolute top-0 left-0 h-full w-[3px] bg-primary/60"
        aria-hidden="true"
      />

      <!-- Header (title + stats on left, bulk actions on right) -->
      <!-- min-h locks the row height so selecting rows doesn't cause reflow -->
      <div
        :class="[
          'flex items-center justify-between gap-4 px-4 py-1.5 min-h-[44px] border-b border-border/70 transition-colors',
          selectedCount > 0 ? 'bg-primary/5' : 'bg-muted/30',
        ]"
      >
        <div class="flex items-center gap-3 min-w-0">
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

        <!-- Right-side bulk actions (selection summary + buttons) -->
        <div v-if="selectedCount > 0" class="flex items-center gap-2 shrink-0">
          <span class="text-[11px] font-medium text-foreground">
            <span class="tabular-nums">{{ selectedCount }}</span>
            <span class="text-muted-foreground">
              of {{ total }} {{ pluralRun(total) }} selected
            </span>
          </span>

          <button
            type="button"
            class="inline-flex items-center gap-1 h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted rounded cursor-pointer transition-colors"
            @click="toggleAll(false)"
          >
            <X class="h-3 w-3" />
            Clear
          </button>

          <Button
            v-if="props.tab === 'active'"
            size="sm"
            variant="outline"
            class="h-7 px-2.5 text-xs gap-1.5 cursor-pointer"
            @click="openBulkDialog('archive')"
          >
            <ArchiveIcon class="h-3 w-3 text-orange-500" />
            Archive {{ selectedCount }} {{ pluralRun(selectedCount) }}
          </Button>
          <template v-else>
            <Button
              size="sm"
              variant="outline"
              class="h-7 px-2.5 text-xs gap-1.5 cursor-pointer"
              @click="openBulkDialog('restore')"
            >
              <RotateCcw class="h-3 w-3 text-emerald-500" />
              Restore {{ selectedCount }} {{ pluralRun(selectedCount) }}
            </Button>
            <Button
              size="sm"
              variant="outline"
              class="h-7 px-2.5 text-xs gap-1.5 cursor-pointer text-destructive hover:text-destructive"
              @click="openBulkDialog('delete')"
            >
              <Trash2 class="h-3 w-3" />
              Delete {{ selectedCount }} {{ pluralRun(selectedCount) }}
            </Button>
          </template>
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

      <!-- Column headers -->
      <div
        v-if="total > 0"
        class="flex items-center gap-4 px-4 py-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground bg-muted/20 border-b border-border/70"
      >
        <span class="w-4 shrink-0 flex items-center">
          <Checkbox
            :model-value="headerCheckboxState"
            aria-label="Select all runs"
            class="size-3.5"
            @update:model-value="toggleAll"
          />
        </span>
        <span class="flex-1 min-w-0">Run name</span>
        <span class="w-[92px] shrink-0">Status</span>
        <span class="w-[72px] text-right shrink-0">Duration</span>
        <span class="w-[200px] text-right shrink-0">Start time</span>
        <span class="w-4 shrink-0" aria-hidden="true" />
      </div>

      <!-- Runs list -->
      <ul v-if="total > 0" class="divide-y divide-border/70">
        <TooltipProvider :delay-duration="200">
          <li v-for="run in runs" :key="run.run_id">
            <div
              role="link"
              tabindex="0"
              :class="[
                'group flex items-center gap-4 px-4 py-2 text-sm transition-colors cursor-pointer focus:outline-none focus-visible:bg-muted/40',
                isSelected(run.run_id)
                  ? 'bg-primary/5 hover:bg-primary/10'
                  : 'hover:bg-muted/40',
              ]"
              @click="goToRun(run.run_id)"
              @keydown.enter.prevent="goToRun(run.run_id)"
              @keydown.space.prevent="goToRun(run.run_id)"
            >
              <!-- Row checkbox (doesn't navigate) -->
              <div
                class="w-4 shrink-0 flex items-center"
                @click.stop
                @keydown.stop
              >
                <Checkbox
                  :model-value="isSelected(run.run_id)"
                  :aria-label="`Select run ${run.run_name}`"
                  class="size-3.5"
                  @update:model-value="(v) => toggleOne(run.run_id, v)"
                />
              </div>

              <!-- Run name (primary visual anchor) -->
              <span
                class="flex-1 min-w-0 font-semibold text-foreground text-[13px] truncate group-hover:text-primary"
                :title="run.run_name"
              >
                {{ run.run_name }}
              </span>

              <!-- Status chip: dot + tinted label, no background fill -->
              <span
                class="inline-flex items-center gap-1.5 shrink-0 w-[92px] text-[11px] font-medium"
              >
                <span
                  :class="[
                    'inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-white shrink-0',
                    toneFor(run.status).dot,
                  ]"
                >
                  <component
                    :is="toneFor(run.status).icon"
                    v-if="toneFor(run.status).icon"
                    :class="['h-2 w-2', toneFor(run.status).iconClass]"
                    :stroke-width="3"
                  />
                  <span
                    v-else-if="toneFor(run.status).glyph"
                    class="text-[9px] font-bold leading-none"
                  >
                    {{ toneFor(run.status).glyph }}
                  </span>
                </span>
                <span :class="toneFor(run.status).text">
                  {{ toneFor(run.status).label }}
                </span>
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
            </div>
          </li>
        </TooltipProvider>
      </ul>
    </div>

    <!-- Bulk action confirmation dialog -->
    <AlertDialog
      :open="isBulkDialogOpen"
      @update:open="
        (v) => {
          isBulkDialogOpen = v;
          if (!v) closeBulkDialog();
        }
      "
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ bulkDialogTitle }}</AlertDialogTitle>

          <AlertDialogDescription
            v-if="pendingBulkAction === 'archive'"
            class="space-y-3"
          >
            <p class="m-0">
              {{
                pendingSelectedCount === 1
                  ? 'Run will be moved to the Archive section, where you can still view its details.'
                  : `${pendingSelectedCount} runs will be moved to the Archive section, where you can still view their details.`
              }}
            </p>
            <p
              class="m-0 rounded-md border border-border/60 bg-muted/40 px-3 py-2.5 text-sm"
            >
              <span class="font-semibold text-foreground">
                {{ $t('alert.archive_run_note_label') }}:
              </span>
              {{
                pendingSelectedCount === 1
                  ? "The run will not be stopped if it's running when it's archived. Use the Restore action to restore the run to its original location."
                  : "Runs will not be stopped if they're running when archived. Use the Restore action to restore them to their original location."
              }}
            </p>
          </AlertDialogDescription>

          <AlertDialogDescription
            v-else-if="pendingBulkAction === 'restore'"
            class="m-0"
          >
            {{
              pendingSelectedCount === 1
                ? 'The selected run will be restored to the Active list. You can archive it again at any time.'
                : `${pendingSelectedCount} runs will be restored to the Active list. You can archive them again at any time.`
            }}
          </AlertDialogDescription>

          <AlertDialogDescription v-else class="m-0">
            {{
              pendingSelectedCount === 1
                ? 'Permanently delete the selected pipeline run? This cannot be undone.'
                : `Permanently delete ${pendingSelectedCount} pipeline runs? This cannot be undone.`
            }}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <!--
            Using plain <Button>s (not AlertDialogAction / AlertDialogCancel)
            because those components internally call `onOpenChange(false)` on
            click, which races with our async handler and closes the dialog
            before our logic can read the captured pending state. We drive the
            open state ourselves from runBulkAction / closeBulkDialog.
          -->
          <Button
            variant="outline"
            class="cursor-pointer"
            :disabled="bulkInFlight"
            @click="closeBulkDialog"
          >
            {{ $t('action.cancel') }}
          </Button>
          <Button
            :variant="bulkConfirmIsDestructive ? 'destructive' : 'default'"
            class="cursor-pointer"
            :disabled="bulkInFlight"
            @click="runBulkAction"
          >
            <Loader2 v-if="bulkInFlight" class="h-4 w-4 animate-spin" />
            {{ bulkConfirmLabel }}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
