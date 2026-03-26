<template>
  <Sheet :open="open" @update:open="(v) => emit('update:open', v)">
    <SheetContent
      class="sm:max-w-lg gap-2 p-0"
      :show-overlay="false"
      :show-close-button="false"
      :disable-outside-pointer-events="false"
      :trap-focus="false"
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
      <SheetTitle class="sr-only">Properties</SheetTitle>
      <SheetDescription class="sr-only">
        Edit the properties, input parameters, and output parameters for the selected component
      </SheetDescription>

      <!-- Separate top section with close button -->
      <div class="flex items-center justify-end px-2 py-2 border-b">
        <DialogClose
          class="h-6 w-6 flex items-center justify-center cursor-pointer hover:bg-accent rounded-sm transition-colors"
        >
          <Icon name="lucide:x" class="size-4" />
          <span class="sr-only">Close</span>
        </DialogClose>
      </div>

      <div v-if="selectedNode">
        <BuilderNodeProperties
          :readonly="readonly"
          :selected-node="selectedNode"
          :all-nodes="allNodes"
          :pipeline-data="pipelineData"
          @update-node="(id, updates) => emit('update-node', id, updates)"
          @delete-node="(id) => emit('delete-node', id)"
          @rename-component="
            (id, oldName, newName) =>
              emit('rename-component', id, oldName, newName)
          "
          @create-parameter="(param) => emit('create-parameter', param)"
          @manage-parameters="emit('manage-parameters')"
        />
      </div>
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
import BuilderNodeProperties from './BuilderNodeProperties.vue';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { DialogClose } from '@/components/ui/dialog';
import type { Node, NodeUpdate, PipelineInputParam } from '~/types/builder.types';

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
  (e: 'create-parameter', param: PipelineInputParam): void;
  (e: 'manage-parameters'): void;
}>();
</script>
