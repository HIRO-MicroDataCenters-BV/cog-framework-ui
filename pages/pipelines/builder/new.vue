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
    />
  </div>
</template>

<script lang="ts" setup>
import type { Node } from '~/types/builder.types';
import { useNodeValidation } from '~/composables/useNodeValidation';
import PipelineBuilderSheet from '~/components/app/PipelineBuilderSheet.vue';

const route = useRoute();
const { setPage, page } = useApp();
const { nodes, selectedNode, selectNode } = usePipelineBuilder();
const { getValidationStatus } = useNodeValidation();

const builderRef = ref();

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

const pipelineData = computed(
  () => page.value.data?.builder?.pipelineData || null,
);

// Get order_id from query params (for federated pipeline from dataspace)
const orderId = computed(() => route.query.order_id as string | undefined);

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
