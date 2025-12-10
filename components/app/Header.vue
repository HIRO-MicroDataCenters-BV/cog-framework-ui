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

interface PipelineComponent {
  id: string;
  name: string;
  inputs: string[];
  input_path: PipelinePath[];
  output_path: PipelinePath[];
}

interface PipelinePath {
  name: string;
  type: string;
}

// Get order_id from page data (passed from dataspace)
const orderId = computed(() => page.value.data?.orderId as string | undefined);

const runPipeline = () => {
  const builder = page.value.data?.builder;
  if (!builder) return;

  interface PipelineData {
    name: string;
    pipeline_components: PipelineComponent[];
    input_path: PipelinePath[];
    output_path: PipelinePath[];
    order_id?: string;
  }

  const data: PipelineData = {
    name: builder.name,
    pipeline_components: [] as PipelineComponent[],
    input_path: [] as PipelinePath[],
    output_path: [] as PipelinePath[],
  };

  const nodes = builder?.nodes?.map((node): PipelineComponent => {
    const component = node?.data?.component as Component;
    const result: PipelineComponent = {
      id: String(component?.id || ''),
      name: node?.data?.label || component?.name || '',
      inputs: [],
      input_path: component?.input_path || [],
      output_path: component?.output_path || [],
    };

    const input_path = component.input_path;
    input_path.forEach((path: PipelinePath) => {
      result.inputs.push(path.name as string);
    });
    const id = node?.id;
    const edges = builder?.edges?.filter((edge: Edge) => edge.target === id);
    const inputs: string[] = [];

    edges?.forEach((edge) => {
      const sourceName = edge?.sourceNode?.data?.label + '';
      inputs.push(`${sourceName}.output`);
    });

    result.inputs = [...result.inputs, ...inputs];
    return result;
  });

  const components = nodes.map((node) => {
    return {
      id: node.id,
      name: node.name,
      inputs: node.inputs,
      input_path: node.input_path,
      output_path: node.output_path,
    };
  });

  const input_path: PipelinePath[] = [];
  const output_path: PipelinePath[] = [];

  nodes.forEach((node) => {
    input_path.push(...node.input_path);
    output_path.push(...node.output_path);
  });
  data.input_path = input_path;
  data.output_path = output_path;
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
