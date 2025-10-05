<template>
  <div class="h-full flex">
    <Sheet>
      <div v-if="isSidebarOpen.library" class="w-80 flex-shrink-0 border-r">
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
        v-if="!isSidebarOpen.library"
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
            :nodes="(page.data?.builder?.nodes as any) || []"
            :edges="(page.data?.builder?.edges as any) || []"
            @node-click="onNodeClick"
            @connect="onConnect"
            @edge-update="onEdgeUpdate"
            @update="onUpdate"
            @error="onError"
          />
        </div>
      </div>

      <SheetContent :show-overlay="false" :show-close-button="false">
        <div>
          <PropertiesSidebar
            :selected-node="selectedNode as any"
            :all-nodes="(page.data?.builder?.nodes as any) || []"
            @update-node="onUpdateNode as any"
            @delete-node="onDeleteNode as any"
          />
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { Node as VueFlowNode, Edge as VueFlowEdge } from '@vue-flow/core';
import LibrarySidebar from './builder/LibrarySidebar.vue';
import PropertiesSidebar from './builder/PropertiesSidebar.vue';
import CanvasArea from './builder/CanvasArea.vue';
import AppPanel from './Panel.vue';
import type { Node, Edge } from '~/types/builder.types';

const { setPage, page } = useApp();

const isSidebarOpen = ref({
  library: true,
  properties: true,
});

const openUploadComponentDialog = ref(false);

const librarySidebar = ref<InstanceType<typeof LibrarySidebar> | null>(null);

const externalBuilderUrl = ref(
  'https://dashboard.cog.hiro-develop.nl/notebook/admin/sai/lab/workspaces/auto-3/tree/register_component.ipynb',
);

const selectedNode = ref<VueFlowNode | null>(null);

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

// Watch for changes in page data and update selectedNode
watch(
  () => page.value.data?.builder?.nodes,
  (nodes) => {
    if (selectedNode.value && nodes) {
      const updatedNode = nodes.find(
        (node: Node) => node.id === selectedNode.value?.id,
      );
      if (updatedNode) {
        selectedNode.value = updatedNode;
      }
    }
  },
  { deep: true },
);
const toggleSidebar = (sidebar: 'library' | 'properties') => {
  console.log('Toggle sidebar:', sidebar);
  isSidebarOpen.value[sidebar] = !isSidebarOpen.value[sidebar];
  console.log('isSidebarOpen', isSidebarOpen.value);
};

const fetchComponents = () => {
  console.log('Fetch components');
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
  console.log('Drag started:', component);
};

const onNodeClick = (node: VueFlowNode | null) => {
  console.log('Builder onNodeClick - node:', node);
  selectedNode.value = node;
  console.log('Builder onNodeClick - selectedNode set to:', selectedNode.value);
};

const onConnect = (edge: VueFlowEdge) => {
  console.log('Connected:', edge);
};

const onEdgeUpdate = (edge: VueFlowEdge) => {
  console.log('Edge updated:', edge);
};

const onUpdate = (nodes: VueFlowNode[], edges: VueFlowEdge[]) => {
  console.log('Builder onUpdate called with nodes:', nodes);
  console.log('Builder onUpdate called with edges:', edges);
  setPage({
    ...page.value,
    data: {
      builder: {
        name: page.value.data?.builder?.name || '',
        nodes: nodes as Node[],
        edges: edges as Edge[],
      },
    },
  });
  console.log('Builder onUpdate - setPage called');
};

const onError = (errorKey: string, data?: Record<string, unknown>) => {
  console.error('Builder error:', errorKey, data);

  const toaster = useToaster();
  toaster.show('error', errorKey, {
    duration: 3000,
    ...data,
  });
};

const onUpdateNode = (nodeId: string, updates: Partial<Node>) => {
  console.log('Builder onUpdateNode - nodeId:', nodeId);
  console.log('Builder onUpdateNode - updates:', updates);

  const currentBuilder = page.value.data?.builder;
  if (currentBuilder?.nodes) {
    const nodeIndex = currentBuilder.nodes.findIndex(
      (node: Node) => node.id === nodeId,
    );
    console.log('Builder onUpdateNode - nodeIndex:', nodeIndex);
    if (nodeIndex !== -1) {
      console.log(
        'Builder onUpdateNode - old node:',
        currentBuilder.nodes[nodeIndex],
      );

      // Deep merge the updates
      const updatedNode = {
        ...currentBuilder.nodes[nodeIndex],
        ...updates,
        data: {
          ...currentBuilder.nodes[nodeIndex].data,
          ...updates.data,
        },
      };

      console.log('Builder onUpdateNode - new node:', updatedNode);

      // Create a completely new nodes array to trigger reactivity
      const newNodes = [...currentBuilder.nodes];
      newNodes[nodeIndex] = updatedNode;
      currentBuilder.nodes = newNodes;

      // Update selectedNode if it's the same node
      if (selectedNode.value?.id === nodeId) {
        selectedNode.value = updatedNode;
      }

      setPage({
        ...page.value,
        data: {
          ...page.value.data,
          builder: {
            ...currentBuilder,
            nodes: newNodes,
          },
        },
      });

      // Trigger CanvasArea update to sync the changes
      onUpdate(
        newNodes as VueFlowNode[],
        currentBuilder.edges as VueFlowEdge[],
      );
    }
  }
};

const onDeleteNode = (nodeId: string) => {
  console.log('Delete node:', nodeId);

  const currentBuilder = page.value.data?.builder;
  if (currentBuilder?.nodes) {
    currentBuilder.nodes = currentBuilder.nodes.filter(
      (node: Node) => node.id !== nodeId,
    );

    if (selectedNode.value?.id === nodeId) {
      selectedNode.value = null;
    }

    setPage({
      ...page.value,
      data: {
        ...page.value.data,
        builder: currentBuilder,
      },
    });
  }
};
</script>
