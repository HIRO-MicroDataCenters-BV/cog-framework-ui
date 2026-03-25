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

        <div class="flex shrink-0 items-center">
          <TooltipProvider :delay-duration="200">
            <Tooltip>
              <TooltipTrigger as-child>
                <!-- Wrapper: disabled buttons don’t receive hover; tooltip still explains validation -->
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
                    @click="runPipeline"
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
                <ul class="list-inside list-disc space-y-1.5 text-xs text-background/80">
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
import { computed } from 'vue';
import type {
  Edge,
  Component,
  Node as BuilderNode,
  ComponentInput,
} from '~/types/builder.types';
import { Form, FormField, FormItem, FormControl } from '~/components/ui/form';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { pipelineNameSchema } from '~/schemas/builder-form.schema';

const { page } = useApp();
const { t } = useI18n();

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
const config = useRuntimeConfig();
const baseUrl = config.app.baseURL;
const urlOrigin = window.location.origin;

const pipelineName = computed({
  get: () => page.value.data?.builder?.name || '',
  set: (value: string) => {
    if (page.value.data?.builder) {
      page.value.data.builder.name = value;
    }
  },
});

interface ComponentPath {
  name: string;
  type: string;
  description?: string;
  default?: unknown;
  optional?: boolean;
}

interface TopLevelInputPath {
  name: string;
  type: string;
  default?: unknown;
}

interface TopLevelOutputPath {
  name: string;
  source: {
    component_name: string;
    output_name: string;
  };
}

interface RegularPipelineComponent {
  id: string;
  name: string;
  inputs: ComponentInput[];
  input_path: ComponentPath[];
  output_path: ComponentPath[];
}

interface FederatedPipelineComponent {
  id: string;
  name: string;
  input_path: ComponentPath[];
  output_path: ComponentPath[];
  component_file: string | null;
  category: string | null;
  creator: string | null;
}

type PipelineComponent = RegularPipelineComponent | FederatedPipelineComponent;

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

  // Check each component's required inputs
  builder.nodes?.forEach((node: BuilderNode) => {
    const component = node.data?.component;
    if (!component) return;

    // Get required inputs (those without optional flag or with optional: false)
    const requiredInputs =
      component.input_path?.filter((input: ComponentPath) => !input.optional) ||
      [];

    const configuredInputs = component.inputs || [];

    requiredInputs.forEach((reqInput: ComponentPath) => {
      const configured = configuredInputs.find(
        (i: ComponentInput) => i.destination === reqInput.name,
      );

      if (!configured || !configured.source || !configured.value_source_type) {
        errors.push(
          t('validation.pipeline.input_required', {
            component: component.name || node.label,
            input: reqInput.name,
          }),
        );
      }
    });
  });

  return errors;
});

const canSave = computed(() => {
  return validationErrors.value.length === 0;
});

const runPipeline = () => {
  const builder = page.value.data?.builder;
  if (!builder) return;

  interface PipelineData {
    name: string;
    pipeline_components: PipelineComponent[];
    input_path: TopLevelInputPath[];
    output_path: TopLevelOutputPath[];
    order_id?: string;
  }

  const data: PipelineData = {
    name: builder.name,
    pipeline_components: [] as PipelineComponent[],
    input_path: [] as TopLevelInputPath[],
    output_path: [] as TopLevelOutputPath[],
  };

  const components =
    builder?.nodes?.map((node) => {
      const component = node?.data?.component as Component;
      const uuid = String(component?.id || '');
      const name = node?.data?.label || component?.name || '';
      const input_path = component?.input_path || [];
      const output_path = component?.output_path || [];

      if (orderId.value) {
        // For federated pipelines, include both metadata AND inputs
        const inputs =
          component?.inputs?.map((input: ComponentInput) => ({
            destination: input.destination,
            value_source_type: input.value_source_type,
            source: input.source,
          })) || [];

        return {
          id: uuid,
          name,
          inputs, // Include configured input values
          input_path,
          output_path,
          component_file: component?.component_file || null,
          category: component?.category || null,
          creator: component?.creator || null,
        };
      }

      const inputs =
        component?.inputs?.map((input: ComponentInput) => ({
          destination: input.destination,
          value_source_type: input.value_source_type,
          source: input.source,
        })) || [];

      return {
        id: uuid,
        name,
        inputs,
        input_path,
        output_path,
      };
    }) || [];

  if (orderId.value) {
    const inputPathMap = new Map<string, TopLevelInputPath>();

    components.forEach((comp) => {
      comp.input_path.forEach((path: ComponentPath) => {
        if (path.default !== undefined && !inputPathMap.has(path.name)) {
          inputPathMap.set(path.name, {
            name: path.name,
            type: path.type,
            default: path.default,
          });
        }
      });
    });

    data.input_path = Array.from(inputPathMap.values());

    const serverComp = components.find(
      (c) =>
        c.name.toLowerCase().includes('server') ||
        ('category' in c &&
          (c as FederatedPipelineComponent).category
            ?.toLowerCase()
            .includes('server')),
    );

    if (serverComp) {
      data.output_path = [
        {
          name: 'final_global_model',
          source: {
            component_name: serverComp.name,
            output_name: serverComp.output_path[0]?.name || 'Output',
          },
        },
      ];
    } else {
      const lastComp = components[components.length - 1];
      if (lastComp) {
        data.output_path = [
          {
            name: 'final_global_model',
            source: {
              component_name: lastComp.name,
              output_name: lastComp.output_path[0]?.name || 'Output',
            },
          },
        ];
      }
    }
  } else {
    const input_path: TopLevelInputPath[] = [];
    const output_path: TopLevelOutputPath[] = [];

    components.forEach((comp) => {
      comp.input_path.forEach((path: ComponentPath) => {
        input_path.push({
          name: path.name,
          type: path.type,
          default: path.default,
        });
      });
      comp.output_path.forEach((path: ComponentPath) => {
        output_path.push({
          name: path.name,
          source: {
            component_name: comp.name,
            output_name: path.name,
          },
        });
      });
    });

    data.input_path = input_path;
    data.output_path = output_path;
  }

  data.pipeline_components = components;

  if (orderId.value) {
    data.order_id = orderId.value;
    api.postTrainingBuilderPipelineDataspaceFederatedRun(data);
  } else {
    api.postTrainingBuilderPipeline(data);
  }
};
</script>

<style></style>
