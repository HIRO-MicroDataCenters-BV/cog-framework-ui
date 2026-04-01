<template>
  <div class="h-full flex">
    <div
      v-if="!readonly && isSidebarOpen.library"
      class="w-80 flex-shrink-0 border-r"
    >
      <AppPanel :title="$t('builder.components')">
        <template #actions>
          <button
            v-for="action in menuActions"
            :key="action.key"
            class="p-1 rounded hover:bg-muted"
            :title="$t(action.titleKey)"
            @click="action.action"
          >
            <Icon :name="action.icon" class="w-4 h-4" />
          </button>
        </template>
        <LibrarySidebar ref="librarySidebar" @drag-start="onDragStart" />
      </AppPanel>
    </div>
    <div
      v-if="!readonly && !isSidebarOpen.library"
      class="fixed border m-2 rounded-xl w-3xs p-2 px-4 bg-background z-50 pointer-events-none"
    >
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-medium text-muted-foreground flex-1">
          {{ $t('builder.components') }}
        </h3>
        <button
          v-for="action in menuActions"
          :key="action.key"
          class="p-1 rounded hover:bg-muted pointer-events-auto"
          :title="$t(action.titleKey)"
          @click="action.action"
        >
          <Icon :name="action.icon" class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div class="flex-1 flex flex-col">
      <div class="flex-1">
        <CanvasArea
          v-if="!readonly || nodes.length > 0 || edges.length > 0"
          :key="`canvas-${nodes.length}-${edges.length}`"
          :nodes="enrichedNodes"
          :edges="edges"
          :readonly="readonly"
          @node-click="onNodeClick"
          @connect="onConnect"
          @edge-update="onEdgeUpdate"
          @update="onUpdate"
          @add-node="onAddNode"
          @update-node="onUpdateNode"
          @error="onError"
          @request-delete="onRequestDelete"
        />
      </div>
    </div>
  </div>

  <DeleteConfirmationDialog
    :open="deleteConfirmation !== null"
    :component-name="deleteConfirmation?.componentName || ''"
    :dependencies="deleteConfirmation?.dependencies || []"
    @cancel="deleteConfirmation = null"
    @confirm="confirmDelete"
  />
</template>

<script setup lang="ts">
import {
  MarkerType,
  type Node as VueFlowNode,
  type Edge as VueFlowEdge,
} from '@vue-flow/core';
import LibrarySidebar from './builder/LibrarySidebar.vue';
import CanvasArea from './builder/CanvasArea.vue';
import AppPanel from './Panel.vue';
import DeleteConfirmationDialog from './builder/DeleteConfirmationDialog.vue';
import type {
  Node,
  Edge,
  ComponentInput,
  ComponentPath,
  PipelineInputParam,
  PipelineOutput,
  PipelineBuilderData,
  NodeUpdate,
} from '~/types/canvas.types';
import { usePipelineBuilder } from '~/composables/usePipelineBuilder';
import { useBuilderColors } from '~/composables/useBuilderColors';

const emit = defineEmits<{
  (e: 'node-click', node: VueFlowNode | null): void;
  (e: 'update-node', id: string, updates: NodeUpdate): void;
  (e: 'delete-node', id: string): void;
  (e: 'rename-component', id: string, oldName: string, newName: string): void;
}>();

const props = withDefaults(
  defineProps<{
    readonly?: boolean;
    data?: unknown[];
  }>(),
  {
    readonly: false,
    data: () => [],
  },
);

const readonly = computed(() => props.readonly);
// data prop is not actually used for initialization in the original code,
// it seems page.data.builder is the source.

const { setPage, page } = useApp();
const toaster = useToaster();
const { t } = useI18n();
const { getValidationStatus } = useNodeValidation();
const { getTypeColor } = useBuilderColors();
const {
  nodes,
  edges,
  selectedNode,
  initialize,
  addNode,
  updateNodePosition,
  updateNodeData,
  removeNode,
  addEdge,
  removeEdge,
  selectNode,
} = usePipelineBuilder();

// Enrich nodes with validation status in create mode
const enrichedNodes = computed(() => {
  if (readonly.value) return nodes.value;

  return nodes.value.map((node) => ({
    ...node,
    data: {
      ...node.data,
      status: getValidationStatus(node, nodes.value),
    },
  }));
});

const isSidebarOpen = ref({
  library: true,
  properties: true,
});

// Pipeline-level parameters and outputs
const pipelineParameters = ref<PipelineInputParam[]>([]);
const pipelineOutputs = ref<PipelineOutput[]>([]);
const pipelineData = ref<unknown>(null);
const librarySidebar = ref<InstanceType<typeof LibrarySidebar> | null>(null);

const externalBuilderUrl = ref(
  'https://dashboard.cog.hiro-develop.nl/_/jupyter/?ns=admin',
);

// Pipeline run URL: /…/pipelines/<runId> (not the bare /pipelines list).
const isPipelineRunDetailPath = (path: string) =>
  /\/pipelines\/[^/?#]+/.test(path);

// Initialize store from page data
// We watch page.data.builder to handle initial load or external resets
watch(
  () => page.value.data?.builder,
  (builderData) => {
    const hasData = builderData?.nodes?.length || builderData?.edges?.length;
    const storeIsEmpty = nodes.value.length === 0 && edges.value.length === 0;

    // Extract pipelineData for readonly mode
    if (builderData?.pipelineData) {
      pipelineData.value = builderData.pipelineData;
    }

    // Edit mode: only hydrate when store is empty (avoid clobbering in-progress edits).
    // Readonly (pipeline run): always sync canvas from page when builder payload updates,
    // so switching runs replaces the graph even though global builder state is non-empty.
    if (hasData && (storeIsEmpty || readonly.value)) {
      initialize(
        (builderData.nodes as Node[]) || [],
        (builderData.edges as Edge[]) || [],
      );
    }

    // Case: builderData is empty/undefined and store has data -> clear store
    // This happens when navigating from readonly view to new pipeline creation
    if (!hasData && !storeIsEmpty) {
      initialize([], []);
    }
  },
  { deep: true },
);

// Clear store when navigating away from builder-relevant views.
// Do not clear when switching between two pipeline *run* URLs — that would race with
// setPage and could leave an empty graph; the builder watch applies the new run instead.
watch(
  () => useRoute().fullPath,
  (newPath, oldPath) => {
    if (!oldPath || newPath === oldPath) return;
    if (isPipelineRunDetailPath(oldPath) && isPipelineRunDetailPath(newPath)) {
      return;
    }
    if (nodes.value.length > 0 || edges.value.length > 0) {
      initialize([], []);
    }
  },
);

// Sync store back to Page for persistence/navigation
// This is ONE-WAY: Store -> Page
// IMPORTANT: Prevent infinite loops by checking if data actually changed
watch(
  [nodes, edges],
  () => {
    // Don't sync back to page in readonly mode (e.g., viewing pipeline details)
    if (readonly.value) return;

    const currentBuilder: PipelineBuilderData = (page.value.data
      ?.builder as PipelineBuilderData) || {
      name: '',
      nodes: [],
      edges: [],
      input_path: [],
      output_path: [],
    };

    // Check if data actually changed to prevent infinite loops
    // Compare stringified versions to detect deep changes
    const currentNodesStr = JSON.stringify(currentBuilder.nodes || []);
    const newNodesStr = JSON.stringify(nodes.value);
    const currentEdgesStr = JSON.stringify(currentBuilder.edges || []);
    const newEdgesStr = JSON.stringify(edges.value);

    // Only call setPage if data actually changed
    if (currentNodesStr === newNodesStr && currentEdgesStr === newEdgesStr) {
      return;
    }

    setPage({
      ...page.value,
      data: {
        ...page.value.data,
        builder: {
          ...currentBuilder,
          name: currentBuilder.name || '',
          nodes: JSON.parse(JSON.stringify(nodes.value)), // Deep copy to detach
          edges: JSON.parse(JSON.stringify(edges.value)),
          pipelineData: currentBuilder.pipelineData, // Preserve pipelineData
        },
      },
    });
  },
  { deep: true, flush: 'post' },
);

// Delete confirmation state
const deleteConfirmation = ref<{
  nodeId: string;
  componentName: string;
  dependencies: string[];
} | null>(null);

// Menu actions configuration
interface MenuAction {
  key: string;
  icon: string;
  titleKey: string;
  action: () => void;
}

const menuActions = computed<MenuAction[]>(() => [
  {
    key: 'jupyter',
    icon: 'lucide:file-code',
    titleKey: 'menu.jupyter',
    action: openExternalBuilder,
  },
  {
    key: 'refresh',
    icon: 'lucide:refresh-cw',
    titleKey: 'action.refresh',
    action: fetchComponents,
  },
  {
    key: 'toggle',
    icon: isSidebarOpen.value.library
      ? 'lucide:minimize-2'
      : 'lucide:maximize-2',
    titleKey: isSidebarOpen.value.library
      ? 'action.minimize'
      : 'action.maximize',
    action: () => toggleSidebar('library'),
  },
]);

const toggleSidebar = (sidebar: 'library' | 'properties') => {
  isSidebarOpen.value[sidebar] = !isSidebarOpen.value[sidebar];
};

const fetchComponents = () => {
  if (librarySidebar.value) {
    librarySidebar.value.fetchComponents();
  }
};

const openExternalBuilder = () => {
  navigateTo(externalBuilderUrl.value, {
    external: true,
    open: { target: '_blank' },
  });
};

const onDragStart = (component: unknown) => {
  // Drag started
};

// --- Event Handlers (Using Store Actions) ---

const onNodeClick = (node: VueFlowNode | null) => {
  // Store handles selection logic including null (for toggle behavior)
  selectNode(node?.id || null);

  // Always emit node-click so parent can control the sheet
  emit('node-click', node);
};

const onConnect = (edge: VueFlowEdge) => {
  if (readonly.value) return;

  const targetNode = nodes.value.find((n) => n.id === edge.target);
  const sourceNode = nodes.value.find((n) => n.id === edge.source);
  const targetHandle = edge.targetHandle || '';
  const sourceHandle = edge.sourceHandle || '';

  // Keep component sheet in sync: when a canvas edge is created,
  // update the target component input relationship immediately.
  if (targetNode?.data?.component && targetHandle && sourceNode && sourceHandle) {
    const existingInputs = targetNode.data.component.inputs || [];
    const mappedInput: ComponentInput = {
      destination: targetHandle,
      value_source_type: 'component_output',
      source: `${sourceNode.data?.label || sourceNode.data?.component?.name || edge.source}.${sourceHandle}`,
    };

    const existingIndex = existingInputs.findIndex(
      (input) => input.destination === targetHandle,
    );
    const nextInputs = [...existingInputs];

    if (existingIndex >= 0) {
      nextInputs[existingIndex] = mappedInput;
    } else {
      nextInputs.push(mappedInput);
    }

    updateNodeData(targetNode.id, {
      component: {
        ...targetNode.data.component,
        inputs: nextInputs,
      },
    });
  }

  addEdge(edge as Edge);
};

const parseComponentOutputSource = (
  source: string,
): { componentLabel: string; outputName: string } | null => {
  const dotIndex = source.lastIndexOf('.');
  if (dotIndex <= 0 || dotIndex === source.length - 1) return null;
  return {
    componentLabel: source.slice(0, dotIndex),
    outputName: source.slice(dotIndex + 1),
  };
};

const getNodeDisplayName = (node: Node): string =>
  (node.data?.label as string) ||
  (node.data?.component?.name as string) ||
  node.id;

const getEdgeColor = (sourceNodeId: string, sourceHandle: string): string => {
  const sourceNode = nodes.value.find((n) => n.id === sourceNodeId);
  const outputDef = sourceNode?.data?.component?.output_path?.find(
    (output) => output.name === sourceHandle,
  );
  return outputDef
    ? getTypeColor(outputDef.type)
    : 'hsl(var(--muted-foreground))';
};

const applyEdgeVisualStyle = (
  edge: Edge | VueFlowEdge,
  sourceNodeId: string,
  sourceHandle: string,
) => {
  const edgeColor = getEdgeColor(sourceNodeId, sourceHandle);
  const markerSize = 11;

  edge.style = {
    ...(edge.style || {}),
    stroke: edgeColor,
    strokeWidth: 2,
  };
  edge.markerEnd = {
    type: MarkerType.ArrowClosed,
    width: markerSize,
    height: markerSize,
    color: edgeColor,
  };
  edge.data = {
    ...(edge.data || {}),
    color: edgeColor,
  };
};

const syncEdgesFromComponentInputs = (
  targetNodeId: string,
  inputs: ComponentInput[],
) => {
  const targetNode = nodes.value.find((n) => n.id === targetNodeId);
  if (!targetNode) return;

  const desiredByDestination = new Map<
    string,
    { sourceNodeId: string; outputName: string }
  >();

  for (const input of inputs) {
    if (
      input.value_source_type !== 'component_output' ||
      !input.source ||
      !input.destination
    ) {
      continue;
    }
    const parsed = parseComponentOutputSource(input.source);
    if (!parsed) continue;

    const sourceNode = nodes.value.find((n) => {
      const label = getNodeDisplayName(n);
      const componentName = (n.data?.component?.name as string) || '';
      return (
        label === parsed.componentLabel || componentName === parsed.componentLabel
      );
    });
    if (!sourceNode) continue;

    desiredByDestination.set(input.destination, {
      sourceNodeId: sourceNode.id,
      outputName: parsed.outputName,
    });
  }

  const incomingEdges = edges.value.filter((e) => e.target === targetNodeId);

  // Remove edges that no longer match sheet input mapping.
  incomingEdges.forEach((edge) => {
    const targetHandle = edge.targetHandle || '';
    if (!targetHandle) return;
    const desired = desiredByDestination.get(targetHandle);
    const shouldKeep =
      desired &&
      edge.source === desired.sourceNodeId &&
      (edge.sourceHandle || '') === desired.outputName;
    if (!shouldKeep) {
      removeEdge(edge.id);
    }
  });

  // Add missing edges for sheet mappings.
  desiredByDestination.forEach((desired, destination) => {
    const existingEdge = edges.value.find(
      (e) =>
        e.target === targetNodeId &&
        (e.targetHandle || '') === destination &&
        e.source === desired.sourceNodeId &&
        (e.sourceHandle || '') === desired.outputName,
    );
    if (existingEdge) {
      applyEdgeVisualStyle(
        existingEdge,
        desired.sourceNodeId,
        desired.outputName,
      );
      return;
    }

    const newEdge = {
      id: `edge-${desired.sourceNodeId}-${targetNodeId}-${destination}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      source: desired.sourceNodeId,
      target: targetNodeId,
      sourceHandle: desired.outputName,
      targetHandle: destination,
    } as Edge;
    applyEdgeVisualStyle(newEdge, desired.sourceNodeId, desired.outputName);
    addEdge(newEdge);
  });
};

const syncOutputRenameReferences = (
  nodeId: string,
  previousOutputPath: ComponentPath[],
  nextOutputPath: ComponentPath[],
) => {
  const sourceNode = nodes.value.find((n) => n.id === nodeId);
  if (!sourceNode) return;
  const sourceComponentName = getNodeDisplayName(sourceNode);

  const renameMap = new Map<string, string>();
  const maxLen = Math.min(previousOutputPath.length, nextOutputPath.length);
  for (let i = 0; i < maxLen; i++) {
    const before = previousOutputPath[i]?.name;
    const after = nextOutputPath[i]?.name;
    if (before && after && before !== after) {
      renameMap.set(before, after);
    }
  }
  if (!renameMap.size) return;

  // Update edges sourced from this node so handles keep working.
  edges.value.forEach((edge) => {
    if (edge.source !== nodeId) return;
    const oldHandle = edge.sourceHandle || '';
    const newHandle = renameMap.get(oldHandle);
    if (!newHandle) return;
    edge.sourceHandle = newHandle;
    applyEdgeVisualStyle(edge as Edge, nodeId, newHandle);
  });
  // Ensure reactivity for any deep edge mutations above.
  edges.value = [...edges.value];

  // Update all component-input references that point to renamed outputs.
  nodes.value.forEach((node) => {
    const inputs = node.data?.component?.inputs || [];
    if (!inputs.length) return;

    let hasChanges = false;
    const updatedInputs = inputs.map((input: ComponentInput) => {
      if (input.value_source_type !== 'component_output') return input;
      const source = input.source || '';
      if (!source.startsWith(`${sourceComponentName}.`)) return input;
      const outputName = source.slice(sourceComponentName.length + 1);
      const renamed = renameMap.get(outputName);
      if (!renamed) return input;
      hasChanges = true;
      return { ...input, source: `${sourceComponentName}.${renamed}` };
    });

    if (hasChanges) {
      updateNodeData(node.id, {
        component: {
          ...node.data.component,
          inputs: updatedInputs,
        },
      });
    }
  });
};

const onEdgeUpdate = (edge: VueFlowEdge) => {
  // TODO: Implement modifyEdge in store if needed, or just remove/add
};

const onAddNode = (node: VueFlowNode) => {
  if (readonly.value) return;
  addNode(node as Node);
};

const onUpdateNode = (nodeId: string, updates: NodeUpdate) => {
  if (readonly.value) return;

  const nodeBeforeUpdate = nodes.value.find((n) => n.id === nodeId);
  const previousOutputPath = [
    ...((nodeBeforeUpdate?.data?.component?.output_path as ComponentPath[]) || []),
  ];

  if (updates.position) {
    updateNodePosition(nodeId, updates.position);
  }

  if (updates.data) {
    updateNodeData(nodeId, updates.data);

    const maybeInputs = (updates.data.component as { inputs?: ComponentInput[] })
      ?.inputs;
    if (Array.isArray(maybeInputs)) {
      syncEdgesFromComponentInputs(nodeId, maybeInputs);
    }

    const maybeOutputPath = (updates.data.component as { output_path?: ComponentPath[] })
      ?.output_path;
    if (Array.isArray(maybeOutputPath)) {
      syncOutputRenameReferences(nodeId, previousOutputPath, maybeOutputPath);
    }
  }
};

// Deprecated: onUpdate was the full list sync. We NO LONGER USE IT for nodes/edges.
// If Canvas emits it, we ignore it or use it only for edges if strictly necessary,
// but we prefer granular events.
const onUpdate = (newNodes: VueFlowNode[], newEdges: VueFlowEdge[]) => {
  // If edges are updated via some internal VueFlow mechanism not caught by other events
  // we might need to sync them. For now, trust addEdge/connect.
  // If we need to sync edges deletions from VueFlow (e.g. backspace on edge), we should
  // listen to edges-change or similar.
  // For now, let's keep edges in sync if length differs?
  // Actually, let's rely on atomic events.
};

const onRequestDelete = (elements: (VueFlowNode | VueFlowEdge)[]) => {
  if (readonly.value) return;

  const nodesToDelete = elements.filter(
    (el) => !('source' in el),
  ) as VueFlowNode[];
  const edgesToDelete = elements.filter(
    (el) => 'source' in el,
  ) as VueFlowEdge[];

  if (nodesToDelete.length > 0) {
    const nodeToDelete = nodesToDelete[0];
    const dependencies = getDependencies(nodeToDelete.id);
    deleteConfirmation.value = {
      nodeId: nodeToDelete.id,
      componentName: (nodeToDelete.data?.label as string) || 'Component',
      dependencies,
    };
    return;
  }

  if (edgesToDelete.length > 0) {
    edgesToDelete.forEach((edge) => removeEdge(edge.id));
  }
};

const getDependencies = (nodeId: string): string[] => {
  const outgoingEdges = edges.value.filter((e) => e.source === nodeId);
  const targetNodeIds = outgoingEdges.map((e) => e.target);
  return nodes.value
    .filter((n) => targetNodeIds.includes(n.id))
    .map((n) => (n.data?.label as string) || n.id);
};

const confirmDelete = () => {
  if (deleteConfirmation.value) {
    removeNode(deleteConfirmation.value.nodeId);
    deleteConfirmation.value = null;
  }
};

// Handler for Sidebar Delete button
const onDeleteNode = (nodeId: string) => {
  if (readonly.value) return;
  const node = nodes.value.find((n) => n.id === nodeId);
  if (node) {
    const dependencies = getDependencies(nodeId);
    deleteConfirmation.value = {
      nodeId: nodeId,
      componentName: (node.data?.label as string) || 'Component',
      dependencies,
    };
  }
};

const onRenameComponent = (
  nodeId: string,
  oldName: string,
  newName: string,
) => {
  if (readonly.value) return;

  // 1. Update the component itself
  const node = nodes.value.find((n) => n.id === nodeId);
  if (node && node.data.component) {
    updateNodeData(nodeId, {
      label: newName,
      component: { ...node.data.component, name: newName },
    });
    console.log('[builder] onRenameComponent - after update:', {
      label: node.data.label,
      componentName: (node.data.component as Component | undefined)?.name,
    });
  } else {
    console.warn('[builder] onRenameComponent - node or component not found:', {
      nodeId,
      hasNode: !!node,
      hasComponent: !!node?.data?.component,
    });
  }

  // 2. Update ALL other components that reference this component
  let updatedCount = 0;
  nodes.value.forEach((otherNode) => {
    if (otherNode.id === nodeId) return; // Skip self

    const inputs = otherNode.data?.component?.inputs || [];
    let hasChanges = false;

    const updatedInputs = inputs.map((input: ComponentInput) => {
      if (
        input.value_source_type === 'component_output' &&
        input.source.startsWith(oldName + '.')
      ) {
        hasChanges = true;
        updatedCount++;
        const [, outputName] = input.source.split('.', 2);
        return { ...input, source: `${newName}.${outputName}` };
      }
      return input;
    });

    // Only update if inputs changed
    if (hasChanges) {
      updateNodeData(otherNode.id, {
        component: {
          ...otherNode.data.component,
          inputs: updatedInputs,
        },
      });
    }
  });

  // 3. Show success toast
  if (updatedCount > 0) {
    toaster.show('success', 'builder.component_renamed_with_updates', {
      oldName,
      newName,
      count: updatedCount,
      duration: 4000,
    });
  } else {
    toaster.show('success', 'builder.component_renamed', {
      oldName,
      newName,
      duration: 3000,
    });
  }
};

const onError = (errorKey: string, data?: Record<string, unknown>) => {
  console.error('Builder error:', errorKey, data);
  const errorMessage = (data?.message as string) || t(`error.${errorKey}`);
  toaster.show('error', errorMessage, {
    duration: 5000,
    ...data,
  });
};

// Pipeline Parameters handlers
const onUpdateParameters = (newParams: PipelineInputParam[]) => {
  pipelineParameters.value = newParams;

  // Sync to page.data.builder
  const currentBuilder: PipelineBuilderData = (page.value.data
    ?.builder as PipelineBuilderData) || {
    name: '',
    nodes: [],
    edges: [],
    input_path: [],
    output_path: [],
  };

  setPage({
    ...page.value,
    data: {
      ...page.value.data,
      builder: {
        ...currentBuilder,
        name: currentBuilder.name || '',
        input_path: newParams,
      },
    },
  });
};

// Pipeline Outputs handlers
const onUpdateOutputs = (newOutputs: PipelineOutput[]) => {
  pipelineOutputs.value = newOutputs;

  // Sync to page.data.builder
  const currentBuilder: PipelineBuilderData = (page.value.data
    ?.builder as PipelineBuilderData) || {
    name: '',
    nodes: [],
    edges: [],
    input_path: [],
    output_path: [],
  };

  setPage({
    ...page.value,
    data: {
      ...page.value.data,
      builder: {
        ...currentBuilder,
        name: currentBuilder.name || '',
        output_path: newOutputs,
      },
    },
  });
};

// Expose methods for parent components to call
defineExpose({
  onUpdateNode,
  onDeleteNode,
  onRenameComponent,
});
</script>
