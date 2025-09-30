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
              <Badge v-if="data.status" status="pending"></Badge>
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
import { ref, type CSSProperties } from 'vue';
import { VueFlow, Position, Handle, MarkerType } from '@vue-flow/core';
import '@vue-flow/core/dist/style.css';

import type { Node, Edge } from '~/types/builder.types';

const nodes = ref<Node[]>([]);
const edges = ref<Edge[]>([]);

const emit = defineEmits<{
  nodeClick: [node: Node | null];
  connect: [edge: Edge];
  edgeUpdate: [edge: Edge];
  update: [nodes: Node[], edges: Edge[]];
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

    const newNode: Node = {
      id: `compoent-${component.id}-${Date.now()}`,
      type: 'default',
      position,
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
      data: {
        label: component.name,
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

const onNodeClick = (event: unkown) => {
  const node = event.node;
  emit('nodeClick', node);
};

const onConnect = (connection: unkown) => {
  const size = 23;
  const color = '#9BB2BB';
  console.log('connection', connection);
  const sourceNode = nodes.value.find((node) => node.id === connection.source);
  const targetNode = nodes.value.find((node) => node.id === connection.target);
  const newEdge: Edge = {
    id: `edge-${connection.source}-${connection.target}`,
    source: connection.source,
    target: connection.target,
    style: {
      stroke: color,
    },
    sourceNode: sourceNode,
    targetNode: targetNode,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: size,
      height: size,
      color: color,
    },
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

const onEdgeUpdate = (edge: Edge) => {
  emit('edgeUpdate', edge);
  emit('update', nodes.value, edges.value);
};
</script>

<style scoped></style>
