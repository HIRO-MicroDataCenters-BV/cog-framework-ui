<template>
  <div class="h-full bg-muted/20 relative">
    <VueFlow
      v-model:nodes="nodes"
      v-model:edges="edges"
      class="w-full h-full"
      @drop="onDrop"
      @dragover="onDragOver"
      @node-click="onNodeClick"
      @connect="onConnect"
      @edge-update="onEdgeUpdate"
      fit-view
    >
      <template #node-default="{ data }">
        <div
          class="px-4 py-2 bg-background border rounded-lg shadow-sm min-w-[120px]"
        >
          <div class="flex items-center gap-2">
            <Icon :name="data.icon" class="w-4 h-4" />
            <span class="text-sm font-medium">{{ data.label }}</span>
          </div>
        </div>
      </template>
    </VueFlow>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { VueFlow } from '@vue-flow/core';
import '@vue-flow/core/dist/style.css';

interface Node {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    icon: string;
    [key: string]: unknown;
  };
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

const nodes = ref<Node[]>([]);
const edges = ref<Edge[]>([]);

const emit = defineEmits<{
  nodeClick: [node: Node | null];
  connect: [edge: Edge];
  edgeUpdate: [edge: Edge];
}>();

function onDragOver(event: DragEvent) {
  event.preventDefault();
  event.dataTransfer!.dropEffect = 'copy';
}

function onDrop(event: DragEvent) {
  event.preventDefault();

  const data = event.dataTransfer?.getData('application/json');
  if (!data) return;

  try {
    const component = JSON.parse(data);
    const position = { x: event.offsetX - 60, y: event.offsetY - 20 };

    const newNode: Node = {
      id: `${component.id}-${Date.now()}`,
      type: component.id,
      position,
      data: {
        label: component.name,
        icon: component.icon,
        componentType: component.type,
      },
    };

    nodes.value.push(newNode);
  } catch (error) {
    console.error('Error parsing dropped component:', error);
  }
}

function onNodeClick(event: any) {
  const node = event.node;
  emit('nodeClick', node);
}

function onConnect(connection: any) {
  const newEdge: Edge = {
    id: `edge-${connection.source}-${connection.target}`,
    source: connection.source,
    target: connection.target,
  };

  edges.value.push(newEdge);
  emit('connect', newEdge);
}

function onEdgeUpdate(edge: any) {
  emit('edgeUpdate', edge);
}
</script>
