<script setup lang="ts">
import type { OwnerStat } from '~/composables/useDashboard';

defineProps<{
  owners: OwnerStat[];
  loading: boolean;
  error: boolean;
}>();

// Deterministic avatar tint from the email so each owner has a stable colour.
const palette = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
];
function tint(email: string) {
  let h = 0;
  for (let i = 0; i < email.length; i++)
    h = (h + email.charCodeAt(i)) % palette.length;
  return palette[h];
}
function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
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
        <Icon name="lucide:users-round" class="size-4 text-indigo-500" />
        <span class="text-sm font-medium">Assets by Owner</span>
      </div>
      <span class="text-xs text-muted-foreground"
        >{{ owners.length }} owners</span
      >
    </div>

    <div class="overflow-auto flex-1 max-h-[320px]">
      <table class="w-full text-xs">
        <thead class="sticky top-0 z-10 bg-card">
          <tr class="border-b border-border/40 text-muted-foreground">
            <th class="text-left px-4 py-2 font-medium">Owner</th>
            <th class="text-left px-4 py-2 font-medium">Department</th>
            <th class="text-right px-4 py-2 font-medium">Models</th>
            <th class="text-right px-4 py-2 font-medium">Datasets</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="loading">
            <tr v-for="i in 4" :key="i" class="border-b border-border/20">
              <td v-for="j in 4" :key="j" class="px-4 py-2.5">
                <span
                  class="inline-block h-3 w-20 rounded bg-muted animate-pulse"
                />
              </td>
            </tr>
          </template>
          <template v-else-if="error">
            <tr>
              <td
                colspan="4"
                class="px-4 py-8 text-center text-muted-foreground"
              >
                <Icon
                  name="lucide:triangle-alert"
                  class="size-4 inline mr-1 text-red-500"
                />
                Failed to load ownership data
              </td>
            </tr>
          </template>
          <template v-else-if="owners.length === 0">
            <tr>
              <td
                colspan="4"
                class="px-4 py-8 text-center text-muted-foreground"
              >
                No owned assets found
              </td>
            </tr>
          </template>
          <template v-else>
            <tr
              v-for="owner in owners"
              :key="owner.email"
              class="border-b border-border/20 hover:bg-muted/30 transition-colors"
            >
              <td class="px-4 py-2.5">
                <div class="flex items-center gap-2.5">
                  <span
                    class="flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                    :class="tint(owner.email)"
                  >
                    {{ initials(owner.name) }}
                  </span>
                  <div class="min-w-0">
                    <div class="font-medium truncate">{{ owner.name }}</div>
                    <div class="text-[10px] text-muted-foreground truncate">
                      {{ owner.email }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-4 py-2.5">
                <span v-if="owner.department" class="text-muted-foreground">
                  {{ owner.department }}
                </span>
                <span v-else class="text-muted-foreground/40">—</span>
              </td>
              <td class="px-4 py-2.5 text-right tabular-nums">
                {{ owner.models }}
              </td>
              <td class="px-4 py-2.5 text-right tabular-nums">
                {{ owner.datasets }}
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>
