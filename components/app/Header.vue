<template>
  <header
    class="border-b w-full flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12"
  >
    <div class="flex items-center gap-2 px-4 justify-between w-full">
      <div class="flex items-center gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem class="hidden md:block">
              <BreadcrumbLink :href="`${$config.app.baseURL}${page.section}`">
                {{ $t(`menu.${page.section}`) }}
              </BreadcrumbLink>
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
          <Button @click="runPipeline"
            ><Icon name="lucide:save" class="w-4 h-4" /><span>{{
              $t('action.save')
            }}</span></Button
          >
        </div>
        <!-- <AppColorModeSwitch /> -->
      </div>
    </div>
  </header>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { Edge, Component } from '~/types/builder.types';
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from '~/components/ui/form';
import { pipelineNameSchema } from '~/schemas/builder-form.schema';

const { page } = useApp();
const api = useApi();

// Safe access to pipeline name
const pipelineName = computed({
  get: () => page.value.data?.builder?.name || '',
  set: (value: string) => {
    if (page.value.data?.builder) {
      page.value.data.builder.name = value;
    }
  },
});

/*
{
  "name": "example_pipeline",
  "pipeline_components": [
    {
      "id": "component_id1",
      "name": "component_id_name1",
      "inputs": ["file"],
    },
    {
      "id": "component_id2",
      "name": "component_id_name2",
      "inputs": ["component_id1.output"],
    },
    {
      "id": "component_id3",
      "name": "component_id_name3",
      "inputs": ["component_id2.output"],
    },
    {
      "id": "component_id4",
      "name": "component_id_name4",
      "inputs": ["component_id1.output", "component_id2.output", "isvc"],
    }
  ],
  "input_path": [
    {"name": "file", "type": "string"},
    {"name": "isvc", "type": "string"}
  ],
  "output_path": [
    {"name": "final_serving_output", "type": "artifact"}
  ]
}
*/

// Component input/output path (per format.md)
interface ComponentPath {
  name: string;
  type: string;
  description?: string;
  default?: unknown;
  optional?: boolean;
}

// Top-level input path (per format.md)
interface TopLevelInputPath {
  name: string;
  type: string;
  default?: unknown;
}

// Top-level output path (per format.md) - has source object
interface TopLevelOutputPath {
  name: string;
  source: {
    component_name: string;
    output_name: string;
  };
}

// Regular pipeline component (with inputs)
interface RegularPipelineComponent {
  id: string;
  name: string;
  inputs: string[];
  input_path: ComponentPath[];
  output_path: ComponentPath[];
}

// Federated pipeline component (per format.md)
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

// Get order_id from page data (passed from dataspace)
const orderId = computed(() => page.value.data?.orderId as string | undefined);

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

  // Build components based on whether it's federated (with order_id) or regular pipeline
  const components =
    builder?.nodes?.map((node) => {
      const component = node?.data?.component as Component;
      const id = String(component?.id || '');
      const name = node?.data?.label || component?.name || '';
      const input_path = component?.input_path || [];
      const output_path = component?.output_path || [];

      // For federated dataspace (with order_id), use format.md format
      if (orderId.value) {
        return {
          id,
          name,
          input_path,
          output_path,
          component_file: component?.component_file || null,
          category: component?.category || null,
          creator: component?.creator || null,
        };
      }

      // For regular pipeline, include inputs
      const inputs: string[] = [];
      input_path.forEach((path: ComponentPath) => {
        inputs.push(path.name as string);
      });

      const nodeId = node?.id;
      const edges = builder?.edges?.filter(
        (edge: Edge) => edge.target === nodeId,
      );
      edges?.forEach((edge) => {
        const sourceName = edge?.sourceNode?.data?.label + '';
        inputs.push(`${sourceName}.output`);
      });

      return {
        id,
        name,
        inputs,
        input_path,
        output_path,
      };
    }) || [];

  // Build top-level input_path and output_path based on format
  if (orderId.value) {
    // Federated format (per format.md):
    // - input_path: collect all unique inputs with defaults
    // - output_path: format with source object
    const inputPathMap = new Map<string, TopLevelInputPath>();
    const outputPathList: TopLevelOutputPath[] = [];

    components.forEach((comp) => {
      const compName = comp.name;

      // Collect input_path items with defaults
      comp.input_path.forEach((path: ComponentPath) => {
        if (!inputPathMap.has(path.name)) {
          inputPathMap.set(path.name, {
            name: path.name,
            type: path.type,
            default: path.default,
          });
        }
      });

      // Build output_path with source object
      comp.output_path.forEach((path: ComponentPath) => {
        outputPathList.push({
          name: path.name,
          source: {
            component_name: compName,
            output_name: path.name,
          },
        });
      });
    });

    data.input_path = Array.from(inputPathMap.values());
    data.output_path = outputPathList;
  } else {
    // Regular format - just copy paths
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

  // If order_id exists, use federated dataspace endpoint
  if (orderId.value) {
    data.order_id = orderId.value;
    api.postTrainingBuilderPipelineDataspaceFederatedRun(data);
  } else {
    api.postTrainingBuilderPipeline(data);
  }
};
</script>

<style></style>
