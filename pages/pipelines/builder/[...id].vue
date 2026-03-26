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

    <ManageParametersSheet
      :open="showManageParameters"
      :parameters="pipelineParameters"
      :all-nodes="enrichedNodes"
      :readonly="false"
      @update:open="showManageParameters = $event"
      @update:parameters="handleUpdateParameters"
    />
  </div>
</template>

<script lang="ts" setup>
import type { Node, PipelineInputParam } from '~/types/builder.types';
import { useNodeValidation } from '~/composables/useNodeValidation';
import PipelineBuilderSheet from '~/components/app/builder/PipelineBuilderSheet.vue';
import ManageParametersSheet from '~/components/app/builder/ManageParametersSheet.vue';

const { setPage, page } = useApp();
const {
  nodes,
  selectedNode,
  selectNode,
  pipelineParameters,
  addPipelineParameter,
  updatePipelineParameters,
} = usePipelineBuilder();
const { getValidationStatus } = useNodeValidation();
const { triggerManageParameters } = useBuilderEvents();

const builderRef = ref();
const showManageParameters = ref(false);

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

// Handle create parameter
const handleCreateParameter = (parameter: PipelineInputParam) => {
  addPipelineParameter(parameter);
};

// Handle manage parameters
const handleManageParameters = () => {
  showManageParameters.value = true;
};

// Handle update parameters from manage panel
const handleUpdateParameters = (params: PipelineInputParam[]) => {
  updatePipelineParameters(params);
};

// Watch for manage parameters trigger from Header component
watch(triggerManageParameters, () => {
  showManageParameters.value = true;
});

setPage({
  section: 'pipelines_builder',
});
</script>

<style></style>
