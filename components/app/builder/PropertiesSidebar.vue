<template>
  <div>
    <div v-if="!selectedNode" class="text-center text-muted-foreground py-8">
      <Icon name="lucide:mouse-pointer" class="w-8 h-8 mx-auto mb-2" />
      <p>{{ $t('builder.empty_selection') }}</p>
    </div>

    <div v-else class="space-y-4">
      <SheetHeader class="p-4 px-8 flex justify-between border-b">
        <SheetTitle
          class="text-sm font-medium text-gray-500 flex-1 ml-8 cursor-pointer"
        >
          <Input v-model="nodeName" type="text" />
        </SheetTitle>
      </SheetHeader>
      <DialogClose class="h-4 w-4 absolute top-4 left-8 cursor-pointer">
        <Icon name="lucide:x" class="size-4" />
        <span class="sr-only">Close</span>
      </DialogClose>
      <div class="p-4">
        <div class="mb-4">
          <h3 class="mb-2">
            {{ $t('label.input_path') }}
          </h3>
          <div>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div class="flex items-center gap-2 text-gray-500">
                <Icon name="lucide:text" class="size-4" />{{
                  selectedNode.data?.component?.input_path[0].name
                }}<span></span>
              </div>
              <div>{{ selectedNode.data?.component?.input_path[0].type }}</div>
            </div>
          </div>
        </div>
        <div class="mb-4">
          <h3 class="mb-2">
            {{ $t('label.output_path') }}
          </h3>
          <div>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div class="flex items-center gap-2 text-gray-500">
                <Icon name="lucide:text" class="size-4" />{{
                  selectedNode.data?.component?.output_path[0].name
                }}<span></span>
              </div>
              <div>{{ selectedNode.data?.component?.output_path[0].type }}</div>
            </div>
          </div>
        </div>
        <div class="mb-4">
          <h3 class="mb-2">
            {{ $t('label.properties') }}
          </h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4 text-sm items-start">
              <div class="flex items-center gap-2 text-gray-500">
                <Icon name="lucide:text" class="size-4" />{{
                  $t('label.category')
                }}<span></span>
              </div>
              <div>{{ selectedNode.data?.component?.category }}</div>
            </div>
            <div class="grid grid-cols-2 gap-4 text-sm items-start">
              <div class="flex items-center gap-2 text-gray-500">
                <Icon name="lucide:text" class="size-4" />{{
                  $t('label.component_file')
                }}<span></span>
              </div>
              <div>
                <p class="overflow-hidden text-ellipsis">
                  {{ selectedNode.data?.component?.component_file }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Node {
  id: string;
  type: string;
  data?: {
    label?: string;
    [key: string]: unknown;
  };
}

interface Props {
  selectedNode: Node | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  updateNode: [nodeId: string, updates: Partial<Node>];
  deleteNode: [nodeId: string];
}>();

const nodeName = ref('');
const nodeDescription = ref('');
const connectionString = ref('');
const filterCondition = ref('');
const transformExpression = ref('');
const selectedNodeLabel = ref('');

watch(
  () => props.selectedNode,
  (newNode) => {
    if (newNode) {
      nodeName.value = (newNode.data?.label as string) || '';
      nodeDescription.value = (newNode.data?.description as string) || '';
      connectionString.value = (newNode.data?.connectionString as string) || '';
      filterCondition.value = (newNode.data?.filterCondition as string) || '';
      transformExpression.value =
        (newNode.data?.transformExpression as string) || '';
      selectedNodeLabel.value = (newNode.data?.label as string) || '';
    }
  },
  { immediate: true },
);

function updateNode() {
  if (props.selectedNode) {
    const updates: Partial<Node> = {
      data: {
        ...props.selectedNode.data,
        label: selectedNodeLabel.value,
        description: nodeDescription.value,
        connectionString: connectionString.value,
        filterCondition: filterCondition.value,
        transformExpression: transformExpression.value,
      } as Record<string, unknown>,
    };
    console.log('props.selectedNode', props.selectedNode.data);
    emit('updateNode', props.selectedNode.id, updates);
  }
}

function deleteNode() {
  if (props.selectedNode) {
    emit('deleteNode', props.selectedNode.id);
  }
}
watch(
  [
    nodeName,
    nodeDescription,
    connectionString,
    filterCondition,
    transformExpression,
  ],
  () => {
    updateNode();
  },
  { deep: true },
);
</script>
