<template>
  <div
    class="h-full bg-muted/20 relative"
    :class="{ readonly: props.readonly }"
  >
    <VueFlow
      :nodes="props.nodes"
      :edges="props.edges"
      class="w-full h-full"
      fit-view
      :nodes-draggable="!props.readonly"
      :nodes-connectable="!props.readonly"
      :edges-updatable="!props.readonly"
      :elements-selectable="!props.readonly"
      :delete-key-code="null"
      :multi-selection-key-code="null"
      :default-edge-options="{
        markerEnd: { type: MarkerType.ArrowClosed, width: 8, height: 8 },
      }"
      :is-valid-connection="isValidConnectionWrapper"
      @drop="onDrop"
      @dragover="onDragOver"
      @node-click="onNodeClick"
      @connect="onConnect"
      @edge-update="onEdgeUpdate"
      @edges-change="onEdgesChange"
      @edge-update-end="onEdgesChange"
      @node-drag-stop="onNodeDragStop"
      @connect-start="onConnectStart"
      @connect-end="onConnectEnd"
    >
      <template #node-default="{ id, data }">
        <TooltipProvider>
          <div
            class="bg-card border-none w-3xs min-h-[86px] overflow-visible kenney-node relative"
            :class="[
              props.readonly ? '' : 'cursor-grab active:cursor-grabbing',
            ]"
            :style="{
              border: `2px solid ${getCategoryColor(data.category)}`,
              borderRadius: '0.75rem',
            }"
            :data-nodeid="data.id || data.component.id"
          >
            <!-- Input Handles (Top) -->
            <div
              class="absolute top-0 left-0 right-0 h-0 flex justify-center z-10"
            >
              <div
                v-for="(input, index) in (
                  data.component.input_path || []
                ).filter((i: any) => isConnectableType(i.type))"
                :key="`input-${input.name}`"
                class="absolute"
                :style="{
                  left: calculateHandlePosition(
                    Number(index),
                    (data.component.input_path || []).filter((i: any) =>
                      isConnectableType(i.type),
                    ).length,
                  ),
                }"
              >
                <Handle
                  :id="input.name"
                  type="target"
                  :position="Position.Top"
                  class="!w-3 !h-3 !rounded-full !border-2 transition-all duration-200 hover:scale-125"
                  :class="[props.readonly ? 'opacity-0' : '']"
                  :style="{
                    borderColor: getTypeColor(input.type),
                    color: getTypeColor(input.type),
                    backgroundColor: isHandleConnected(id, input.name, 'target')
                      ? getTypeColor(input.type)
                      : 'hsl(var(--background))',
                  }"
                  :data-handleid="input.name"
                >
                  <Tooltip v-if="!props.readonly">
                    <TooltipTrigger as-child>
                      <div
                        class="absolute inset-0 flex items-center justify-center pointer-events-none"
                      >
                        <!-- Tiny dot icon inside handle if needed, or just color -->
                      </div>
                    </TooltipTrigger>
                    <TooltipContent class="text-xs">
                      <div class="font-medium">{{ input.name }}</div>
                      <div
                        class="text-muted-foreground flex items-center gap-1"
                      >
                        <Icon :name="getTypeIcon(input.type)" class="w-3 h-3" />
                        {{ input.type }}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </Handle>
              </div>
            </div>

            <!-- Header & Content -->
            <SheetTrigger as-child>
              <div class="cursor-pointer">
                <div
                  class="flex items-center flex-nowrap gap-2 border-b border-border px-4 py-2 text-card-foreground bg-muted/30"
                >
                  <span
                    class="text-sm flex-auto overflow-hidden font-medium truncate"
                    >{{ data.label }}</span
                  >
                  <span
                    v-if="data.status"
                    class="text-xs px-2 py-0.5 rounded-md uppercase"
                    :style="{
                      backgroundColor: getStatusConfig(data.status).color,
                      color: 'white',
                    }"
                  >
                    {{ data.status }}
                  </span>
                </div>
                <div v-if="data.category" class="px-4 py-3">
                  <p
                    class="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-medium"
                  >
                    <Icon name="lucide:folder" class="w-3 h-3" />
                    {{ data.category }}
                  </p>
                </div>
              </div>
            </SheetTrigger>

            <!-- Output Handles (Bottom) -->
            <div
              class="absolute bottom-0 left-0 right-0 h-0 flex justify-center z-10"
            >
              <div
                v-for="(output, index) in (
                  data.component.output_path || []
                ).filter((o: any) => isConnectableType(o.type))"
                :key="`output-${output.name}`"
                class="absolute"
                :style="{
                  left: calculateHandlePosition(
                    Number(index),
                    (data.component.output_path || []).filter((o: any) =>
                      isConnectableType(o.type),
                    ).length,
                  ),
                }"
              >
                <Handle
                  :id="output.name"
                  type="source"
                  :position="Position.Bottom"
                  class="!w-3 !h-3 !rounded-full !border-2 transition-all duration-200 hover:scale-125"
                  :class="[props.readonly ? 'opacity-0' : '']"
                  :style="{
                    borderColor: getTypeColor(output.type),
                    color: getTypeColor(output.type),
                    backgroundColor: isHandleConnected(
                      id,
                      output.name,
                      'source',
                    )
                      ? getTypeColor(output.type)
                      : 'hsl(var(--background))',
                  }"
                  :data-handleid="output.name"
                >
                  <Tooltip v-if="!props.readonly">
                    <TooltipTrigger as-child>
                      <div class="w-full h-full"></div>
                    </TooltipTrigger>
                    <TooltipContent class="text-xs">
                      <div class="font-medium">{{ output.name }}</div>
                      <div
                        class="text-muted-foreground flex items-center gap-1"
                      >
                        <Icon
                          :name="getTypeIcon(output.type)"
                          class="w-3 h-3"
                        />
                        {{ output.type }}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </Handle>
              </div>
            </div>
          </div>
        </TooltipProvider>
      </template>
      <Background pattern-color="#aaa" :gap="16" />
    </VueFlow>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue';
import {
  VueFlow,
  Position,
  Handle,
  MarkerType,
  type Connection,
  type Node as VueFlowNode,
  type Edge as VueFlowEdge,
  useVueFlow,
} from '@vue-flow/core';
import { Background } from '@vue-flow/background';

import '@vue-flow/core/dist/style.css';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';

import { useBuilderColors } from '~/composables/useBuilderColors';
import { useBuilderIcons } from '~/composables/useBuilderIcons';
import { useConnectionValidation } from '~/composables/useConnectionValidation';
import { useKenneyTheme } from '~/composables/useKenneyTheme';

import type {
  Node,
  Edge,
  Component,
  ComponentPath,
} from '~/types/builder.types';

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

// Emits for "Dumb" component - just notifies parent of intents
const emit = defineEmits<{
  nodeClick: [node: VueFlowNode | null];
  connect: [edge: VueFlowEdge];
  edgeUpdate: [edge: VueFlowEdge];
  update: [nodes: VueFlowNode[], edges: VueFlowEdge[]]; // Deprecated but kept for compatibility if needed
  addNode: [node: VueFlowNode];
  updateNode: [id: string, updates: Partial<Node>];
  error: [errorKey: string, data?: Record<string, unknown>];
  requestDelete: [elements: (VueFlowNode | VueFlowEdge)[]];
}>();

const {
  getSelectedElements,
  addSelectedNodes,
  removeSelectedNodes,
  zoomIn,
  zoomOut,
  fitView,
} = useVueFlow();

const { getTypeColor, getCategoryColor, getStatusConfig } = useBuilderColors();
const { getTypeIcon } = useBuilderIcons();
const {
  isValidConnection,
  highlightCompatibleHandles,
  clearCompatibilityMarkers,
} = useConnectionValidation();

const isHandleConnected = (
  nodeId: string,
  handleId: string,
  handleType: 'source' | 'target',
): boolean => {
  return props.edges.some((edge) => {
    return handleType === 'source'
      ? edge.source === nodeId && edge.sourceHandle === handleId
      : edge.target === nodeId && edge.targetHandle === handleId;
  });
};

// Helper to determine if a type should show a handle (connectable types only)
const isConnectableType = (type: string): boolean => {
  const connectableTypes = [
    'Dataset',
    'Model',
    'JsonObject',
    'Array',
    'Object',
    'Artifact',
    'Any',
  ];
  return connectableTypes.includes(type);
};

const isValidConnectionWrapper = (connection: Connection) => {
  // We pass the full component nodes list to the validator
  // props.nodes contains the data with component structure
  // We cast to any because AppNode type mismatches slightly with VueFlowNode but data structure is compatible
  return isValidConnection(connection, props.nodes as VueFlowNode[]);
};

const onConnectStart = (params: {
  nodeId?: string;
  handleId?: string | null;
  handleType?: 'source' | 'target';
}) => {
  if (
    props.readonly ||
    !params.nodeId ||
    !params.handleId ||
    !params.handleType
  )
    return;

  highlightCompatibleHandles(
    {
      nodeId: params.nodeId,
      handleId: params.handleId, // Type guard above ensures it's string here
      handleType: params.handleType,
    },
    props.nodes as VueFlowNode[],
  );
};

const onConnectEnd = () => {
  clearCompatibilityMarkers();
};

const calculateHandlePosition = (index: number, total: number) => {
  if (total === 1) return '50%';
  // Distribute evently: for 2 items -> 33%, 66% ? Or 25%, 75%?
  // Standard flex-like spacing usually works best:
  const step = 100 / (total + 1);
  return `${step * (index + 1)}%`;
};

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

    // Use props.nodes as the source of truth for generating labels
    const existingLabels = (props.nodes || [])
      .map((node) => node.data?.label as string)
      .filter(Boolean);

    const baseName = component.name || 'Component';
    let counter = 1;
    let newLabel = baseName;

    while (existingLabels.includes(newLabel)) {
      newLabel = `${baseName}_${counter}`;
      counter++;
    }

    // Initialize inputs array with default values from input_path
    const inputs = (component.input_path || []).map(
      (inputDef: ComponentPath) => {
        const defaultValue =
          inputDef.default !== undefined && inputDef.default !== null
            ? String(inputDef.default)
            : '';

        console.log(
          `[CanvasArea] Initializing input "${inputDef.name}" with default:`,
          defaultValue,
        );

        return {
          destination: inputDef.name,
          value_source_type: 'constant',
          source: defaultValue,
        };
      },
    );

    console.log(
      `[CanvasArea] Created component "${component.name}" with ${inputs.length} inputs:`,
      inputs,
    );

    // Create a DEEP copy of component with initialized inputs
    // IMPORTANT: Use JSON.parse(JSON.stringify()) to prevent data sharing between instances
    const componentWithInputs = JSON.parse(
      JSON.stringify({
        ...component,
        inputs: inputs,
      }),
    );

    const newNode: VueFlowNode = {
      id: `component-${component.id}-${Date.now()}`,
      type: 'default',
      position,
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
      data: {
        label: newLabel,
        status: component.status,
        category: component.category,
        component: componentWithInputs,
      },
    };

    // Emit granular event for adding a single node.
    // We DO NOT update any local state here.
    // The parent will update props, which will reflect back here.
    emit('addNode', newNode);
  } catch (error) {
    console.error('Error parsing dropped component:', error);
  }
};

const onNodeClick = (event: { node: VueFlowNode | null }) => {
  emit('nodeClick', event.node);
};

const onConnect = (connection: Connection) => {
  if (props.readonly) return;

  const sourceHandle = connection.sourceHandle || '';
  const targetHandle = connection.targetHandle || '';

  // We need to fetch the Source Node to determine the Edge Color based on type!
  const sourceNode = props.nodes?.find((n) => n.id === connection.source);
  let edgeColor = 'hsl(var(--muted-foreground))'; // default

  if (sourceNode?.data?.component?.output_path && sourceHandle) {
    const outputDef = sourceNode.data.component.output_path.find(
      (o: ComponentPath) => o.name === sourceHandle,
    );
    if (outputDef) {
      edgeColor = getTypeColor(outputDef.type);
    }
  }

  const size = 11;

  const newEdge: VueFlowEdge = {
    id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
    source: connection.source,
    target: connection.target,
    sourceHandle: sourceHandle,
    targetHandle: targetHandle,
    style: {
      stroke: edgeColor,
      strokeWidth: 2,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: size,
      height: size,
      color: edgeColor,
    },
    data: {
      color: edgeColor, // Persist color in data if needed
    },
  };

  emit('connect', newEdge);
};

const onEdgesChange = () => {
  // We rely on parent/store to handle edge changes if driven by external events
  // For internal VueFlow edge changes (like deletion via UI), we might need listeners.
  // But for now, let's keep it simple.
};

const onEdgeUpdate = (edgeUpdateEvent: { edge: VueFlowEdge }) => {
  if (props.readonly) return;
  emit('edgeUpdate', edgeUpdateEvent.edge);
};

const onNodeDragStop = (event: { node: VueFlowNode; nodes: VueFlowNode[] }) => {
  if (props.readonly) return;

  // Emit granular update for the specific node(s) moved
  const draggedNodes = event.nodes || [event.node];

  draggedNodes.forEach((node) => {
    emit('updateNode', node.id, {
      position: node.position,
    });
  });
};
</script>

<style scoped>
.readonly .vue-flow__node {
  cursor: pointer !important;
}

.readonly .vue-flow__handle {
  pointer-events: none;
}

/* Ensure handles are visible above other elements */
.vue-flow__handle {
  z-index: 10;
}

/* Compatibility Styling */
.vue-flow__handle[data-compatible='true'] {
  box-shadow: 0 0 0 3px hsl(142 76% 36% / 0.5) !important;
  border-color: hsl(142 76% 36%) !important;
  transform: scale(1.3) !important;
  z-index: 50 !important;
  opacity: 1 !important;
}

.vue-flow__handle[data-compatible='false'] {
  opacity: 0.2 !important;
  cursor: not-allowed;
}

/* Connected Handle Styling - fill with type color */
.vue-flow__handle.connected {
  background-color: currentColor !important;
  border-color: currentColor !important;
  opacity: 1 !important;
}

/* Selected Node Styling - subtle elevation and shadow */
.vue-flow__node.selected .kenney-node {
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.15),
    0 0 0 1px hsl(var(--primary));
  transform: scale(1.02);
  transition: all 0.2s ease-out;
}

/* Edge Animations */
.vue-flow__edge.running path {
  stroke: hsl(var(--primary));
  animation: flow 1.5s linear infinite;
}

@keyframes flow {
  to {
    stroke-dashoffset: -10;
  }
}
</style>
