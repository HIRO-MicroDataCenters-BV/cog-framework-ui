<template>
  <header
    class="group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 flex h-16 w-full shrink-0 items-center gap-2 border-b border-border/60 bg-background/95 backdrop-blur-sm transition-[width,height] ease-linear"
  >
    <div class="flex w-full min-w-0 items-center gap-2 px-3 sm:gap-3 sm:px-4">
      <!-- Builder: breadcrumb | name (compact) | CTA grouped with tight gap -->
      <template v-if="page.section === 'pipelines_builder'">
        <Breadcrumb class="shrink-0">
          <BreadcrumbList class="flex-wrap gap-x-1">
            <BreadcrumbItem class="hidden sm:block">
              <NuxtLink
                :to="breadcrumbSectionTo"
                class="text-muted-foreground transition-colors hover:text-foreground"
              >
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

        <Form
          :validation-schema="pipelineNameSchema"
          class="w-full min-w-0 max-w-52 shrink-0 sm:max-w-60"
        >
          <FormField
            v-slot="{ componentField }"
            type="text"
            name="pipeline_name"
          >
            <FormItem class="space-y-0">
              <FormControl>
                <div class="relative">
                  <Icon
                    name="lucide:workflow"
                    class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    v-bind="componentField"
                    v-model="pipelineName"
                    type="text"
                    :placeholder="$t('placeholder.pipeline_name')"
                    class="h-9 border-border/80 bg-muted/30 pl-9 text-sm font-medium shadow-sm transition-[box-shadow,background-color] placeholder:text-muted-foreground/70 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/25"
                  />
                </div>
              </FormControl>
            </FormItem>
          </FormField>
        </Form>

        <div class="flex shrink-0 items-center gap-2">
          <!-- Save & Run Button -->
          <TooltipProvider :delay-duration="200">
            <Tooltip>
              <TooltipTrigger as-child>
                <!-- Wrapper: disabled buttons don't receive hover; tooltip still explains validation -->
                <span
                  class="inline-flex rounded-lg"
                  :class="{ 'cursor-not-allowed': !canSave }"
                >
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    :disabled="!canSave"
                    class="group h-9 gap-2 px-4 font-medium shadow-xs disabled:pointer-events-none disabled:cursor-not-allowed disabled:border disabled:border-border/50 disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 disabled:shadow-none"
                    @click="openSaveRunDialog"
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

          <!-- Manage Parameters Button -->
          <TooltipProvider :delay-duration="200">
            <Tooltip>
              <TooltipTrigger as-child>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  class="h-9 w-9 p-0 shadow-xs"
                  @click="openManageParameters"
                >
                  <Icon
                    name="lucide:settings"
                    class="size-3.5"
                    aria-hidden="true"
                  />
                  <span class="sr-only">{{ $t('builder.manage_parameters') }}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                align="center"
                :side-offset="6"
              >
                <p class="text-xs">{{ $t('builder.manage_parameters') }}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div class="min-w-0 flex-1" aria-hidden="true" />

        <AlertDialog
          :open="saveRunDialogOpen"
          @update:open="onSaveRunDialogOpenChange"
        >
          <AlertDialogContent class="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>{{
                $t('builder.save_run_dialog_title')
              }}</AlertDialogTitle>
              <AlertDialogDescription>
                {{ $t('builder.save_run_dialog_description') }}
              </AlertDialogDescription>
              <div class="mt-4 border-l-2 border-primary/50 pl-3" role="status">
                <p
                  class="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {{ $t('builder.save_run_pipeline_label') }}
                </p>
                <p
                  class="truncate text-base font-semibold leading-snug text-foreground"
                  :title="pipelineName || undefined"
                >
                  {{ pipelineName || '—' }}
                </p>
              </div>
            </AlertDialogHeader>
            <RadioGroup v-model="pipelineRunMode" class="grid gap-3 py-2">
              <label
                class="flex cursor-pointer gap-3 rounded-lg border border-border p-3 text-left transition-colors has-data-[state=checked]:border-primary has-data-[state=checked]:bg-muted/40"
              >
                <RadioGroupItem value="standard" class="mt-0.5 shrink-0" />
                <span class="min-w-0">
                  <span class="block text-sm font-medium text-foreground">{{
                    $t('builder.save_run_mode_standard')
                  }}</span>
                  <span class="mt-0.5 block text-xs text-muted-foreground">{{
                    $t('builder.save_run_mode_standard_desc')
                  }}</span>
                </span>
              </label>
              <label
                class="flex cursor-pointer gap-3 rounded-lg border border-border p-3 text-left transition-colors has-data-[state=checked]:border-primary has-data-[state=checked]:bg-muted/40"
              >
                <RadioGroupItem value="federated" class="mt-0.5 shrink-0" />
                <span class="min-w-0">
                  <span class="block text-sm font-medium text-foreground">{{
                    $t('builder.save_run_mode_federated')
                  }}</span>
                  <span class="mt-0.5 block text-xs text-muted-foreground">{{
                    $t('builder.save_run_mode_federated_desc')
                  }}</span>
                </span>
              </label>
            </RadioGroup>
            <AlertDialogFooter>
              <AlertDialogCancel @click="saveRunDialogOpen = false">
                {{ $t('action.cancel') }}
              </AlertDialogCancel>
              <Button type="button" @click="confirmSaveRun">
                {{ $t('action.confirm') }}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
import { computed, ref } from 'vue';
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
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';

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

const saveRunDialogOpen = ref(false);
const pipelineRunMode = ref<'standard' | 'federated'>('standard');

const openSaveRunDialog = () => {
  if (!canSave.value) return;
  pipelineRunMode.value = orderId.value ? 'federated' : 'standard';
  saveRunDialogOpen.value = true;
};

const openManageParameters = () => {
  triggerManageParameters();
};

const confirmSaveRun = () => {
  saveRunDialogOpen.value = false;
  executePipelineRun(pipelineRunMode.value);
};

function onSaveRunDialogOpenChange(open: boolean) {
  saveRunDialogOpen.value = open;
}

function executePipelineRun(mode: 'standard' | 'federated') {
  const builder = page.value.data?.builder;
  if (!builder) return;

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
