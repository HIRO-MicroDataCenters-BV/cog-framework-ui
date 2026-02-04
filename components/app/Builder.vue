<template>
  <div class="h-full flex">
    <Sheet>
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
        class="fixed border m-2 rounded-xl w-3xs p-2 px-4 bg-white z-50"
      >
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-medium text-gray-500 flex-1">
            {{ $t('builder.components') }}
          </h3>
          <button
            v-for="action in menuActions"
            :key="action.key"
            class="p-1 rounded hover:bg-muted"
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

      <SheetContent :show-overlay="false" :show-close-button="false">
        <div>
          <PropertiesSidebar
            :readonly="readonly"
            :selected-node="selectedNode"
            :all-nodes="enrichedNodes"
            @update-node="onUpdateNode"
            @delete-node="onDeleteNode"
            @rename-component="onRenameComponent"
          />
        </div>
      </SheetContent>
    </Sheet>
  </div>

  <DeleteConfirmationDialog
    :open="deleteConfirmation !== null"
    :component-name="deleteConfirmation?.componentName || ''"
    :dependencies="deleteConfirmation?.dependencies || []"
    @cancel="deleteConfirmation = null"
    @confirm="confirmDelete"
  />

  <AppDialogPipelineComponent
    :open="openUploadComponentDialog"
    @on-close="
      () => {
        openUploadComponentDialog = false;
        fetchComponents();
      }
    "
  />
</template>

<script setup lang="ts">
import type { Node as VueFlowNode, Edge as VueFlowEdge } from '@vue-flow/core';
import LibrarySidebar from './builder/LibrarySidebar.vue';
import PropertiesSidebar from './builder/PropertiesSidebar.vue';
import CanvasArea from './builder/CanvasArea.vue';
import AppPanel from './Panel.vue';
import AppDialogPipelineComponent from './dialog/PipelineComponent.vue';
import DeleteConfirmationDialog from './builder/DeleteConfirmationDialog.vue';
import type { Node, Edge, ComponentInput } from '~/types/builder.types';
import { usePipelineBuilder } from '~/composables/usePipelineBuilder';

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
      status: getValidationStatus(node),
    },
  }));
});

const isSidebarOpen = ref({
  library: true,
  properties: true,
});

const openUploadComponentDialog = ref(false);
const librarySidebar = ref<InstanceType<typeof LibrarySidebar> | null>(null);

const externalBuilderUrl = ref(
  'https://dashboard.cog.hiro-develop.nl/notebook/admin/sai/lab/workspaces/auto-3/tree/register_component.ipynb',
);

// Initialize store from page data
// We watch page.data.builder to handle initial load or external resets
watch(
  () => page.value.data?.builder,
  (builderData) => {
    const hasData = builderData?.nodes?.length || builderData?.edges?.length;
    const storeIsEmpty = nodes.value.length === 0 && edges.value.length === 0;

    console.log('builderData', builderData);

    // Case 1: builderData has data and store is empty -> initialize
    if (hasData && storeIsEmpty) {
      initialize(
        (builderData.nodes as Node[]) || [],
        (builderData.edges as Edge[]) || [],
      );
    }

    // Case 2: builderData is empty/undefined and store has data -> clear store
    // This happens when navigating from readonly view to new pipeline creation
    if (!hasData && !storeIsEmpty) {
      initialize([], []);
    }
  },
  { deep: true },
);

// Clear store when navigating away from a pipeline view
// This ensures clean state when going from readonly view to new pipeline creation
watch(
  () => useRoute().fullPath,
  (newPath, oldPath) => {
    // If we had data and now navigating to a different route, clear store
    if (
      oldPath &&
      newPath !== oldPath &&
      (nodes.value.length > 0 || edges.value.length > 0)
    ) {
      console.log('[Builder] Route changed, clearing store', {
        from: oldPath,
        to: newPath,
      });
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

    const currentBuilder = page.value.data?.builder || {
      name: '',
      nodes: [],
      edges: [],
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
          nodes: JSON.parse(JSON.stringify(nodes.value)), // Deep copy to detach
          edges: JSON.parse(JSON.stringify(edges.value)),
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
    key: 'upload',
    icon: 'lucide:upload',
    titleKey: 'menu.upload',
    action: () => {
      openUploadComponentDialog.value = true;
    },
  },
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
  // Store handles selection logic including null
  selectNode(node?.id || null);
};

const onConnect = (edge: VueFlowEdge) => {
  if (readonly.value) return;
  addEdge(edge as Edge);
};

const onEdgeUpdate = (edge: VueFlowEdge) => {
  // TODO: Implement modifyEdge in store if needed, or just remove/add
};

const onAddNode = (node: VueFlowNode) => {
  if (readonly.value) return;
  addNode(node as Node);
};

const onUpdateNode = (nodeId: string, updates: Partial<Node>) => {
  if (readonly.value) return;

  if (updates.position) {
    updateNodePosition(nodeId, updates.position);
  }

  if (updates.data) {
    updateNodeData(nodeId, updates.data);
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
  const node = nodes.value.find((n) => n.id === nodeId);
  if (node && node.data.component) {
    const updatedComponent = {
      ...node.data.component,
      name: newName,
    };
    updateNodeData(nodeId, {
      label: newName,
      component: updatedComponent,
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
</script>
