<template>
  <div>
    <div v-if="!selectedNode" class="text-center text-muted-foreground py-8">
      <Icon name="lucide:mouse-pointer" class="w-8 h-8 mx-auto mb-2" />
      <p>{{ $t('builder.empty_selection') }}</p>
    </div>

    <div v-else class="space-y-4 px-0">
      <!-- HUD Container -->
      <div class="overflow-hidden">
        <div class="px-2 pt-1 pb-0">
          <div class="flex gap-2 items-center">
            <Input
              v-if="!readonly"
              v-model="nodeName"
              type="text"
              :placeholder="$t('placeholder.component_name')"
              class="h-8 font-semibold bg-transparent flex-1"
              :class="{ 'text-red-500': !isComponentNameValid }"
              @keydown.enter="onSaveComponentName"
            />
            <Button
              v-if="!readonly"
              type="button"
              variant="outline"
              size="sm"
              class="h-8 px-2.5 shrink-0"
              :disabled="!hasNameChanged || !isComponentNameValid"
              :title="$t('action.save')"
              @click="onSaveComponentName"
            >
              <Icon name="lucide:check" class="size-4 shrink-0" />
            </Button>
            <div v-else class="font-semibold px-2">
              {{ selectedNode.data?.label }}
            </div>
          </div>
          <!-- Error sits under the name row; min-h keeps layout stable when it appears -->
          <div
            v-if="!readonly"
            class="mt-1 min-h-4.5"
            aria-live="polite"
          >
            <p
              v-if="componentNameError"
              class="text-xs font-medium text-red-500 leading-tight"
            >
              {{ componentNameError }}
            </p>
          </div>
        </div>

        <div
          class="px-2 pt-1.5 pb-3 overflow-y-auto max-h-[calc(100vh-140px)] space-y-3"
        >
          <!-- INPUT block -->
          <div class="rounded-lg border border-border overflow-hidden">
            <div
              class="flex items-center gap-2 px-2 py-2 bg-muted/40 border-b border-border"
            >
              <span
                class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                >Input Parameters</span
              >
            </div>

            <!-- Input Parameters -->
            <div>
              <div
                v-if="inputDefinitions.length"
                class="divide-y divide-border/50"
              >
                <div
                  v-for="inputDef in inputDefinitions"
                  :key="inputDef.name"
                  class="px-2 py-2.5"
                >
                  <InputParameterEditor
                    :input-definition="inputDef"
                    :input="getInputForDefinition(inputDef)"
                    :available-components="availableUpstreamComponents"
                    :pipeline-params="pipelineParameters"
                    :readonly="readonly"
                    @update="
                      (updatedInput) => onInputUpdate(inputDef, updatedInput)
                    "
                  />
                </div>
              </div>
              <p v-else class="px-2 py-2 text-xs text-muted-foreground italic">
                None
              </p>
            </div>
          </div>

          <!-- OUTPUT block -->
          <div class="rounded-lg border border-border overflow-hidden">
            <div
              class="flex items-center gap-2 px-2 py-2 bg-muted/40 border-b border-border"
            >
              <span
                class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                >Output Parameters</span
              >
            </div>

            <!-- Output Parameters -->
            <div>
              <div v-if="outputPaths.length" class="divide-y divide-border/50">
                <div
                  v-for="path in outputPaths"
                  :key="path.key"
                  class="flex items-center justify-between gap-3 px-2 py-2"
                >
                  <span class="text-xs font-medium text-foreground shrink-0">{{
                    path.name
                  }}</span>
                  <span
                    class="text-xs text-muted-foreground text-right break-all"
                    >{{ path.type }}</span
                  >
                </div>
              </div>
              <p v-else class="px-2 py-2 text-xs text-muted-foreground italic">
                None
              </p>
            </div>
          </div>

          <div class="mb-4">
            <h3
              class="mb-2 text-xs uppercase text-muted-foreground flex items-center gap-2"
            >
              <Icon name="lucide:settings-2" class="w-3 h-3" />
              {{ $t('label.properties') }}
            </h3>
            <div class="space-y-3">
              <div class="grid grid-cols-2 gap-4 text-sm items-center">
                <div class="flex items-center gap-2 text-muted-foreground">
                  <Icon name="lucide:folder" class="size-3" />
                  Category
                </div>
                <div
                  class="font-medium text-right lowercase first-letter:uppercase"
                >
                  {{ selectedNode.data?.component?.category }}
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4 text-sm items-center">
                <div class="flex items-center gap-2 text-muted-foreground">
                  <Icon name="lucide:file-code" class="size-3" />
                  {{ $t('label.component_file') }}
                </div>
                <div class="text-right">
                  <p
                    class="truncate font-mono text-xs max-w-[150px] ml-auto px-2 py-1"
                  >
                    {{ selectedNode.data?.component?.component_file }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Same surface as DeleteConfirmationDialog "Delete Anyway" (default + destructive utilities; avoids Button destructive variant dark:bg-destructive/60) -->
          <Button
            v-if="!readonly"
            variant="default"
            size="sm"
            class="w-full mt-4 bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90"
            @click="onDelete"
          >
            <Icon name="lucide:trash-2" class="w-4 h-4 mr-2" />
            {{ $t('action.delete') }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, nextTick } from 'vue';
import InputParameterEditor from './InputParameterEditor.vue';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { SheetTitle } from '~/components/ui/sheet';
import type {
  ComponentInput,
  ComponentPath,
  PipelineInputParam,
  Node,
  NodeUpdate,
} from '~/types/builder.types';
import { validateComponentInput } from '~/utils/builder-validation';
import { useBuilderColors } from '~/composables/useBuilderColors';

const { t } = useI18n();
const { page } = useApp();
const { getCategoryColor } = useBuilderColors();

interface Props {
  selectedNode?: Node | null;
  allNodes?: Node[];
  readonly?: boolean;
  pipelineData?: unknown;
}

const props = withDefaults(defineProps<Props>(), {
  selectedNode: null,
  allNodes: () => [],
  readonly: false,
  pipelineData: undefined,
});

const readonly = computed(() => props.readonly);

const emit = defineEmits<{
  updateNode: [nodeId: string, updates: NodeUpdate];
  deleteNode: [nodeId: string, componentName: string];
  renameComponent: [nodeId: string, oldName: string, newName: string];
}>();
const formData = reactive({
  nodeName: '',
  nodeDescription: '',
  connectionString: '',
  filterCondition: '',
  transformExpression: '',
});

const selectedNodeLabel = ref('');
const previousNodeName = ref('');

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

// Input definitions from component's input_path
const inputDefinitions = computed(() => {
  return props.selectedNode?.data?.component?.input_path || [];
});

// Get current inputs array from component
const currentInputs = computed(() => {
  return props.selectedNode?.data?.component?.inputs || [];
});

// Get input for a specific definition
function getInputForDefinition(
  inputDef: ComponentPath,
): ComponentInput | undefined {
  const existingInput = currentInputs.value.find(
    (input) => input.destination === inputDef.name,
  );

  // If input exists, return it
  if (existingInput) {
    return existingInput;
  }

  // If no input exists but inputDef has a default, create a default input
  if (inputDef.default !== undefined && inputDef.default !== null) {
    return {
      destination: inputDef.name,
      value_source_type: 'constant',
      source: String(inputDef.default),
    };
  }

  // No input and no default - return undefined
  return undefined;
}

// Available upstream components (all nodes except current)
const availableUpstreamComponents = computed(() => {
  if (!props.allNodes || !props.selectedNode) return [];
  return props.allNodes.filter((node) => node.id !== props.selectedNode?.id);
});

// Check if any input has validation errors
const hasValidationErrors = computed(() => {
  if (!props.selectedNode || inputDefinitions.value.length === 0) return false;

  return inputDefinitions.value.some((inputDef) => {
    const input = getInputForDefinition(inputDef);
    // Skip if no input configured (may be optional)
    if (!input) return false;

    const error = validateComponentInput(
      input,
      inputDef,
      availableUpstreamComponents.value,
      pipelineParameters.value,
    );
    return error !== null;
  });
});

// Helper function to infer type from value
function inferTypeFromValue(value: unknown): string {
  if (typeof value === 'string') {
    // Check if it's a number
    if (!isNaN(Number(value))) {
      return value.includes('.') ? 'Float' : 'Integer';
    }
    // Check if it's a boolean
    if (value === 'true' || value === 'false') return 'Boolean';
  }
  return 'String';
}

// Pipeline parameters from runtime_config
const pipelineParameters = computed((): PipelineInputParam[] => {
  console.log('[BuilderNodeProperties] pipelineData:', props.pipelineData);

  // Type guard for pipelineData
  const data = props.pipelineData as
    | {
        runtime_config?: { parameters?: Record<string, unknown> };
      }
    | null
    | undefined;

  console.log('[BuilderNodeProperties] runtime_config:', data?.runtime_config);

  if (!data?.runtime_config?.parameters) return [];

  const params = Object.entries(data.runtime_config.parameters).map(
    ([name, value]) => ({
      name,
      default: value as string,
      type: inferTypeFromValue(value),
    }),
  );

  console.log('[BuilderNodeProperties] pipelineParameters:', params);
  return params;
});

// Handle input update
function onInputUpdate(inputDef: ComponentPath, updatedInput: ComponentInput) {
  if (!props.selectedNode) return;

  // Get current inputs or initialize empty array
  const inputs = [...currentInputs.value];

  // Find existing input index
  const existingIndex = inputs.findIndex(
    (input) => input.destination === inputDef.name,
  );

  if (existingIndex >= 0) {
    // Update existing input
    inputs[existingIndex] = updatedInput;
  } else {
    // Add new input
    inputs.push(updatedInput);
  }

  // Update node status - only send partial updates for status and component.inputs
  emit('updateNode', props.selectedNode.id, {
    data: {
      component: {
        inputs,
      },
    },
  });
}

function updateNode() {
  if (props.selectedNode) {
    const updates: NodeUpdate = {
      data: {
        label: formData.nodeName,
        description: formData.nodeDescription,
        connectionString: formData.connectionString,
        filterCondition: formData.filterCondition,
        transformExpression: formData.transformExpression,
      },
    };
    emit('updateNode', props.selectedNode.id, updates);
  }
}

const onDelete = () => {
  if (props.selectedNode) {
    emit('deleteNode', props.selectedNode.id, formData.nodeName);
  }
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

  if (!/^[a-zA-Z0-9_\s-]+$/.test(name)) {
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

const hasNameChanged = computed(() => {
  return (
    formData.nodeName !== previousNodeName.value &&
    formData.nodeName.trim() !== ''
  );
});

const onSaveComponentName = () => {
  if (!props.selectedNode || !isComponentNameValid.value) return;

  const oldName = previousNodeName.value;
  const newName = formData.nodeName;

  if (oldName !== newName && newName && oldName) {
    emit('renameComponent', props.selectedNode.id, oldName, newName);
    previousNodeName.value = newName;
  }
};

watch(
  () => props.selectedNode,
  (newNode, oldNode) => {
    // Only update form data if:
    // 1. We switched to a different node (ID change)
    // 2. We have a new node and no old node (initial selection)

    if (newNode && newNode.id !== oldNode?.id) {
      // New node selected - Full Reset
      const label = (newNode.data?.label as string) || '';
      formData.nodeName = label;
      previousNodeName.value = label;

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

// Watch for specific field changes to update the node
// We avoid a deep watcher on formData to prevent unnecessary full-object syncs
// Component name is now saved manually via save button, not auto-saved
watch(
  () => formData.nodeName,
  (newName) => {
    if (!props.selectedNode) return;
    selectedNodeLabel.value = newName;
  },
);

// Update description and other fields
watch(
  [
    () => formData.nodeDescription,
    () => formData.connectionString,
    () => formData.filterCondition,
    () => formData.transformExpression,
  ],
  () => {
    updateNode();
  },
);

// Watch for validation errors and update node status
watch(
  hasValidationErrors,
  (hasErrors) => {
    if (!props.selectedNode || props.readonly) return;

    const currentStatus = props.selectedNode.data?.status;
    const newStatus = hasErrors ? 'invalid' : undefined;

    if (currentStatus === newStatus) return;

    // Partial update for status ONLY
    emit('updateNode', props.selectedNode.id, {
      data: {
        status: newStatus,
      },
    });
  },
  { immediate: true },
);
</script>
