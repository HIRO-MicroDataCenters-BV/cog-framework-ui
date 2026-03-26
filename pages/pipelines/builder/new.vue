<template>
  <div class="h-[calc(100svh-64px)]">
    <AppBuilder ref="builderRef" :readonly="false" />

    <PipelineBuilderSheet
      :open="!!selectedNode"
      :readonly="false"
      :selected-node="selectedNode"
      :all-nodes="enrichedNodes"
      :pipeline-data="pipelineData"
      @update:open="(v) => !v && selectNode(null)"
      @update-node="
        (id, updates) => {
          builderRef?.onUpdateNode(id, updates);
        }
      "
      @delete-node="
        (id) => {
          builderRef?.onDeleteNode(id);
        }
      "
      @rename-component="
        (id, oldName, newName) => {
          builderRef?.onRenameComponent(id, oldName, newName);
        }
      "
      @create-parameter="handleCreateParameter"
      @manage-parameters="handleManageParameters"
    />
  </div>
</template>

<script lang="ts" setup>
import type { Node, PipelineInputParam } from '~/types/builder.types';
import { useNodeValidation } from '~/composables/useNodeValidation';
import PipelineBuilderSheet from '~/components/app/builder/PipelineBuilderSheet.vue';

const route = useRoute();
const { setPage, page } = useApp();
const {
  nodes,
  selectedNode,
  selectNode,
  pipelineParameters,
  addPipelineParameter,
} = usePipelineBuilder();
const { getValidationStatus } = useNodeValidation();

const builderRef = ref();

// Enrich nodes with validation status
const enrichedNodes = computed(() => {
  return nodes.value.map((node) => ({
    ...node,
    data: {
      ...node.data,
      status: getValidationStatus(node, nodes.value),
    },
  }));
});

const pipelineData = computed(() => {
  const baseData = page.value.data?.builder?.pipelineData || {};
  // Include pipeline parameters in the runtime_config for BuilderNodeProperties to access
  return {
    ...baseData,
    runtime_config: {
      ...((baseData as any)?.runtime_config || {}),
      parameters: pipelineParameters.value.reduce(
        (acc, param) => {
          acc[param.name] = param.default || '';
          return acc;
        },
        {} as Record<string, any>,
      ),
    },
  };
});

// Get order_id from query params (for federated pipeline from dataspace)
const orderId = computed(() => route.query.order_id as string | undefined);

// Handle create parameter
const handleCreateParameter = (parameter: PipelineInputParam) => {
  addPipelineParameter(parameter);
};

// Handle manage parameters
const handleManageParameters = () => {
  // TODO: Open manage parameters panel
  console.log('Manage parameters clicked');
};

// Watch order_id and update page data reactively
// immediate: true ensures it runs on mount with current value
watch(
  orderId,
  (newOrderId) => {
    setPage({
      section: 'pipelines_builder',
      data: {
        builder: {
          name: '',
          nodes: [],
          edges: [],
        },
        orderId: newOrderId,
      },
    });
  },
  { immediate: true },
);
</script>

<style></style>
