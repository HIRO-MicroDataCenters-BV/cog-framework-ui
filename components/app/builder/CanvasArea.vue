<template>
  <div
    class="h-full bg-muted/20 relative"
    :class="{ readonly: props.readonly }"
  >
    <VueFlow
      v-model:nodes="nodes"
      v-model:edges="edges"
      class="w-full h-full"
      fit-view
      :nodes-draggable="!props.readonly"
      :nodes-connectable="!props.readonly"
      :edges-updatable="!props.readonly"
      :elements-selectable="!props.readonly"
      :delete-key-code="null"
      :multi-selection-key-code="null"
      @drop="onDrop"
      @dragover="onDragOver"
      @node-click="onNodeClick"
      @connect="onConnect"
      @edge-update="onEdgeUpdate"
      @edges-change="onEdgesChange"
      @edge-update-end="onEdgesChange"
    >
      <Background
        variant="dots"
        :gap="20"
        :size="0.75"
        color="hsl(var(--muted-foreground))"
      />
      <template #node-default="{ data, targetPosition, sourcePosition }">
        <div
          class="bg-card border border-border rounded-lg shadow-sm w-3xs min-h-[86px] overflow-hidden node-inner"
        >
          <SheetTrigger as-child>
            <div
              class="flex items-center flex-nowrap gap-2 border-b border-border px-4 py-2 text-card-foreground"
            >
              <span class="text-sm flex-auto overflow-hidden">{{
                data.label
              }}</span>
              <Badge v-if="data.status" :value="data.status" type="status" />
            </div>
            <div v-if="data.category" class="px-4 py-2">
              <p class="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon name="lucide:folder" class="w-3 h-3" />
                {{ data.category }}
              </p>
            </div>
          </SheetTrigger>
          <Handle
            type="target"
            :position="targetPosition"
            :class="[
              'bg-foreground rounded w-2 h-2 handle',
              props.readonly ? 'opacity-0' : 'opacity-20',
            ]"
          />
          <Handle
            type="source"
            :position="sourcePosition"
            :class="[
              'bg-foreground rounded w-2 h-2 handle',
              props.readonly ? 'opacity-0' : 'opacity-20',
            ]"
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
  useVueFlow,
} from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import '@vue-flow/core/dist/style.css';

import type { Node, Edge, Component } from '~/types/builder.types';

interface Props {
  nodes?: VueFlowNode[];
  edges?: VueFlowEdge[];
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  nodes: () => [],
  edges: () => [],
  readonly: false,
});

const nodes = ref<VueFlowNode[]>(props.nodes);
const edges = ref<VueFlowEdge[]>(props.edges);

watch(
  () => props.nodes,
  (newNodes) => {
    nodes.value = [...(newNodes || [])];
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
  requestDelete: [elements: (VueFlowNode | VueFlowEdge)[]];
}>();

const { getSelectedElements, addSelectedNodes, removeSelectedNodes } = useVueFlow();

const handleKeyDown = (event: KeyboardEvent) => {
  if (props.readonly) return;

  // Ignore if user is typing in an input
  if (
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLTextAreaElement
  ) {
    return;
  }

  if (event.key === 'Delete' || event.key === 'Backspace') {
    const selected = getSelectedElements.value;
    if (selected.length > 0) {
      emit('requestDelete', selected);
    }
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

const onDragOver = (event: DragEvent) => {
  if (props.readonly) return;
  event.preventDefault();
  event.dataTransfer!.dropEffect = 'copy';
};

const onDrop = (event: DragEvent) => {
  if (props.readonly) return;
  event.preventDefault();

  const data = event.dataTransfer?.getData('application/json');
  if (!data) return;

  try {
    const component = JSON.parse(data);
    const position = { x: event.offsetX - 60, y: event.offsetY - 20 };

    const existingLabels = nodes.value
      .map((node) => node.data?.label as string)
      .filter(Boolean);

    const baseName = component.name || 'Component';
    let counter = 1;
    let newLabel = baseName;

    while (existingLabels.includes(newLabel)) {
      newLabel = `${baseName}_${counter}`;
      counter++;
    }

    const newNode: VueFlowNode = {
      id: `compoent-${component.id}-${Date.now()}`,
      type: 'default',
      position,
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
      data: {
        label: newLabel,
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

const onNodeClick = (event: { node: VueFlowNode | null }) => {
  emit('nodeClick', event.node);
};

const onConnect = (connection: { source: string; target: string }) => {
  if (props.readonly) return;

  const size = 23;
  const color = 'hsl(var(--muted-foreground))';

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
  };

  edges.value.push(newEdge);
  emit('connect', newEdge);
  emit('update', nodes.value, edges.value);
};

const onEdgesChange = () => {
  setTimeout(() => {
    emit('update', nodes.value, edges.value);
  }, 100);
};

const onEdgeUpdate = (edgeUpdateEvent: { edge: VueFlowEdge }) => {
  if (props.readonly) return;

  emit('edgeUpdate', edgeUpdateEvent.edge);
  emit('update', nodes.value, edges.value);
};
</script>

<style scoped>
.readonly .vue-flow__node {
  cursor: pointer !important;
}

.readonly .vue-flow__node:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.readonly .vue-flow__edge {
  pointer-events: none;
}

.readonly .vue-flow__handle {
  pointer-events: none;
}
</style>
