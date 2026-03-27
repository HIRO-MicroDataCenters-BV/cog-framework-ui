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
                <Icon name="lucide:workflow" class="size-3.5 shrink-0" aria-hidden="true" />
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
          >*</span>
          <Form
            :validation-schema="pipelineNameSchema"
            class="min-w-0 flex-1"
          >
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
          <!-- Mode pill — click to switch Standard / Federated and access Manage Parameters -->
          <DropdownMenu>
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
                    @click="executePipelineRun(pipelineRunMode)"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';

const { page } = useApp();
const { t } = useI18n();
const { nodes } = usePipelineBuilder();
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
    const snapshot = JSON.stringify({ name: pipelineName.value, nodes: nodes.value });
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

// Default to federated when opened from a dataspace order link
const pipelineRunMode = ref<'standard' | 'federated'>(
  orderId.value ? 'federated' : 'standard',
);

const openManageParameters = () => {
  triggerManageParameters();
};

function executePipelineRun(mode: 'standard' | 'federated') {
  const builder = page.value.data?.builder;
  if (!builder) return;

  // Snapshot current state — clears the * until something changes again
  _lastRunSnapshot.value = JSON.stringify({ name: pipelineName.value, nodes: nodes.value });
  _modifiedAfterRun.value = false;

  const payload: PipelineCreationPayload = builderDataToPayload(builder);

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
