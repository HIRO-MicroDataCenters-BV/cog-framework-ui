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
            class="bg-black dark:bg-white rounded"
          />
          <Handle
            type="source"
            :position="sourcePosition"
            class="bg-black dark:bg-white rounded"
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

interface Node {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    status: string;
    [key: string]: unknown;
  };
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type?: string;
  color?: string;
  style?: CSSProperties;
  markerEnd?: {
    type: MarkerType;
    color?: string;
    width?: number;
    height?: number;
  };
}

const nodes = ref<Node[]>([]);
const edges = ref<Edge[]>([]);

const emit = defineEmits<{
  nodeClick: [node: Node | null];
  connect: [edge: Edge];
  edgeUpdate: [edge: Edge];
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

    console.log(newNode);
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
  const color = '#000';
  const newEdge: Edge = {
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
  };

  edges.value.push(newEdge);
  emit('connect', newEdge);
};

const onEdgeUpdate = (edge: unkown) => {
  emit('edgeUpdate', edge);
};
</script>

<style scoped></style>
