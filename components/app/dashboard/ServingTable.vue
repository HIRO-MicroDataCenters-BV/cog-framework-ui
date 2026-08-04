<script setup lang="ts">
import type { ServingRow } from '~/composables/useDashboard';

defineProps<{
  rows: ServingRow[];
  loading: boolean;
  error: boolean;
}>();

const dayjs = useDayjs();

function statusPill(status: string) {
  const s = status.toLowerCase();
  if (s === 'ready')
    return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
  if (s === 'pending' || s === 'unknown')
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300';
  return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
}

// Compact uptime ("running for") computed from the deploy timestamp.
// e.g. 3mo · 12d · 5h · 4m. Falls back to the backend `age` string if no timestamp.
function uptime(createdAt: string, fallbackAge: string): string {
  if (!createdAt) return fallbackAge || '';
  const start = new Date(createdAt).getTime();
  if (Number.isNaN(start)) return fallbackAge || '';
  const diff = Date.now() - start;
  if (diff < 0) return '0m';
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  if (months >= 1) {
    const remDays = days - months * 30;
    return remDays > 0 ? `${months}mo ${remDays}d` : `${months}mo`;
  }
  if (days >= 1) {
    const remHours = hours - days * 24;
    return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
  }
  if (hours >= 1) return `${hours}h`;
  return `${Math.max(mins, 1)}m`;
}
</script>

<template>
  <div
    class="rounded-xl border border-border/60 bg-card flex flex-col overflow-hidden"
  >
    <div
      class="flex items-center justify-between px-4 py-3 border-b border-border/50"
    >
      <div class="flex items-center gap-2">
        <Icon name="lucide:server" class="size-4 text-muted-foreground" />
        <span class="text-sm font-medium">Model Serving Status</span>
      </div>
      <span class="text-xs text-muted-foreground"
        >{{ rows.length }} deployments</span
      >
    </div>

    <div class="overflow-auto flex-1 max-h-[320px]">
      <table class="w-full text-xs">
        <thead class="sticky top-0 z-10 bg-card">
          <tr class="border-b border-border/40 text-muted-foreground">
            <th class="text-left px-4 py-2 font-medium">Name</th>
            <th class="text-left px-4 py-2 font-medium">Model</th>
            <th class="text-left px-4 py-2 font-medium">Status</th>
            <th class="text-left px-4 py-2 font-medium">Traffic</th>
            <th class="text-left px-4 py-2 font-medium">Deployed / Uptime</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="loading">
            <tr v-for="i in 5" :key="i" class="border-b border-border/20">
              <td v-for="j in 5" :key="j" class="px-4 py-2.5">
                <span
                  class="inline-block h-3 w-24 rounded bg-muted animate-pulse"
                />
              </td>
            </tr>
          </template>
          <template v-else-if="error">
            <tr>
              <td
                colspan="5"
                class="px-4 py-8 text-center text-muted-foreground"
              >
                <Icon
                  name="lucide:triangle-alert"
                  class="size-4 inline mr-1 text-red-500"
                />
                Failed to load serving status
              </td>
            </tr>
          </template>
          <template v-else-if="rows.length === 0">
            <tr>
              <td
                colspan="5"
                class="px-4 py-8 text-center text-muted-foreground"
              >
                No inference services found
              </td>
            </tr>
          </template>
          <template v-else>
            <tr
              v-for="row in rows"
              :key="row.isvcName"
              class="border-b border-border/20 hover:bg-muted/30 transition-colors"
            >
              <td class="px-4 py-2.5 font-medium">{{ row.isvcName }}</td>
              <td class="px-4 py-2.5 text-muted-foreground">
                {{ row.modelName ?? '—' }}
                <span
                  v-if="row.framework"
                  class="ml-1 text-[10px] text-muted-foreground/60"
                >
                  ({{ row.framework }})
                </span>
              </td>
              <td class="px-4 py-2.5">
                <span
                  class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize"
                  :class="statusPill(row.status)"
                >
                  <span
                    class="size-1.5 rounded-full"
                    :class="
                      row.status === 'ready'
                        ? 'bg-green-500'
                        : row.status === 'pending'
                          ? 'bg-yellow-400'
                          : 'bg-red-500'
                    "
                  />
                  {{ row.status }}
                </span>
              </td>
              <td class="px-4 py-2.5">
                <template v-if="row.hasCanary">
                  <span class="text-muted-foreground">
                    {{ row.stableTraffic ?? 0 }}% stable /
                    <span class="text-amber-600 dark:text-amber-400">
                      {{ row.canaryTraffic ?? 0 }}% canary
                    </span>
                  </span>
                </template>
                <template v-else>
                  <span class="text-muted-foreground">100% stable</span>
                </template>
              </td>
              <td class="px-4 py-2.5">
                <template v-if="row.createdAt">
                  <div class="text-muted-foreground">
                    {{ dayjs(row.createdAt).format('DD MMM YY, HH:mm') }}
                  </div>
                  <div
                    v-if="row.status === 'ready'"
                    class="mt-0.5 inline-flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400"
                  >
                    <Icon name="lucide:activity" class="size-3" />
                    running {{ uptime(row.createdAt, row.age) }}
                  </div>
                  <div
                    v-else
                    class="mt-0.5 inline-flex items-center gap-1 text-[10px] text-muted-foreground/70"
                  >
                    <Icon name="lucide:clock" class="size-3" />
                    {{ uptime(row.createdAt, row.age) }} old
                  </div>
                </template>
                <span v-else class="text-muted-foreground">—</span>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Canary bug footnote -->
    <div
      class="px-4 py-2 border-t border-border/30 flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400"
    >
      <Icon name="lucide:triangle-alert" class="size-3 shrink-0" />
      Known issue: canary/stable traffic percentages may be swapped if KServe
      returns revisions in unexpected order
    </div>
  </div>
</template>
