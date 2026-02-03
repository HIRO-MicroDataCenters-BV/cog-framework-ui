<template>
  <header
    class="border-b w-full flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12"
  >
    <div class="flex items-center gap-2 px-4 justify-between w-full">
      <div class="flex items-center gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem class="hidden md:block">
              <NuxtLink
                :to="`/${page.section == 'pipelines_builder' ? 'pipelines' : page.section}`"
              >
                {{ $t(`menu.${page.section}`) }}
              </NuxtLink>
            </BreadcrumbItem>
            <template v-if="page.title !== ''">
              <BreadcrumbSeparator />
              <BreadcrumbItem class="hidden md:block">{{
                page.title
              }}</BreadcrumbItem>
            </template>
            <template v-if="page.section == 'pipelines_builder'">
              <BreadcrumbItem class="hidden md:block relative">
                <Form :validation-schema="pipelineNameSchema">
                  <FormField
                    v-slot="{ componentField }"
                    type="text"
                    name="pipeline_name"
                  >
                    <FormItem>
                      <FormControl>
                        <Input
                          v-bind="componentField"
                          v-model="pipelineName"
                          type="text"
                          :placeholder="$t('placeholder.pipeline_name')"
                        />
                      </FormControl>
                    </FormItem>
                  </FormField>
                </Form>
              </BreadcrumbItem>
            </template>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div class="flex items-center gap-2 ml-auto">
        <div v-if="page.section == 'pipelines_builder'">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button :disabled="!canSave" @click="runPipeline">
                  <Icon name="lucide:save" class="w-4 h-4" />
                  <span>{{ $t('action.save_and_run') }}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent v-if="!canSave" class="max-w-xs">
                <div class="text-sm">
                  <ul class="list-disc list-inside space-y-1">
                    <li v-for="error in validationErrors" :key="error">
                      {{ error }}
                    </li>
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
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
        return {
          id: uuid,
          name,
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
