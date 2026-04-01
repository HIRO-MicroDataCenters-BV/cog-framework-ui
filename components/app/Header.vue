<template>
  <header
    class="group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 flex h-16 w-full shrink-0 items-center gap-2 border-b border-border/60 bg-background/95 backdrop-blur-sm transition-[width,height] ease-linear"
  >
    <div class="flex w-full min-w-0 items-center gap-2 px-3 sm:gap-3 sm:px-4">
      <!-- Builder: breadcrumb | name + validity dot | mode pill | run button -->
      <template v-if="page.section === 'pipelines_builder'">
        <Breadcrumb class="shrink-0">
          <BreadcrumbList class="flex-wrap gap-x-1">
            <BreadcrumbItem class="hidden sm:block">
              <NuxtLink
                :to="breadcrumbSectionTo"
                class="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Icon
                  name="lucide:workflow"
                  class="size-3.5 shrink-0"
                  aria-hidden="true"
                />
                {{ $t(`menu.${page.section}`) }}
              </NuxtLink>
            </BreadcrumbItem>
            <template v-if="page.title !== ''">
              <BreadcrumbSeparator class="hidden sm:block" />
              <BreadcrumbItem
                class="hidden max-w-40 truncate text-sm text-muted-foreground md:block"
              >
                {{ page.title }}
              </BreadcrumbItem>
            </template>
          </BreadcrumbList>
        </Breadcrumb>

        <div
          class="mx-0.5 hidden h-7 w-px shrink-0 bg-border/80 sm:block"
          aria-hidden="true"
        />

        <!-- Pipeline name: ghost label → input on hover/focus, with dirty * prefix -->
        <div class="flex min-w-0 max-w-52 shrink-0 items-center sm:max-w-60">
          <!-- Dirty asterisk — always reserves space, visibility toggled to avoid layout shift -->
          <span
            class="mr-0.5 shrink-0 text-sm font-bold text-orange-400/80 transition-opacity duration-150"
            :class="hasUnsavedChanges ? 'opacity-100' : 'opacity-0'"
            :title="hasUnsavedChanges ? 'Unsaved changes' : undefined"
            aria-hidden="true"
            >*</span
          >
          <Form :validation-schema="pipelineNameSchema" class="min-w-0 flex-1">
            <FormField
              v-slot="{ componentField }"
              type="text"
              name="pipeline_name"
            >
              <FormItem class="space-y-0">
                <FormControl>
                  <Input
                    v-bind="componentField"
                    v-model="pipelineName"
                    type="text"
                    :placeholder="$t('placeholder.pipeline_name')"
                    class="h-7 border-transparent bg-transparent px-2 text-xs font-semibold shadow-none transition-[border-color,background-color,box-shadow] duration-150 placeholder:font-normal placeholder:text-muted-foreground/50 hover:border-border/60 hover:bg-muted/30 focus-visible:border-border/80 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/25"
                  />
                </FormControl>
              </FormItem>
            </FormField>
          </Form>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <!-- Mode pill — only shown when NUXT_PUBLIC_FEDERATED_ENABLED=true -->
          <DropdownMenu v-if="federatedEnabled">
            <DropdownMenuTrigger as-child>
              <button
                type="button"
                class="flex h-7 w-[7.5rem] cursor-pointer items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                :class="
                  pipelineRunMode === 'federated'
                    ? 'border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-400 dark:hover:bg-violet-500/15'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/15'
                "
              >
                <span
                  class="size-1.5 rounded-full"
                  :class="
                    pipelineRunMode === 'federated'
                      ? 'bg-violet-600 dark:bg-violet-400'
                      : 'bg-emerald-600 dark:bg-emerald-400'
                  "
                />
                {{
                  pipelineRunMode === 'federated'
                    ? $t('builder.save_run_mode_federated_short')
                    : $t('builder.save_run_mode_standard_short')
                }}
                <Icon
                  name="lucide:chevron-down"
                  class="size-3 opacity-60"
                  aria-hidden="true"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" class="w-56">
              <DropdownMenuLabel class="text-xs text-muted-foreground">
                {{ $t('builder.save_run_dialog_description') }}
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup v-model="pipelineRunMode">
                <DropdownMenuRadioItem value="standard">
                  <div class="flex flex-col gap-0.5">
                    <span class="text-sm font-medium">{{
                      $t('builder.save_run_mode_standard')
                    }}</span>
                    <span class="text-xs text-muted-foreground">{{
                      $t('builder.save_run_mode_standard_desc')
                    }}</span>
                  </div>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="federated">
                  <div class="flex flex-col gap-0.5">
                    <span class="text-sm font-medium">{{
                      $t('builder.save_run_mode_federated')
                    }}</span>
                    <span class="text-xs text-muted-foreground">{{
                      $t('builder.save_run_mode_federated_desc')
                    }}</span>
                  </div>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="openManageParameters">
                <Icon
                  name="lucide:sliders-horizontal"
                  class="mr-2 size-3.5"
                  aria-hidden="true"
                />
                {{ $t('builder.manage_parameters') }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <!-- When federated is disabled, show icon-only Manage Parameters button -->
          <Tooltip v-if="!federatedEnabled">
            <TooltipTrigger as-child>
              <button
                type="button"
                class="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                @click="openManageParameters"
              >
                <Icon
                  name="lucide:sliders-horizontal"
                  class="size-3.5"
                  aria-hidden="true"
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" class="text-xs">
              {{ $t('builder.manage_parameters') }}
            </TooltipContent>
          </Tooltip>

          <!-- Run button — fires immediately in the selected mode -->
          <TooltipProvider :delay-duration="200">
            <Tooltip>
              <TooltipTrigger as-child>
                <span
                  class="inline-flex rounded-lg"
                  :class="{ 'cursor-not-allowed': !canSave }"
                >
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    :disabled="!canSave"
                    class="group h-7 gap-2 px-3 text-xs font-semibold shadow-xs disabled:pointer-events-none disabled:cursor-not-allowed disabled:border disabled:border-border/50 disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 disabled:shadow-none"
                    @click="openConfirmDialog"
                  >
                    <Icon
                      name="lucide:play"
                      class="size-3.5 opacity-90 group-disabled:opacity-55"
                      aria-hidden="true"
                    />
                    <span>{{ $t('action.save_and_run') }}</span>
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent
                v-if="!canSave"
                side="bottom"
                align="center"
                :side-offset="6"
                :avoid-collisions="false"
                class="max-w-sm p-3"
              >
                <p class="mb-2 text-xs font-semibold">
                  {{ $t('builder.header_run_tooltip_title') }}
                </p>
                <ul
                  class="list-inside list-disc space-y-1.5 text-xs text-background/80"
                >
                  <li v-for="error in validationErrors" :key="error">
                    {{ error }}
                  </li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <!-- Save & Run confirmation dialog -->
          <Dialog v-model:open="confirmDialogOpen">
            <DialogContent
              class="flex max-h-[90vh] max-w-xl flex-col gap-0 p-0 overflow-hidden"
            >
              <!-- Header -->
              <div class="px-5 pt-5 pb-4 border-b border-border shrink-0">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <DialogTitle class="text-base font-semibold truncate">
                      {{ confirmPayload?.name || 'Untitled Pipeline' }}
                    </DialogTitle>
                    <DialogDescription
                      class="mt-0.5 text-xs text-muted-foreground"
                    >
                      Review before running
                    </DialogDescription>
                  </div>
                  <span
                    class="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize"
                    :class="
                      pipelineRunMode === 'federated'
                        ? 'bg-violet-500/10 text-violet-500 ring-1 ring-violet-500/20'
                        : 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20'
                    "
                  >
                    {{ pipelineRunMode }}
                  </span>
                </div>

                <!-- Summary stats -->
                <div
                  class="mt-3 flex items-center gap-4 text-xs text-muted-foreground"
                >
                  <span class="flex items-center gap-1.5">
                    <Icon name="lucide:boxes" class="size-3.5" />
                    {{ confirmPayload?.pipeline_components?.length ?? 0 }}
                    component{{
                      (confirmPayload?.pipeline_components?.length ?? 0) !== 1
                        ? 's'
                        : ''
                    }}
                  </span>
                  <span class="flex items-center gap-1.5">
                    <Icon name="lucide:sliders-horizontal" class="size-3.5" />
                    {{ pipelineParameters.length }} input param{{
                      pipelineParameters.length !== 1 ? 's' : ''
                    }}
                  </span>
                  <span class="flex items-center gap-1.5">
                    <Icon
                      name="lucide:square-arrow-down"
                      class="size-3.5 text-sky-400"
                    />
                    Output:
                    {{
                      confirmOutputNodeIds.length
                        ? `${confirmOutputNodeIds.length} selected`
                        : 'Not set'
                    }}
                  </span>
                </div>
              </div>

              <!-- Body -->
              <div
                class="min-h-0 flex-1 overflow-y-auto divide-y divide-border"
              >
                <!-- Components -->
                <div class="px-5 py-4">
                  <p
                    class="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
                  >
                    Components
                  </p>
                  <div class="max-h-32 overflow-y-auto space-y-1">
                    <div
                      v-for="comp in confirmPayload?.pipeline_components"
                      :key="comp.uuid"
                      class="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-1.5 text-xs"
                    >
                      <span class="font-medium truncate">{{ comp.name }}</span>
                      <span
                        class="shrink-0 font-mono text-[10px] text-muted-foreground/70"
                        >{{ comp.uuid?.slice(0, 8) }}…</span
                      >
                    </div>
                    <p
                      v-if="!confirmPayload?.pipeline_components?.length"
                      class="text-xs text-muted-foreground italic"
                    >
                      No components.
                    </p>
                  </div>
                </div>

                <!-- Pipeline Input -->
                <div class="px-5 py-4">
                  <p
                    class="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
                  >
                    Pipeline Input
                  </p>
                  <div
                    v-if="pipelineParameters.length"
                    class="flex flex-wrap gap-1.5"
                  >
                    <span
                      v-for="param in pipelineParameters"
                      :key="param.name"
                      class="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs"
                    >
                      <span class="font-medium">{{ param.name }}</span>
                      <span
                        v-if="param.type"
                        class="rounded bg-muted px-1 py-px font-mono text-[10px] text-muted-foreground"
                        >{{ param.type }}</span
                      >
                      <span v-if="param.default" class="text-muted-foreground"
                        >= {{ param.default }}</span
                      >
                    </span>
                  </div>
                  <p v-else class="text-xs text-muted-foreground italic">
                    No input parameters defined.
                  </p>
                </div>

                <!-- Pipeline Output -->
                <div class="px-5 py-4">
                  <p
                    class="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
                  >
                    Pipeline Output
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <button
                        type="button"
                        class="flex h-8 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-xs"
                      >
                        <span
                          class="min-w-0 flex-1 truncate text-left"
                          :class="
                            confirmOutputNodeIds.length
                              ? 'text-foreground'
                              : 'text-muted-foreground'
                          "
                        >
                          {{
                            confirmOutputNodeIds.length
                              ? confirmOutputDropdownLabel
                              : 'Select output components'
                          }}
                        </span>
                        <Icon
                          name="lucide:chevron-down"
                          class="size-4 shrink-0 text-muted-foreground/70"
                        />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      class="w-[26rem] max-w-[90vw]"
                    >
                      <DropdownMenuLabel class="text-xs text-muted-foreground">
                        Select one or more output components
                      </DropdownMenuLabel>
                      <DropdownMenuCheckboxItem
                        :checked="allOutputsSelected"
                        class="cursor-pointer text-xs pl-2 pr-2 hover:bg-muted/70"
                        @select.prevent="toggleAllConfirmOutputNodes"
                      >
                        <span class="flex min-w-0 items-center gap-2">
                          <Icon
                            :name="
                              allOutputsSelected
                                ? 'lucide:check-square'
                                : 'lucide:square'
                            "
                            class="size-3.5 shrink-0 text-muted-foreground"
                          />
                          <span class="truncate font-medium"
                            >Select all components</span
                          >
                        </span>
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuSeparator />
                      <div class="max-h-56 overflow-y-auto">
                        <DropdownMenuCheckboxItem
                          v-for="node in nodes"
                          :key="node.id"
                          :checked="isConfirmOutputSelected(node.id)"
                          class="cursor-pointer text-xs pl-2 pr-2 hover:bg-muted/70"
                          @select.prevent="toggleConfirmOutputNode(node.id)"
                        >
                          <span class="flex min-w-0 items-center gap-2">
                            <Icon
                              :name="
                                isConfirmOutputSelected(node.id)
                                  ? 'lucide:check-square'
                                  : 'lucide:square'
                              "
                              class="size-3.5 shrink-0 text-muted-foreground"
                            />
                            <span class="truncate">{{ node.data?.label }}</span>
                          </span>
                        </DropdownMenuCheckboxItem>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <p class="mt-2 text-xs text-muted-foreground">
                    {{
                      confirmOutputNodeIds.length
                        ? `Selected: ${confirmOutputNodeLabels.join(', ')}`
                        : 'No output component selected.'
                    }}
                  </p>

                  <div
                    v-if="
                      confirmOutputNodeIds.length &&
                      confirmPayload?.output_path?.length
                    "
                    class="mt-2 space-y-2 text-xs"
                  >
                    <div
                      v-for="out in confirmPayload.output_path"
                      :key="`${out.source.component_name}-${out.source.output_name}`"
                      class="rounded-md border border-border bg-muted/40 px-3 py-2"
                    >
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-muted-foreground"
                          >component_name</span
                        >
                        <span class="font-medium">{{
                          out.source.component_name
                        }}</span>
                      </div>
                      <div
                        class="mt-0.5 flex items-center justify-between gap-2"
                      >
                        <span class="text-muted-foreground">output_name</span>
                        <span class="font-medium">{{
                          out.source.output_name
                        }}</span>
                      </div>
                      <div
                        class="flex items-center justify-between gap-2 mt-0.5"
                      >
                        <span class="text-muted-foreground"
                          >component_uuid</span
                        >
                        <span
                          class="font-mono text-[10px] text-muted-foreground/80"
                          >{{ out.source.component_uuid ?? '—' }}</span
                        >
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <div
                class="flex items-center justify-end gap-2 px-5 py-4 border-t border-border shrink-0"
              >
                <Button
                  variant="outline"
                  size="sm"
                  @click="confirmDialogOpen = false"
                >
                  Cancel
                </Button>
                <Button size="sm" class="gap-2" @click="confirmAndRun">
                  <Icon name="lucide:play" class="size-3.5" />
                  Run Pipeline
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div class="min-w-0 flex-1" aria-hidden="true" />
      </template>

      <!-- Default header (non–pipeline builder) -->
      <template v-else>
        <div class="flex w-full min-w-0 items-center gap-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem class="hidden md:block">
                <NuxtLink :to="breadcrumbSectionTo">
                  {{ $t(`menu.${page.section}`) }}
                </NuxtLink>
              </BreadcrumbItem>
              <template v-if="page.title !== ''">
                <BreadcrumbSeparator />
                <BreadcrumbItem class="hidden md:block">{{
                  page.title
                }}</BreadcrumbItem>
              </template>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </template>
    </div>
  </header>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import type { Node as BuilderNode } from '~/types/canvas.types';
import type { PipelineCreationPayload } from '~/types/pipeline-payload.types';
import { builderDataToPayload } from '~/utils/pipeline-payload.builder';
import { Form, FormField, FormItem, FormControl } from '~/components/ui/form';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { pipelineNameSchema } from '~/schemas/builder-form.schema';
import {
  DropdownMenuCheckboxItem,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '~/components/ui/dialog';

const { page } = useApp();
const { t } = useI18n();
const { nodes, outputNodeIds, pipelineParameters } = usePipelineBuilder();
const { isNodeValid } = useNodeValidation();
const { openManageParameters: triggerManageParameters } = useBuilderEvents();

/** `page.section` keys do not always match URL paths (e.g. runs list is `/pipelines/run`). */
const breadcrumbSectionTo = computed(() => {
  const section = page.value.section;
  if (section === 'pipelines_builder') return '/pipelines/run';
  if (section === 'pipeline_runs' || section === 'pipelines') {
    return '/pipelines/run';
  }
  if (!section) return '/';
  return `/${section}`;
});
const api = useApi();
const runtimeConfig = useRuntimeConfig();
const federatedEnabled = computed(
  () => runtimeConfig.public.federatedEnabled as boolean,
);

const pipelineName = computed({
  get: () => page.value.data?.builder?.name || '',
  set: (value: string) => {
    if (page.value.data?.builder) {
      page.value.data.builder.name = value;
    }
  },
});

const orderId = computed(() => page.value.data?.orderId as string | undefined);

// Validation logic
const validationErrors = computed(() => {
  const errors: string[] = [];
  const builder = page.value.data?.builder;

  if (!builder) return errors;

  // Check pipeline name
  if (!builder.name || builder.name.trim() === '') {
    errors.push(t('validation.pipeline.name'));
  }

  // Check if pipeline has at least one component
  if (!builder.nodes || builder.nodes.length === 0) {
    errors.push(t('validation.pipeline.component_required'));
  }

  // Same rules as canvas / sheet: full input validation per component
  const graph =
    nodes.value.length > 0
      ? nodes.value
      : ((builder.nodes ?? []) as BuilderNode[]);

  if (graph.some((node) => node.data?.component && !isNodeValid(node, graph))) {
    errors.push(t('validation.pipeline.components_invalid'));
  }

  return errors;
});

const canSave = computed(() => {
  return validationErrors.value.length === 0;
});

// Dirty / unsaved-changes tracking
const _lastRunSnapshot = ref('');
const _modifiedAfterRun = ref(false);

watch(
  [pipelineName, nodes],
  () => {
    if (!_lastRunSnapshot.value) return; // before first run, hasUnsavedChanges handles it
    const snapshot = JSON.stringify({
      name: pipelineName.value,
      nodes: nodes.value,
    });
    _modifiedAfterRun.value = snapshot !== _lastRunSnapshot.value;
  },
  { deep: true },
);

// Show * when: canvas has content and never been run, OR modified since last run
const hasUnsavedChanges = computed(() =>
  _lastRunSnapshot.value === ''
    ? nodes.value.length > 0
    : _modifiedAfterRun.value,
);

// Default to federated when opened from a dataspace order link.
// When federated feature is disabled via env var, always lock to standard.
const pipelineRunMode = ref<'standard' | 'federated'>(
  federatedEnabled.value && orderId.value ? 'federated' : 'standard',
);

const openManageParameters = () => {
  triggerManageParameters();
};

// Confirmation dialog state
const confirmDialogOpen = ref(false);
const confirmOutputNodeIds = ref<string[]>([]);

// Reset local selection whenever dialog opens
watch(confirmDialogOpen, (open) => {
  if (open) confirmOutputNodeIds.value = [...outputNodeIds.value];
});

// Payload preview — reacts to confirmOutputNodeIds changes inside the dialog.
// Always merges the latest pipelineParameters so input_path is up to date.
const confirmPayload = computed<PipelineCreationPayload | null>(() => {
  const builder = page.value.data?.builder;
  if (!builder) return null;
  return builderDataToPayload(
    { ...builder, input_path: pipelineParameters.value },
    confirmOutputNodeIds.value,
  );
});

const confirmOutputNodeLabels = computed(() => {
  const labels = nodes.value
    .filter((node) => confirmOutputNodeIds.value.includes(node.id))
    .map((node) => (node.data?.label as string) || '');
  return labels.filter(Boolean);
});

const confirmOutputDropdownLabel = computed(() => {
  if (!confirmOutputNodeLabels.value.length) return '';
  if (confirmOutputNodeLabels.value.length <= 2) {
    return confirmOutputNodeLabels.value.join(', ');
  }
  return `${confirmOutputNodeLabels.value.slice(0, 2).join(', ')} +${confirmOutputNodeLabels.value.length - 2} more`;
});

const isConfirmOutputSelected = (nodeId: string) =>
  confirmOutputNodeIds.value.includes(nodeId);

const allOutputsSelected = computed(
  () =>
    nodes.value.length > 0 &&
    confirmOutputNodeIds.value.length === nodes.value.length,
);

const toggleAllConfirmOutputNodes = () => {
  if (allOutputsSelected.value) {
    confirmOutputNodeIds.value = [];
    return;
  }
  confirmOutputNodeIds.value = nodes.value.map((node) => node.id);
};

const toggleConfirmOutputNode = (nodeId: string) => {
  if (isConfirmOutputSelected(nodeId)) {
    confirmOutputNodeIds.value = confirmOutputNodeIds.value.filter(
      (id) => id !== nodeId,
    );
  } else {
    confirmOutputNodeIds.value = [...confirmOutputNodeIds.value, nodeId];
  }
};

function openConfirmDialog() {
  confirmDialogOpen.value = true;
}

function confirmAndRun() {
  outputNodeIds.value = [...confirmOutputNodeIds.value];
  confirmDialogOpen.value = false;
  executePipelineRun(pipelineRunMode.value);
}

function executePipelineRun(mode: 'standard' | 'federated') {
  const builder = page.value.data?.builder;
  if (!builder) return;

  // Snapshot current state — clears the * until something changes again
  _lastRunSnapshot.value = JSON.stringify({
    name: pipelineName.value,
    nodes: nodes.value,
  });
  _modifiedAfterRun.value = false;

  const payload: PipelineCreationPayload = builderDataToPayload(
    { ...builder, input_path: pipelineParameters.value },
    outputNodeIds.value,
  );

  console.log(
    `[builder] save & run JSON (${mode}):`,
    JSON.stringify(payload, null, 2),
  );

  if (mode === 'federated') {
    const oid = orderId.value;
    api.postTrainingBuilderPipelineDataspaceFederatedRun(
      oid ? { ...payload, order_id: oid } : payload,
    );
  } else {
    api.postTrainingBuilderPipeline(payload);
  }
}
</script>

<style></style>
