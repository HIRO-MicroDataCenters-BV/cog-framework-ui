<template>
  <div
    ref="canvasRootRef"
    class="h-full relative bg-muted/20"
    :class="{ readonly: props.readonly }"
  >
    <VueFlow
      :nodes="props.nodes"
      :edges="props.edges"
      class="w-full h-full"
      :fit-view-on-init="props.readonly"
      :nodes-draggable="!props.readonly && !isLocked"
      :nodes-connectable="!props.readonly && !isLocked"
      :edges-updatable="!props.readonly && !isLocked"
      :elements-selectable="!props.readonly"
      :zoom-on-scroll="!isLocked"
      :zoom-on-pinch="!isLocked"
      :zoom-on-double-click="!isLocked"
      :pan-on-drag="!isLocked"
      :pan-on-scroll="!isLocked"
      :delete-key-code="null"
      :multi-selection-key-code="null"
      :default-edge-options="{
        markerEnd: { type: MarkerType.ArrowClosed, width: 8, height: 8 },
      }"
      :connection-mode="ConnectionMode.Loose"
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
            class="bg-card border-none w-3xs min-h-[86px] overflow-visible kenney-node relative group/node"
            :class="[
              props.readonly ? '' : 'cursor-grab active:cursor-grabbing',
            ]"
            :style="{
              border: '1px solid hsl(var(--border))',
              borderLeft: `4px solid ${data.status ? getStatusConfig(data.status).color : getCategoryColor(data.category)}`,
              borderRadius: '0.75rem',
            }"
            :data-nodeid="data.id || data.component.id"
            @mouseenter="hoveredNodeId = id"
            @mouseleave="hoveredNodeId = null"
          >
            <Tooltip
              v-if="
                !isInputRailExpanded(id) &&
                (hiddenInputCountByNode.get(id) ?? 0) > 0
              "
            >
              <TooltipTrigger as-child>
                <div
                  class="absolute -top-2 right-3 z-20 rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground shadow-sm"
                >
                  +{{ hiddenInputCountByNode.get(id) }} more
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" class="text-xs">
                Hover to expand all inputs
              </TooltipContent>
            </Tooltip>

            <!-- Input Handles (Top) -->
            <div
              class="absolute top-0 left-0 right-0 h-0 flex justify-center z-10"
              @mouseenter="hoveredInputRailNodeId = id"
              @mouseleave="hoveredInputRailNodeId = null"
            >
              <div
                v-for="(input, index) in allInputHandlesByNode.get(id) || []"
                :key="`input-${input.name}`"
                class="absolute transition-opacity duration-150"
                :class="
                  isInputHandleVisible(id, input.name)
                    ? 'opacity-100'
                    : 'opacity-0 pointer-events-none'
                "
                @mouseenter="
                  (e) =>
                    showHandleTooltip(
                      e,
                      id,
                      input.name,
                      input.type,
                      getInputAssignedText(id, input.name),
                    )
                "
                @mouseleave="hideHandleTooltip"
                :style="{
                  left: calculateHandlePosition(
                    Number(index),
                    (allInputHandlesByNode.get(id) || []).length,
                  ),
                }"
              >
                <Handle
                  :id="input.name"
                  type="target"
                  :position="Position.Top"
                  :connectable="1"
                  class="!w-3 !h-3 !rounded-full !border-2 transition-all duration-200 hover:scale-125"
                  :class="[props.readonly ? 'opacity-0' : '']"
                  :style="{
                    borderColor: getTypeColor(input.type),
                    color: getTypeColor(input.type),
                    backgroundColor:
                      isHandleConnected(id, input.name, 'target') ||
                      isInputAssigned(id, input.name)
                        ? getTypeColor(input.type)
                        : 'hsl(var(--background))',
                  }"
                  :data-handleid="input.name"
                />
              </div>
            </div>

            <!-- Header & Content -->
            <div class="cursor-pointer">
              <div
                class="flex items-center flex-nowrap gap-2 border-b border-border px-4 py-2 text-card-foreground bg-muted/30"
              >
                <span
                  class="text-sm flex-auto overflow-hidden font-medium truncate"
                  >{{ data.displayName || data.label }}</span
                >
                <!-- Pipeline output toggle button (icon only, visible on hover or when active) -->
                <Tooltip v-if="!props.readonly">
                  <TooltipTrigger as-child>
                    <button
                      class="shrink-0 rounded p-0.5 text-muted-foreground/40 opacity-0 transition-all group-hover/node:opacity-100 hover:text-muted-foreground"
                      @click.stop="toggleOutputNode(id)"
                    >
                      <Icon name="lucide:square-arrow-down" class="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" class="text-xs">
                    {{ outputNodeId === id ? 'Remove as pipeline output' : 'Set as pipeline output' }}
                  </TooltipContent>
                </Tooltip>
                <Tooltip v-if="data.status">
                  <TooltipTrigger as-child>
                    <Icon
                      :name="getStatusConfig(data.status).icon"
                      :class="[
                        'w-4 h-4 shrink-0',
                        data.status?.toLowerCase() === 'running' &&
                          'animate-[spin_2s_linear_infinite]',
                      ]"
                      :style="{ color: getStatusConfig(data.status).color }"
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p class="capitalize text-xs">
                      {{ data.status.toLowerCase() }}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div
                v-if="
                  data.displayName ||
                  (data.category && data.category !== 'general')
                "
                class="px-4 py-3"
              >
                <p
                  v-if="data.displayName"
                  class="text-xs text-muted-foreground font-medium"
                >
                  {{ data.label }}
                </p>
                <p
                  v-else-if="data.category && data.category !== 'general'"
                  class="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-medium"
                >
                  <Icon name="lucide:folder" class="w-3 h-3" />
                  {{ data.category }}
                </p>
              </div>

              <!-- Pipeline Output banner -->
              <Transition name="output-banner">
                <div
                  v-if="outputNodeId === id"
                  class="flex items-center justify-center gap-1.5 border-t border-amber-500/30 bg-amber-500/10 px-3 py-1.5"
                >
                  <Icon name="lucide:square-arrow-down" class="w-3 h-3 shrink-0 text-amber-500" />
                  <span class="text-[10px] font-semibold uppercase tracking-wide text-amber-500">Pipeline Output</span>
                </div>
              </Transition>
            </div>

            <!-- Output Handles (Bottom) -->
            <div
              class="absolute bottom-0 left-0 right-0 h-0 flex justify-center z-10"
            >
              <div
                v-for="(output, index) in (
                  data.component.output_path || []
                ).filter((o: any) => isConnectableType(o.type, o.name))"
                :key="`output-${output.name}`"
                class="absolute"
                @mouseenter="
                  (e) =>
                    showHandleTooltip(
                      e,
                      id,
                      output.name,
                      output.type,
                      getOutputAssignedText(id, output.name),
                    )
                "
                @mouseleave="hideHandleTooltip"
                :style="{
                  left: calculateHandlePosition(
                    Number(index),
                    (data.component.output_path || []).filter((o: any) =>
                      isConnectableType(o.type, o.name),
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
                />
              </div>
            </div>
          </div>
        </TooltipProvider>
      </template>
      <Background v-if="showBackground" pattern-color="#aaa" :gap="16" />

      <MiniMap
        v-if="showMinimap"
        :nodes-color="() => 'hsl(var(--primary))'"
        :mask-color="'hsl(var(--muted) / 0.7)'"
        pannable
        zoomable
      />

      <!-- Floating Controls Toolbar -->
      <Panel :position="PanelPosition.BottomLeft">
        <div
          class="flex items-center gap-0.5 rounded-xl border border-border bg-background/90 backdrop-blur-sm shadow-lg px-1.5 py-1.5"
        >
          <!-- Zoom In -->
          <button
            type="button"
            :title="isLocked ? 'Unlock to zoom' : 'Zoom in'"
            class="canvas-ctrl-btn"
            :disabled="isLocked"
            :class="{ 'opacity-50 cursor-not-allowed': isLocked }"
            @click="zoomIn({ duration: 200 })"
          >
            <Icon name="lucide:plus" class="w-4 h-4" />
          </button>

          <!-- Zoom Out -->
          <button
            type="button"
            :title="isLocked ? 'Unlock to zoom' : 'Zoom out'"
            class="canvas-ctrl-btn"
            :disabled="isLocked"
            :class="{ 'opacity-50 cursor-not-allowed': isLocked }"
            @click="zoomOut({ duration: 200 })"
          >
            <Icon name="lucide:minus" class="w-4 h-4" />
          </button>

          <div class="w-px h-5 bg-border mx-0.5" />

          <!-- Fit View -->
          <button
            type="button"
            :title="isLocked ? 'Unlock to fit view' : 'Fit view'"
            class="canvas-ctrl-btn"
            :disabled="isLocked"
            :class="{ 'opacity-50 cursor-not-allowed': isLocked }"
            @click="handleFitView"
          >
            <Icon name="lucide:maximize-2" class="w-4 h-4" />
          </button>

          <!-- Lock / Unlock -->
          <button
            type="button"
            :title="isLocked ? 'Unlock canvas' : 'Lock canvas'"
            class="canvas-ctrl-btn"
            :class="{ 'text-primary': isLocked }"
            @click="toggleLock"
          >
            <Icon
              :name="isLocked ? 'lucide:lock' : 'lucide:lock-open'"
              class="w-4 h-4"
            />
          </button>

          <div class="w-px h-5 bg-border mx-0.5" />

          <!-- Background dots toggle -->
          <button
            type="button"
            :title="showBackground ? 'Hide background' : 'Show background'"
            class="canvas-ctrl-btn"
            :class="{ 'text-primary': !showBackground }"
            @click="showBackground = !showBackground"
          >
            <Icon name="lucide:grid-2x2-x" class="w-4 h-4" />
          </button>

          <!-- Minimap Toggle -->
          <button
            type="button"
            :title="showMinimap ? 'Hide minimap' : 'Show minimap'"
            class="canvas-ctrl-btn"
            :class="{ 'text-primary': showMinimap }"
            @click="showMinimap = !showMinimap"
          >
            <Icon name="lucide:map" class="w-4 h-4" />
          </button>
        </div>
      </Panel>
    </VueFlow>

    <div
      v-if="hoveredHandleTooltip"
      class="pointer-events-none absolute z-[60] w-max min-w-[11rem] max-w-[26rem] -translate-x-1/2 -translate-y-full rounded-md bg-primary px-3 py-2 text-xs text-primary-foreground opacity-90 shadow-md backdrop-blur-[1px]"
      :style="{
        left: `${hoveredHandleTooltip.x}px`,
        top: `${hoveredHandleTooltip.y}px`,
      }"
    >
      <div class="font-medium text-primary-foreground">
        {{ hoveredHandleTooltip.name }}
      </div>
      <div class="mt-0.5 text-primary-foreground/90">
        Type: {{ hoveredHandleTooltip.type }}
      </div>
      <div class="mt-1 break-words text-primary-foreground/90">
        Assigned: {{ hoveredHandleTooltip.assigned }}
      </div>
      <div
        class="absolute left-1/2 top-full z-[60] size-2.5 -translate-x-1/2 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-primary"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, watch, ref } from 'vue';
import type { CSSProperties } from 'vue';
import {
  VueFlow,
  Panel,
  PanelPosition,
  Position,
  Handle,
  MarkerType,
  ConnectionMode,
  type Connection,
  type Node as VueFlowNode,
  type Edge as VueFlowEdge,
  useVueFlow,
} from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { MiniMap } from '@vue-flow/minimap';
import '@vue-flow/minimap/dist/style.css';

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
  ComponentInput,
  ComponentPath,
} from '~/types/canvas.types';

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
  onNodesInitialized,
  setNodes,
} = useVueFlow();

const { outputNodeId, toggleOutputNode } = usePipelineBuilder();

// Re-fit view when pipeline run data loads (readonly). In the builder, auto-fit on
// every node change (e.g. drag from library) is jarring; users can use Fit view.
watch(
  () => props.nodes,
  (newNodes) => {
    if (!props.readonly) return;
    if (newNodes && newNodes.length > 0) {
      nextTick(() => {
        fitView({ padding: 0.15, duration: 300 });
      });
    }
  },
  { immediate: false },
);

onNodesInitialized(() => {
  if (!props.readonly) return;
  fitView({ padding: 0.35, duration: 200 });
});

// Controls state
const isLocked = ref(false);
const showMinimap = ref(false);
const showBackground = ref(true);

const toggleLock = () => {
  isLocked.value = !isLocked.value;
};

const handleFitView = () => {
  fitView({ padding: 0.35, duration: 300 });
};

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

const canvasRootRef = ref<HTMLElement | null>(null);
const hoveredHandleTooltip = ref<{
  nodeId: string;
  name: string;
  type: string;
  assigned: string;
  x: number;
  y: number;
} | null>(null);

const getAssignedInput = (
  nodeId: string,
  inputName: string,
): ComponentInput | undefined => {
  const node = props.nodes.find((n) => n.id === nodeId);
  const inputs = node?.data?.component?.inputs || [];
  return inputs.find((input: ComponentInput) => input.destination === inputName);
};

const isInputAssigned = (nodeId: string, inputName: string): boolean => {
  const assigned = getAssignedInput(nodeId, inputName);
  if (!assigned) return false;
  return Boolean(assigned.source && String(assigned.source).trim() !== '');
};

const getAssignedOutputTargets = (
  nodeId: string,
  outputName: string,
): string[] => {
  return props.edges
    .filter((edge) => edge.source === nodeId && edge.sourceHandle === outputName)
    .map((edge) => {
      const targetNode = props.nodes.find((n) => n.id === edge.target);
      const targetLabel =
        (targetNode?.data?.label as string) ||
        targetNode?.data?.component?.name ||
        edge.target;
      return `${targetLabel}.${edge.targetHandle || ''}`.replace(/\.$/, '');
    });
};

const getInputAssignedText = (nodeId: string, inputName: string): string => {
  const assigned = getAssignedInput(nodeId, inputName);
  return assigned
    ? `${assigned.value_source_type} = ${assigned.source || '—'}`
    : 'none';
};

const getOutputAssignedText = (nodeId: string, outputName: string): string => {
  const targets = getAssignedOutputTargets(nodeId, outputName);
  return targets.length ? targets.join(', ') : 'none';
};

const showHandleTooltip = (
  event: MouseEvent,
  nodeId: string,
  name: string,
  type: string,
  assigned: string,
) => {
  const root = canvasRootRef.value;
  if (!root) return;
  const targetEl = event.currentTarget as HTMLElement | null;
  if (!targetEl) return;

  const rect = root.getBoundingClientRect();
  const dotRect = targetEl.getBoundingClientRect();

  hoveredHandleTooltip.value = {
    nodeId,
    name,
    type,
    assigned,
    x: dotRect.left - rect.left + dotRect.width / 2,
    y: dotRect.top - rect.top - 10,
  };
};

const hideHandleTooltip = () => {
  hoveredHandleTooltip.value = null;
};

// Show handles for all declared input/output types from component definition.
const isConnectableType = (type: string): boolean => Boolean(type);

const hoveredNodeId = ref<string | null>(null);
const hoveredInputRailNodeId = ref<string | null>(null);

const allInputHandlesByNode = computed(() => {
  const byNode = new Map<string, ComponentPath[]>();

  for (const node of props.nodes) {
    const inputPath = (node.data?.component?.input_path || []).filter(
      (i: ComponentPath) => isConnectableType(i.type),
    );
    // Keep the API-defined input order stable so dot positions do not jump.
    byNode.set(node.id, inputPath);
  }

  return byNode;
});

const isInputRailExpanded = (nodeId: string): boolean => {
  if (hoveredNodeId.value === nodeId) return true;
  if (hoveredInputRailNodeId.value === nodeId) return true;
  const node = props.nodes.find((n) => n.id === nodeId);
  return Boolean(node?.selected);
};

const visibleInputHandleNamesByNode = computed(() => {
  const byNode = new Map<string, Set<string>>();
  for (const node of props.nodes) {
    const allInputs = allInputHandlesByNode.value.get(node.id) || [];
    if (isInputRailExpanded(node.id)) {
      byNode.set(node.id, new Set(allInputs.map((input) => input.name)));
      continue;
    }

    // In collapsed mode, keep all connected input dots visible so users
    // can always see existing mappings on the node.
    const connectedHandleNames = new Set(
      props.edges
        .filter((edge) => edge.target === node.id)
        .map((edge) => edge.targetHandle)
        .filter((h): h is string => Boolean(h)),
    );
    const connectedInputs = allInputs.filter((input) =>
      connectedHandleNames.has(input.name),
    );

    if (connectedInputs.length > 0) {
      byNode.set(node.id, new Set(connectedInputs.map((input) => input.name)));
    } else {
      const centerIndex = Math.floor((allInputs.length - 1) / 2);
      const centerInput = allInputs[centerIndex];
      byNode.set(
        node.id,
        new Set(centerInput ? [centerInput.name] : []),
      );
    }
  }
  return byNode;
});

const isInputHandleVisible = (nodeId: string, handleName: string): boolean => {
  const visibleHandles = visibleInputHandleNamesByNode.value.get(nodeId);
  return visibleHandles ? visibleHandles.has(handleName) : false;
};

const hiddenInputCountByNode = computed(() => {
  const byNode = new Map<string, number>();

  for (const node of props.nodes) {
    const total = allInputHandlesByNode.value.get(node.id)?.length || 0;
    const visible = visibleInputHandleNamesByNode.value.get(node.id)?.size || 0;
    byNode.set(node.id, Math.max(0, total - visible));
  }

  return byNode;
});

const isValidConnectionWrapper = (connection: Connection) => {
  // One input handle can accept only one incoming output connection.
  if (connection.target && connection.targetHandle) {
    const targetAlreadyConnected = props.edges.some(
      (edge) =>
        edge.target === connection.target &&
        edge.targetHandle === connection.targetHandle,
    );
    if (targetAlreadyConnected) return false;
  }

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

        return {
          destination: inputDef.name,
          value_source_type: 'constant',
          source: defaultValue,
        };
      },
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
.output-banner-enter-active,
.output-banner-leave-active {
  transition: opacity 0.2s ease, max-height 0.2s ease;
  max-height: 40px;
  overflow: hidden;
}
.output-banner-enter-from,
.output-banner-leave-to {
  opacity: 0;
  max-height: 0;
}

.canvas-ctrl-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  color: hsl(var(--foreground));
  transition:
    background-color 0.15s,
    color 0.15s;
}

.canvas-ctrl-btn:hover {
  background-color: hsl(var(--muted));
}

.canvas-ctrl-btn:active {
  background-color: hsl(var(--muted) / 0.7);
}

.readonly .vue-flow__node {
  cursor: pointer !important;
}

.readonly .vue-flow__handle {
  pointer-events: none;
}

/* Ensure handles are visible above other elements */
.vue-flow__handle {
  z-index: 80 !important;
  pointer-events: auto !important;
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
