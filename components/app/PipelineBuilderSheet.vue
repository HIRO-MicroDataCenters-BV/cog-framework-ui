<template>
  <Sheet :open="open" @update:open="(v) => emit('update:open', v)">
    <SheetContent
      :show-overlay="false"
      :show-close-button="true"
      :disable-outside-pointer-events="false"
      @pointer-down-outside="
        (event) => {
          const originalEvent = event.detail.originalEvent;
          const target = originalEvent.target as HTMLElement;
          const nodeElement = target.closest('.vue-flow__node');

          // Prevent sheet from closing when clicking ANY node
          // Let the selectNode toggle logic handle open/close
          if (nodeElement) {
            event.preventDefault();
          }
        }
      "
      @interact-outside="
        (event) => {
          const target = event.target as HTMLElement;
          const nodeElement = target.closest('.vue-flow__node');

          // Prevent sheet from closing when clicking ANY node
          if (nodeElement) {
            event.preventDefault();
          }
        }
      "
    >
      <div>
        <PropertiesSidebar
          :readonly="readonly"
          :selected-node="selectedNode"
          :all-nodes="allNodes"
          :pipeline-data="pipelineData"
          @update-node="(id, updates) => emit('update-node', id, updates)"
          @delete-node="(id) => emit('delete-node', id)"
          @rename-component="(id, oldName, newName) => emit('rename-component', id, oldName, newName)"
        />
      </div>
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
import { Sheet, SheetContent } from '@/components/ui/sheet';
import PropertiesSidebar from './builder/PropertiesSidebar.vue';
import type { Node, NodeUpdate } from '~/types/builder.types';

defineProps<{
  open: boolean;
  readonly?: boolean;
  selectedNode: Node | null;
  allNodes: Node[];
  pipelineData: unknown;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'update-node', id: string, updates: NodeUpdate): void;
  (e: 'delete-node', id: string): void;
  (e: 'rename-component', id: string, oldName: string, newName: string): void;
}>();
</script>
