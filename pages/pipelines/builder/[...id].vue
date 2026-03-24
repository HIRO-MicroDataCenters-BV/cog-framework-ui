<template>
  <div class="h-[calc(100svh-64px)]">
    <AppBuilder
      ref="builderRef"
      :readonly="false"
      @node-click="
        (node) => {
          isPropertiesSheetOpen = !!node;
        }
      "
    />

    <PipelineBuilderSheet
      :open="isPropertiesSheetOpen"
      :readonly="false"
      :selected-node="selectedNode"
      :all-nodes="enrichedNodes"
      :pipeline-data="pipelineData"
      @update:open="(v) => (isPropertiesSheetOpen = v)"
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
    />
  </div>
</template>

<script lang="ts" setup>
import type { Node } from '~/types/builder.types';
import { useNodeValidation } from '~/composables/useNodeValidation';

const { setPage, page } = useApp();
const { nodes, selectedNode } = usePipelineBuilder();
const { getValidationStatus } = useNodeValidation();

const builderRef = ref();
const isPropertiesSheetOpen = ref(false);

// Enrich nodes with validation status
const enrichedNodes = computed(() => {
  return nodes.value.map((node) => ({
    ...node,
    data: {
      ...node.data,
      status: getValidationStatus(node),
    },
  }));
});

const pipelineData = computed(() => page.value.data?.builder?.pipelineData || null);

setPage({
  section: 'pipelines_builder',
});
</script>

<style></style>
