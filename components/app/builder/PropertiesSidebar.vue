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
          <div>
            <Input
              v-if="!readonly"
              v-model="nodeName"
              type="text"
              :placeholder="$t('placeholder.component_name')"
              :class="{ 'border-red-500': !isComponentNameValid }"
            />
            <div v-else>{{ selectedNode.data?.label }}</div>

            <div v-if="componentNameError" class="text-red-500 text-sm mt-1">
              {{ componentNameError }}
            </div>
          </div>
        </SheetTitle>
      </SheetHeader>
      <DialogClose class="h-4 w-4 absolute top-4 left-8 cursor-pointer">
        <Icon name="lucide:x" class="size-4" />
        <span class="sr-only">Close</span>
      </DialogClose>
      <div class="p-4">
        <PathSection :title="$t('label.input_path')" :paths="inputPaths" />
        <PathSection :title="$t('label.output_path')" :paths="outputPaths" />
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
import { ref, reactive, watch, computed, nextTick } from 'vue';
import PathSection from './PathSection.vue';
import { Input } from '~/components/ui/input';

const { t } = useI18n();

interface Node {
  id: string;
  type: string;
  data?: {
    label?: string;
    component?: {
      input_path?: Array<{ name: string; type: string }>;
      output_path?: Array<{ name: string; type: string }>;
      category?: string;
      component_file?: string;
    };
    [key: string]: unknown;
  };
}

interface Props {
  selectedNode?: Node | null;
  allNodes?: Node[];
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selectedNode: null,
  allNodes: () => [],
  readonly: false,
});

const readonly = computed(() => props.readonly);

const emit = defineEmits<{
  updateNode: [nodeId: string, updates: Partial<Node>];
  deleteNode: [nodeId: string];
}>();
const formData = reactive({
  nodeName: '',
  nodeDescription: '',
  connectionString: '',
  filterCondition: '',
  transformExpression: '',
});

const selectedNodeLabel = ref('');

const nodeName = computed({
  get: () => formData.nodeName,
  set: (value: string) => {
    formData.nodeName = value;
  },
});
const nodeDescription = computed({
  get: () => formData.nodeDescription,
  set: (value: string) => {
    formData.nodeDescription = value;
  },
});
const connectionString = computed({
  get: () => formData.connectionString,
  set: (value: string) => {
    formData.connectionString = value;
  },
});
const filterCondition = computed({
  get: () => formData.filterCondition,
  set: (value: string) => {
    formData.filterCondition = value;
  },
});
const transformExpression = computed({
  get: () => formData.transformExpression,
  set: (value: string) => {
    formData.transformExpression = value;
  },
});

const renderPathList = (paths: Array<{ name: string; type: string }>) => {
  return (
    paths?.map((path, index) => ({
      name: path.name,
      type: path.type,
      key: `path-${index}`,
    })) || []
  );
};

const inputPaths = computed(() =>
  renderPathList(props.selectedNode?.data?.component?.input_path || []),
);
const outputPaths = computed(() =>
  renderPathList(props.selectedNode?.data?.component?.output_path || []),
);

const existingNodeNames = computed(() => {
  if (!props.allNodes) return [];
  const currentId = props.selectedNode?.id;
  return props.allNodes
    .filter((node) => node.id !== currentId)
    .map((node) => node.data?.label as string)
    .filter(Boolean);
});
const componentNameError = computed(() => {
  const name = formData.nodeName;

  if (!name || name.trim() === '') {
    return t('validation.component.name_required');
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    return t('validation.component.name_format');
  }

  if (existingNodeNames.value.includes(name)) {
    return t('validation.component.name_unique');
  }

  return null;
});

const isComponentNameValid = computed(() => {
  return componentNameError.value === null;
});

watch(
  () => props.selectedNode,
  (newNode) => {
    if (newNode) {
      const label = (newNode.data?.label as string) || '';
      nextTick(() => {
        formData.nodeName = label;
      });

      formData.nodeDescription = (newNode.data?.description as string) || '';
      formData.connectionString =
        (newNode.data?.connectionString as string) || '';
      formData.filterCondition =
        (newNode.data?.filterCondition as string) || '';
      formData.transformExpression =
        (newNode.data?.transformExpression as string) || '';
      selectedNodeLabel.value = label;
    }
  },
  { immediate: true },
);

function updateNode() {
  if (props.selectedNode) {
    const updates: Partial<Node> = {
      data: {
        ...props.selectedNode.data,
        label: formData.nodeName,
        description: formData.nodeDescription,
        connectionString: formData.connectionString,
        filterCondition: formData.filterCondition,
        transformExpression: formData.transformExpression,
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
  () => formData.nodeName,
  (newValue) => {
    selectedNodeLabel.value = newValue;
  },
);

watch(
  () => formData,
  () => {
    updateNode();
  },
  { deep: true },
);
</script>
