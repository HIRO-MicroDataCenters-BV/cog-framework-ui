<template>
  <div>
    <div v-if="!selectedNode" class="text-center text-muted-foreground py-8">
      <Icon name="lucide:mouse-pointer" class="w-8 h-8 mx-auto mb-2" />
      <p>{{ $t('builder.empty_selection') }}</p>
    </div>

    <div v-else class="space-y-4">
      <div>
        <h4 class="text-sm font-medium mb-2">
          {{ selectedNode.data?.label || 'Component' }}
        </h4>
        <p class="text-xs text-muted-foreground">{{ selectedNode.type }}</p>
      </div>

      <div class="space-y-3">
        <div>
          <label class="text-sm font-medium">{{ $t('label.name') }}</label>
          <input
            v-model="nodeName"
            class="w-full mt-1 px-3 py-2 border rounded-md text-sm"
            :placeholder="$t('placeholder.name')"
          />
        </div>

        <div>
          <label class="text-sm font-medium">
            {{ $t('label.description') }}
          </label>
          <textarea
            v-model="nodeDescription"
            class="w-full mt-1 px-3 py-2 border rounded-md text-sm"
            rows="3"
            :placeholder="$t('placeholder.description')"
          />
        </div>

        <div v-if="selectedNode.type === 'data-source'">
          <label class="text-sm font-medium">
            {{ $t('label.connection_string') }}
          </label>
          <input
            v-model="connectionString"
            class="w-full mt-1 px-3 py-2 border rounded-md text-sm"
            :placeholder="$t('placeholder.connection_string')"
          />
        </div>

        <div v-if="selectedNode.type === 'filter'">
          <label class="text-sm font-medium">
            {{ $t('label.filter_condition') }}
          </label>
          <input
            v-model="filterCondition"
            class="w-full mt-1 px-3 py-2 border rounded-md text-sm"
            :placeholder="$t('placeholder.filter_condition')"
          />
        </div>

        <div v-if="selectedNode.type === 'transform'">
          <label class="text-sm font-medium">
            {{ $t('label.transform_expression') }}
          </label>
          <textarea
            v-model="transformExpression"
            class="w-full mt-1 px-3 py-2 border rounded-md text-sm"
            rows="2"
            :placeholder="$t('placeholder.transform_expression')"
          />
        </div>
      </div>

      <div class="pt-4 border-t">
        <button
          class="w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
          @click="deleteNode"
        >
          <Icon name="lucide:trash-2" class="w-4 h-4 inline mr-2" />
          {{ $t('action.delete_component') }}
        </button>
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
    }
  },
  { immediate: true },
);

function updateNode() {
  if (props.selectedNode) {
    const updates: Partial<Node> = {
      data: {
        ...props.selectedNode.data,
        label: nodeName.value,
        description: nodeDescription.value,
        connectionString: connectionString.value,
        filterCondition: filterCondition.value,
        transformExpression: transformExpression.value,
      } as Record<string, unknown>,
    };
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
