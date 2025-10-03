<template>
  <div class="h-full flex">
    <Sheet>
      <div v-if="isSidebarOpen.library" class="w-80 flex-shrink-0 border-r">
        <AppPanel :title="$t('builder.components')">
          <template #actions>
            <button
              class="p-1 rounded hover:bg-muted"
              :title="$t('menu.documentation')"
              @click="openExternalBuilder"
            >
              <Icon name="lucide:file-code" class="w-4 h-4" />
            </button>
            <button
              class="p-1 rounded hover:bg-muted"
              :title="$t('action.refresh')"
              @click="fetchComponents"
            >
              <Icon name="lucide:refresh-cw" class="w-4 h-4" />
            </button>
            <button
              class="p-1 rounded hover:bg-muted"
              :title="$t('action.minimize')"
              @click="toggleSidebar('library')"
            >
              <Icon name="lucide:minimize-2" class="w-4 h-4" />
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
            class="p-1 rounded hover:bg-muted"
            :title="$t('menu.documentation')"
            @click="openExternalBuilder"
          >
            <Icon name="lucide:file-code" class="w-4 h-4" />
          </button>
          <button
            class="p-1 rounded hover:bg-muted"
            :title="$t('action.refresh')"
            @click="fetchComponents"
          >
            <Icon name="lucide:refresh-cw" class="w-4 h-4" />
          </button>
          <button
            class="p-1 rounded hover:bg-muted"
            :title="$t('action.maximize')"
            @click="toggleSidebar('library')"
          >
            <Icon name="lucide:maximize-2" class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div class="flex-1 flex flex-col">
        <div class="flex-1">
          <CanvasArea
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
          <PropertiesSidebar :selectedNode="selectedNode as any" />
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import LibrarySidebar from './builder/LibrarySidebar.vue';
import PropertiesSidebar from './builder/PropertiesSidebar.vue';
import CanvasArea from './builder/CanvasArea.vue';
import AppPanel from './Panel.vue';
import type { Node, Edge } from '~/types/builder.types';
import type { Node as VueFlowNode, Edge as VueFlowEdge } from '@vue-flow/core';

const { setPage, page } = useApp();

const isSidebarOpen = ref({
  library: true,
  properties: true,
});

const librarySidebar = ref<InstanceType<typeof LibrarySidebar> | null>(null);

const externalBuilderUrl = ref(
  'https://dashboard.cog.hiro-develop.nl/notebook/admin/sai/lab/workspaces/auto-3/tree/register_component.ipynb',
);

const selectedNode = ref<VueFlowNode | null>(null);
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
  selectedNode.value = node;
};

const onConnect = (edge: VueFlowEdge) => {
  console.log('Connected:', edge);
};

const onEdgeUpdate = (edge: any) => {
  console.log('Edge updated:', edge);
};

const onUpdate = (nodes: VueFlowNode[], edges: VueFlowEdge[]) => {
  console.log('Update:', nodes, edges);
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
};

const onError = (errorKey: string) => {
  console.error('Builder error:', errorKey);

  const toaster = useToaster();
  toaster.show('error', errorKey, {
    duration: 3000,
  });
};
</script>
