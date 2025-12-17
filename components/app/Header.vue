<template>
  <header
    class="border-b w-full flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12"
  >
    <div class="flex items-center gap-2 px-4 justify-between w-full">
      <div class="flex items-center gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem class="hidden md:block">
              <NuxtLink :to="`${baseUrl}${page.section}`">
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
          <Button @click="runPipeline"
            ><Icon name="lucide:save" class="w-4 h-4" /><span>{{
              $t('action.save')
            }}</span></Button
          >
        </div>
      </div>
    </div>
  </header>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { Edge, Component } from '~/types/builder.types';
import { Form, FormField, FormItem, FormControl } from '~/components/ui/form';
import { pipelineNameSchema } from '~/schemas/builder-form.schema';

const { page } = useApp();
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
  inputs: string[];
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
      const id = String(component?.id || '');
      const name = node?.data?.label || component?.name || '';
      const input_path = component?.input_path || [];
      const output_path = component?.output_path || [];

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
