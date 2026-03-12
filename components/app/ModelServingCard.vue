<template>
  <Card
    class="overflow-hidden transition-all hover:shadow-lg dark:hover:shadow-zinc-900/50 border-border dark:border-zinc-700 cursor-pointer flex flex-col h-full"
    @click="emit('select')"
  >
    <!-- Header -->
    <div class="relative px-4 pt-3 pb-2">
      <!-- Icon and name -->
      <div class="flex items-start gap-2.5">
        <div
          class="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10 dark:bg-primary/20 text-primary"
        >
          <Icon name="lucide:server" class="w-5 h-5" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-start justify-between gap-2">
            <h3
              class="font-semibold text-foreground truncate"
              :title="serving.isvc_name"
            >
              {{ serving.isvc_name }}
            </h3>
            <TooltipProvider v-if="!serving.has_canary" :delay-duration="300">
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-6 w-6 text-amber-700 hover:text-amber-800 hover:bg-amber-100/60"
                    @click.stop="emit('create-canary', serving)"
                  >
                    <Icon name="lucide:git-branch-plus" class="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" class="text-[11px] px-2 py-1">
                  Canary Rollout
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div class="flex items-center justify-between gap-2 mt-0.5">
            <div class="flex items-center gap-1.5">
              <Badge :class="statusBadgeClass" class="text-[10px] font-medium">
                {{ serving.status }}
              </Badge>
              <Button
                v-if="
                  serving.status && serving.status.toLowerCase() !== 'ready'
                "
                variant="ghost"
                size="icon"
                class="h-5 w-5 text-muted-foreground hover:text-foreground"
                title="Refresh status"
                :disabled="refreshing"
                @click.stop="emit('refresh-status', serving.isvc_name)"
              >
                <Icon
                  name="lucide:refresh-cw"
                  :class="['h-3 w-3', refreshing && 'animate-spin']"
                />
              </Button>
            </div>
            <span
              v-if="serving.age"
              class="text-[10px] text-muted-foreground tabular-nums shrink-0"
            >
              {{ formatAge(serving.age) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Model info -->
    <div
      class="px-4 py-3 border-t border-border/50 dark:border-zinc-700/50 bg-muted/20 dark:bg-zinc-800/30"
    >
      <div class="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span class="text-muted-foreground block mb-0.5">Model</span>
          <span
            class="font-medium text-foreground truncate block"
            :title="serving.model_name ?? undefined"
          >
            {{ serving.model_name ?? '—' }}
          </span>
        </div>
        <div>
          <span class="text-muted-foreground block mb-0.5">Version</span>
          <span class="font-medium text-foreground">
            {{ serving.model_version ? `v${serving.model_version}` : '—' }}
          </span>
        </div>
        <!-- Age moved to header -->
        <template v-if="!serving.has_canary">
          <div class="col-span-2 flex items-center justify-between gap-2">
            <span class="text-muted-foreground">Revision</span>
            <TooltipProvider :delay-duration="300">
              <Tooltip>
                <TooltipTrigger as-child>
                  <span
                    class="font-mono text-[11px] text-foreground truncate text-right"
                  >
                    {{
                      shortenRevisionMiddle(
                        serving.latest_ready_revision ?? undefined,
                      )
                    }}
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  class="max-w-[min(24rem,90vw)] break-all text-[10px]"
                >
                  {{ serving.latest_ready_revision ?? '—' }}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </template>
        <template v-else>
          <div class="col-span-2 flex items-center justify-between gap-2">
            <span class="text-muted-foreground">Revision</span>
            <TooltipProvider :delay-duration="300">
              <Tooltip>
                <TooltipTrigger as-child>
                  <span
                    class="font-mono text-[11px] text-foreground truncate text-right"
                  >
                    {{
                      shortenRevisionMiddle(
                        serving.stable_revision ?? undefined,
                      )
                    }}
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  class="max-w-[min(24rem,90vw)] break-all text-[10px]"
                >
                  {{ serving.stable_revision ?? '—' }}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </template>
      </div>
    </div>

    <!-- Canary section -->
    <div
      v-if="serving.has_canary"
      class="px-4 py-2 border-t border-amber-400/40 bg-amber-400/5 dark:bg-amber-400/10"
    >
      <div class="flex items-center justify-between gap-2 mb-1">
        <div
          class="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 dark:text-amber-100"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
          <span>Canary rollout</span>
        </div>
        <span class="text-[11px] text-muted-foreground">
          {{
            serving.canary_model_version
              ? `v${serving.canary_model_version}`
              : serving.model_version
                ? `v${serving.model_version}`
                : '—'
          }}
        </span>
      </div>
      <div class="flex items-center justify-between gap-2 text-[11px] mt-0.5">
        <span class="text-muted-foreground">Canary rev.</span>
        <TooltipProvider :delay-duration="300">
          <Tooltip>
            <TooltipTrigger as-child>
              <span
                class="font-mono text-[10px] text-amber-800 dark:text-amber-200 text-right"
              >
                {{
                  shortenRevisionMiddle(serving.canary_revision ?? undefined)
                }}
              </span>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              class="max-w-[min(24rem,90vw)] break-all text-[10px]"
            >
              {{ serving.canary_revision ?? '—' }}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>

    <!-- Bottom section: URL + Traffic split -->
    <div class="mt-auto">
      <!-- URL section -->
      <div class="px-4 py-2 border-t border-border/50 dark:border-zinc-700/50">
        <div class="flex items-center gap-2">
          <Icon
            name="lucide:link"
            class="w-3.5 h-3.5 text-muted-foreground shrink-0"
          />
          <CopyPaste
            :has-copy="true"
            :copy-text="serving.served_model_url"
            class="flex-1 min-w-0"
          >
            <TooltipProvider :delay-duration="300">
              <Tooltip>
                <TooltipTrigger as-child>
                  <span
                    class="text-xs text-muted-foreground hover:text-foreground truncate block cursor-pointer transition-colors"
                  >
                    {{ serving.served_model_url ?? '—' }}
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  class="max-w-[min(24rem,90vw)] break-all text-xs"
                >
                  {{ serving.served_model_url ?? '—' }}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CopyPaste>
        </div>
      </div>

      <!-- Traffic split (stop propagation so slider doesn't open sheet) -->
      <div
        class="px-4 py-3 border-t border-border/50 dark:border-zinc-700/50 bg-muted/10 dark:bg-zinc-800/20"
        @click.stop
      >
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-xs font-medium text-muted-foreground"
            >Traffic Split</span
          >
          <div class="flex items-center gap-2 text-[10px]">
            <span class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-amber-500/80" />
              Canary {{ localCanaryPercent }}%
            </span>
            <span class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-primary/80" />
              Stable {{ 100 - localCanaryPercent }}%
            </span>
          </div>
        </div>

        <!-- Visual bar: Canary (left) | Stable (right) -->
        <div
          class="h-1.5 w-full rounded-full overflow-hidden bg-muted dark:bg-zinc-700 flex mb-3"
        >
          <div
            class="h-full bg-amber-500/80 transition-all duration-300"
            :style="{ width: `${localCanaryPercent}%` }"
          />
          <div
            class="h-full bg-primary/80 transition-all duration-300"
            :style="{ width: `${100 - localCanaryPercent}%` }"
          />
        </div>

        <!-- Slider, step controls, and update (enabled only when has_canary) -->
        <div class="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            class="h-6 w-6 shrink-0"
            :class="
              serving.has_canary
                ? 'cursor-pointer'
                : 'cursor-not-allowed opacity-50'
            "
            :disabled="!serving.has_canary || localCanaryPercent <= 0"
            :title="'-5'"
            @click="stepCanary(-5)"
          >
            <Icon name="lucide:minus" class="h-3 w-3" />
          </Button>
          <div class="flex-1 flex items-center gap-1.5 min-w-0">
            <input
              v-model.number="localCanaryPercent"
              type="range"
              min="0"
              max="100"
              step="5"
              :disabled="!serving.has_canary"
              class="flex-1 min-w-0 h-1 rounded-full appearance-none bg-muted dark:bg-zinc-700 accent-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
              @input="onSliderInput"
            />
            <span
              class="text-[10px] font-medium tabular-nums w-6 text-right shrink-0"
              >{{ localCanaryPercent }}%</span
            >
          </div>
          <Button
            variant="outline"
            size="icon"
            class="h-6 w-6 shrink-0"
            :class="
              serving.has_canary
                ? 'cursor-pointer'
                : 'cursor-not-allowed opacity-50'
            "
            :disabled="!serving.has_canary || localCanaryPercent >= 100"
            :title="'+5'"
            @click="stepCanary(5)"
          >
            <Icon name="lucide:plus" class="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            class="h-6 min-w-14 px-2 text-[10px] shrink-0 transition-opacity duration-200"
            :class="
              isSaving || !serving.has_canary
                ? 'opacity-50 cursor-not-allowed'
                : 'opacity-100 cursor-pointer'
            "
            :disabled="isSaving || !serving.has_canary"
            title="Update"
            @click="saveTraffic"
          >
            <Icon
              v-if="isSaving"
              name="lucide:loader-2"
              class="w-3 h-3 animate-spin"
            />
            <template v-else>Update</template>
          </Button>
        </div>
      </div>
    </div>
  </Card>
</template>

<script lang="ts" setup>
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import CopyPaste from '~/components/app/CopyPaste.vue';
import type { ModelServing } from '~/types/model.types';

const props = defineProps<{
  serving: ModelServing;
  refreshing?: boolean;
}>();

const emit = defineEmits<{
  (
    e: 'updated',
    payload?: { isvc_name: string; canary_traffic_percent: number },
  ): void;
  (e: 'select'): void;
  (e: 'create-canary', serving: ModelServing): void;
  (e: 'refresh-status', isvcName: string): void;
}>();

const { patchModelServing } = useApi();
const toaster = useToaster();

const isSaving = ref(false);
const initialCanaryPercent =
  props.serving.canary_traffic_percent ??
  (props.serving.has_canary && props.serving.stable_traffic_percent != null
    ? 100 - props.serving.stable_traffic_percent
    : 0);

const localCanaryPercent = ref(initialCanaryPercent);

const statusDotClass = computed(() => {
  const s = props.serving.status?.toLowerCase();
  if (s === 'ready') return 'bg-green-500 shadow-green-500/50 shadow-sm';
  if (s === 'pending')
    return 'bg-amber-500 shadow-amber-500/50 shadow-sm animate-pulse';
  if (s === 'failed') return 'bg-red-500 shadow-red-500/50 shadow-sm';
  if (s === 'unknown') return 'bg-gray-500 shadow-gray-500/50 shadow-sm';
  if (s === 'terminating')
    return 'bg-purple-500 shadow-purple-500/50 shadow-sm animate-pulse';
  return 'bg-muted-foreground';
});

const statusBadgeClass = computed(() => {
  const s = props.serving.status?.toLowerCase();
  if (s === 'ready')
    return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
  if (s === 'pending')
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
  if (s === 'failed')
    return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
  if (s === 'unknown')
    return 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300';
  if (s === 'terminating')
    return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300';
  return 'bg-muted text-muted-foreground';
});

const hasChanges = computed(
  () => localCanaryPercent.value !== initialCanaryPercent,
);

function formatAge(age: string | undefined): string {
  if (!age) return '—';
  const [days] = age.split(', ');
  return days || age;
}

function shortenRevision(revision: string | undefined): string {
  if (!revision) return '—';
  if (revision.length > 12) return revision.slice(0, 12) + '...';
  return revision;
}

function shortenRevisionMiddle(
  revision: string | undefined,
  max: number = 30,
): string {
  if (!revision) return '—';
  if (revision.length <= max) return revision;
  // Keep total displayed length at ~30 characters: 14 + 1 + 15
  const head = revision.slice(0, 14);
  const tail = revision.slice(-15);
  return `${head}…${tail}`;
}

watch(
  () =>
    props.serving.canary_traffic_percent ??
    (props.serving.has_canary ? props.serving.traffic_percentage : null),
  (v) => {
    localCanaryPercent.value = v ?? 0;
  },
);

function onSliderInput() {
  localCanaryPercent.value = Math.min(
    100,
    Math.max(0, Number(localCanaryPercent.value)),
  );
}

function stepCanary(delta: number) {
  localCanaryPercent.value = Math.min(
    100,
    Math.max(0, localCanaryPercent.value + delta),
  );
}

async function saveTraffic() {
  if (!hasChanges.value) return;
  isSaving.value = true;
  try {
    await patchModelServing({
      isvc_name: props.serving.isvc_name,
      canary_traffic_percent: localCanaryPercent.value,
    });
    emit('updated', {
      isvc_name: props.serving.isvc_name,
      canary_traffic_percent: localCanaryPercent.value,
    });
  } catch (e) {
    console.error(e);
    toaster.show('error', 'Failed to update traffic');
  } finally {
    isSaving.value = false;
  }
}
</script>
