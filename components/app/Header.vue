<template>
  <header
    class="border-b flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12"
  >
    <div class="flex items-center gap-2 px-4 justify-between w-full">
      <div class="flex items-center gap-2">
        <SidebarTrigger class="-ml-1" />
        <Separator orientation="vertical" class="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem class="hidden md:block">
              <BreadcrumbLink href="../">
                {{ $t(`menu.${page.section}`) }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <template v-if="page.title != ''">
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
import type { Edge, Component, Node } from '~/types/builder.types';
import { detectCycle, validateAllComponents } from '~/utils/builder-validation';
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

console.log('page', page);

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

const runPipeline = () => {
  console.log('runPipeline', page.value.data?.builder);

  const builder = page.value.data?.builder;
  if (!builder) return;
  
  const nodes = (builder.nodes || []) as Node[];
  const toaster = useToaster();
  
  // Check for cycles
  if (detectCycle(nodes)) {
    toaster.show('error', 'message.error.cycle_detected', {
      duration: 5000,
    });
    return;
  }
  
  // Check for validation errors
  const validationErrors = validateAllComponents(nodes, []);
  if (validationErrors.length > 0) {
    const errorMessage = validationErrors
      .map(e => `${e.componentName}: ${e.error}`)
      .join(', ');
    toaster.show('error', 'message.error.validation_errors', {
      duration: 5000,
    });
    console.error('Validation errors:', validationErrors);
    return;
  }
  
  console.log('builder', builder);
  const data = {
    name: builder.name,
    pipeline_components: [] as PipelineComponent[],
    input_path: [] as PipelinePath[],
    output_path: [] as PipelinePath[],
  };

  const pipelineNodes = builder?.nodes?.map((node): PipelineComponent => {
    console.log('node', node);
    const component = node?.data?.component as Component;
    const result: PipelineComponent = {
      id: String(component?.id || ''),
      name: node?.data?.label || component?.name || '',
      inputs: [],
      input_path: component?.input_path || [],
      output_path: component?.output_path || [],
    };

    console.log('component', component);
    const input_path = component.input_path;
    input_path.forEach((path: PipelinePath) => {
      result.inputs.push(path.name as string);
    });
    const id = node?.id;
    const edges = builder?.edges?.filter((edge: Edge) => edge.target === id);
    const inputs: string[] = [];

    edges?.forEach((edge) => {
      console.log('edge', edge);
      const sourceName = edge?.sourceNode?.data?.label + '';
      inputs.push(`${sourceName}.output`);
    });

    result.inputs = [...result.inputs, ...inputs];
    return result;
  });

  const components = pipelineNodes.map((node) => {
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

  pipelineNodes.forEach((node) => {
    input_path.push(...node.input_path);
    output_path.push(...node.output_path);
  });
  data.input_path = input_path;
  data.output_path = output_path;
  data.pipeline_components = components;

  console.log('data', data);

  console.log('postTrainingBuilderPipelineComponent');
  api.postTrainingBuilderPipelineComponent(data).then((res: unknown) => {
    console.log('res', res);
    toaster.show('success', 'message.success.pipeline_saved', {
      duration: 3000,
    });
  }).catch((error: unknown) => {
    console.error('Pipeline save error:', error);
    toaster.show('error', 'message.error.pipeline_save_failed', {
      duration: 5000,
    });
  });
};
</script>

<style></style>
