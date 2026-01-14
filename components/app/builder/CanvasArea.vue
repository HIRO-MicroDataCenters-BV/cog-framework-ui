<template>
  <div class="h-full bg-muted/20 relative">
    <VueFlow
      v-model:nodes="nodes"
      v-model:edges="edges"
      class="w-full h-full"
      fit-view
      @drop="onDrop"
      @dragover="onDragOver"
      @node-click="onNodeClick"
      @connect="onConnect"
      @edge-update="onEdgeUpdate"
      @edges-change="onEdgesChange"
      @edge-update-end="onEdgesChange"
    >
      <template #node-default="{ data, targetPosition, sourcePosition }">
        <div
          class="bg-white border rounded-lg shadow-sm w-3xs min-h-[86px] overflow-hidden node-inner"
        >
          <SheetTrigger as-child>
            <div
              class="flex items-center flex-nowrap gap-2 border-b px-4 py-2 text-gray-700"
            >
              <span class="text-sm flex-auto overflow-hidden">{{
                data.label
              }}</span>
              <Badge v-if="data.status" :status="data.status"></Badge>
            </div>
            <div v-if="data.category" class="px-4 py-2">
              <p>{{ $t(`builder.category`) }} {{ data.category }}</p>
            </div>
          </SheetTrigger>
          <Handle
            type="target"
            :position="targetPosition"
            class="bg-black dark:bg-white rounded w-2 h-2 opacity-20 handle"
          />
          <Handle
            type="source"
            :position="sourcePosition"
            class="bg-black dark:bg-white rounded w-2 h-2 opacity-20 handle"
          />
        </div>
      </template>
    </VueFlow>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, type CSSProperties } from 'vue';
import {
  VueFlow,
  Position,
  Handle,
  MarkerType,
  type Node as VueFlowNode,
  type Edge as VueFlowEdge,
} from '@vue-flow/core';
import '@vue-flow/core/dist/style.css';

import type { Node, Edge, Component } from '~/types/builder.types';

interface Props {
  nodes?: VueFlowNode[];
  edges?: VueFlowEdge[];
}

const props = withDefaults(defineProps<Props>(), {
  nodes: () => [],
  edges: () => [],
});

const nodes = ref<VueFlowNode[]>(props.nodes);
const edges = ref<VueFlowEdge[]>(props.edges);

watch(
  () => props.nodes,
  (newNodes, oldNodes) => {
    console.log('CanvasArea - received new nodes:', newNodes);
    console.log('CanvasArea - old nodes:', oldNodes);
    console.log('CanvasArea - nodes changed?', newNodes !== oldNodes);

    // Force reactivity by creating new array
    nodes.value = [...(newNodes || [])];
    console.log('CanvasArea - local nodes.value updated to:', nodes.value);
  },
  { deep: true, immediate: true },
);

watch(
  () => props.edges,
  (newEdges) => {
    edges.value = newEdges || [];
  },
  { deep: true, immediate: true },
);

const emit = defineEmits<{
  nodeClick: [node: VueFlowNode | null];
  connect: [edge: VueFlowEdge];
  edgeUpdate: [edge: VueFlowEdge];
  update: [nodes: VueFlowNode[], edges: VueFlowEdge[]];
  error: [errorKey: string, data?: Record<string, unknown>];
}>();

const onDragOver = (event: DragEvent) => {
  event.preventDefault();
  event.dataTransfer!.dropEffect = 'copy';
};

const onDrop = (event: DragEvent) => {
  event.preventDefault();

  const data = event.dataTransfer?.getData('application/json');
  if (!data) return;

  try {
    const component = JSON.parse(data);
    const position = { x: event.offsetX - 60, y: event.offsetY - 20 };

    const newNode: VueFlowNode = {
      id: `compoent-${component.id}-${Date.now()}`,
      type: 'default',
      position,
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
      data: {
        label: generateUniqueName([
          ...nodes.value.map((node) => node.data.label),
          component.name,
        ]),
        status: component.status,
        category: component.category,
        component: component,
      },
    };

    nodes.value.push(newNode);
    emit('update', nodes.value, edges.value);
  } catch (error) {
    console.error('Error parsing dropped component:', error);
  }
};

const validateTypeCompatibility = (
  sourceComponent: Component,
  targetComponent: Component,
): { isValid: boolean; sourceType?: string; targetType?: string } => {
  const sourceOutputType = sourceComponent.output_path[0]?.type;
  const targetInputType = targetComponent.input_path[0]?.type;

  if (!sourceOutputType || !targetInputType) {
    return {
      isValid: false,
      sourceType: sourceOutputType,
      targetType: targetInputType,
    };
  }

  const isCompatible = sourceOutputType === targetInputType;

  return {
    isValid: isCompatible,
    sourceType: sourceOutputType,
    targetType: targetInputType,
  };
};

const onNodeClick = (event: { node: VueFlowNode | null }) => {
  const node = event.node;
  emit('nodeClick', node);
};

const onConnect = (connection: { source: string; target: string }) => {
  const size = 23;
  const color = '#9BB2BB';
  console.log('connection', connection);

  const existingIncomingEdges = edges.value.filter(
    (edge) => edge.target === connection.target,
  );

  if (existingIncomingEdges.length > 0) {
    emit('error', 'multiple_inputs_not_allowed');
    return;
  }

  const existingOutgoingEdges = edges.value.filter(
    (edge) => edge.source === connection.source,
  );

  if (existingOutgoingEdges.length > 0) {
    emit('error', 'multiple_outputs_not_allowed');
    return;
  }

  const sourceNode = nodes.value.find((node) => node.id === connection.source);
  const targetNode = nodes.value.find((node) => node.id === connection.target);

  if (sourceNode && targetNode) {
    const sourceComponent = sourceNode.data?.component as Component;
    const targetComponent = targetNode.data?.component as Component;

    if (sourceComponent && targetComponent) {
      const validation = validateTypeCompatibility(
        sourceComponent,
        targetComponent,
      );

      if (!validation.isValid) {
        emit('error', 'type_mismatch', {
          sourceType: validation.sourceType,
          targetType: validation.targetType,
        });
        return;
      }
    }
  }
  const newEdge: VueFlowEdge = {
    id: `edge-${connection.source}-${connection.target}`,
    source: connection.source,
    target: connection.target,
    style: {
      stroke: color,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: size,
      height: size,
      color: color,
    },
    // sourceNode and targetNode are not part of Vue Flow Edge type
    // but we need them for our API, so we'll add them as additional properties
  };

  edges.value.push(newEdge);
  emit('connect', newEdge);
  emit('update', nodes.value, edges.value);
};

const onEdgesChange = () => {
  console.log('onEdgesChange', edges);
  setTimeout(() => {
    emit('update', nodes.value, edges.value);
  }, 100);
};

const onEdgeUpdate = (edgeUpdateEvent: { edge: VueFlowEdge }) => {
  emit('edgeUpdate', edgeUpdateEvent.edge);
  emit('update', nodes.value, edges.value);
};
</script>

<style scoped></style>
