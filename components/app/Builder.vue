<template>
  <div class="h-full flex">
    <div class="w-80 flex-shrink-0 border-r">
      <AppPanel :title="$t('builder.components')">
        <template #actions>
          <button
            class="p-1 rounded hover:bg-muted"
            :title="$t('menu.documentation')"
          >
            <Icon name="lucide:file-code" class="w-4 h-4" />
          </button>
          <button
            class="p-1 rounded hover:bg-muted"
            :title="$t('action.refresh')"
          >
            <Icon name="lucide:refresh-cw" class="w-4 h-4" />
          </button>
          <button
            class="p-1 rounded hover:bg-muted"
            :title="$t('action.minimize')"
          >
            <Icon name="lucide:minimize-2" class="w-4 h-4" />
          </button>
        </template>
        <LibrarySidebar @drag-start="onDragStart" />
      </AppPanel>
    </div>

    <div class="flex-1 flex flex-col">
      <div class="flex-1">
        <CanvasArea
          @node-click="onNodeClick"
          @connect="onConnect"
          @edge-update="onEdgeUpdate"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import LibrarySidebar from './builder/LibrarySidebar.vue';
import PropertiesSidebar from './builder/PropertiesSidebar.vue';
import CanvasArea from './builder/CanvasArea.vue';
import AppPanel from './Panel.vue';

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

const selectedNode = ref<Node | null>(null);

function onDragStart(component: unknown) {
  console.log('Drag started:', component);
}

function onNodeClick(node: Node | null) {
  selectedNode.value = node;
}

function onConnect(edge: Edge) {
  console.log('Connected:', edge);
}

function onEdgeUpdate(edge: Edge) {
  console.log('Edge updated:', edge);
}

function onUpdateNode(nodeId: string, updates: unknown) {
  console.log('Update node:', nodeId, updates);
}

function onDeleteNode(nodeId: string) {
  console.log('Delete node:', nodeId);
  selectedNode.value = null;
}

function onDeleteSelected() {
  if (selectedNode.value) {
    onDeleteNode(selectedNode.value.id);
  }
}
</script>
