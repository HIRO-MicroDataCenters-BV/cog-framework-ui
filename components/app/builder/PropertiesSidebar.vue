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

            <div
              v-if="componentNameError && !readonly"
              class="text-red-500 text-sm mt-1"
            >
              {{ componentNameError }}
            </div>
          </div>
        </SheetTitle>
      </SheetHeader>
      <DialogClose class="h-4 w-4 absolute top-4 left-8 cursor-pointer">
        <Icon name="lucide:x" class="size-4" />
        <span class="sr-only">Close</span>
      </DialogClose>
      <div class="p-4 overflow-y-auto h-[calc(100vh-85px)]">
        <!-- Editable Input Parameters -->
        <div class="mb-4">
          <h3 class="mb-2">{{ $t('label.input_path') }}</h3>
          <div class="space-y-2">
            <InputParameterEditor
              v-for="(inputDef, index) in inputDefinitions"
              :key="`input-${index}`"
              :input-definition="inputDef"
              :input="getInputForDefinition(inputDef)"
              :available-components="availableUpstreamComponents"
              :pipeline-params="pipelineParameters"
              :readonly="readonly"
              @update="(updatedInput) => onInputUpdate(inputDef, updatedInput)"
            />
            <div
              v-if="inputDefinitions.length === 0"
              class="text-sm text-gray-500"
            >
              No input parameters defined
            </div>
          </div>
        </div>

        <PathSection :title="$t('label.output_path')" :paths="outputPaths" />
        <div class="mb-4">
          <h3 class="mb-2">
            {{ $t('label.properties') }}
          </h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4 text-sm items-start">
              <div class="flex items-center gap-2 text-gray-500">
                <Icon name="lucide:folder" class="size-4" />
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
        <AlertDialog>
          <AlertDialogTrigger as-child>
            <Button
              variant="destructive"
              size="sm"
              class="w-full mt-8"
              :disabled="readonly"
            >
              <Icon name="lucide:trash-2" class="w-4 h-4 mr-2" />
              {{ $t('action.delete') }}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{{
                $t('builder.delete_component_title')
              }}</AlertDialogTitle>
              <AlertDialogDescription>
                {{ $t('title.are_you_sure') }}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{{ $t('action.cancel') }}</AlertDialogCancel>
              <AlertDialogAction @click="onDelete">{{
                $t('action.delete')
              }}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, nextTick } from 'vue';
import PathSection from './PathSection.vue';
import InputParameterEditor from './InputParameterEditor.vue';
import { Input } from '~/components/ui/input';
import { SheetTitle } from '~/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog';
import type {
  ComponentInput,
  ComponentPath,
  PipelineInputParam,
  Node,
} from '~/types/builder.types';
import { validateComponentInput } from '~/utils/builder-validation';

const { t } = useI18n();

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
  return currentInputs.value.find(
    (input) => input.destination === inputDef.name,
  );
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

// Pipeline parameters (empty for now, will be implemented later)
const pipelineParameters = computed((): PipelineInputParam[] => {
  // TODO: Get from builder state when pipeline parameters UI is implemented
  return [];
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

  // Update node status based on validation
  const hasErrors = inputDefinitions.value.some((def) => {
    const inp = inputs.find((i) => i.destination === def.name);
    if (!inp) return false;
    return (
      validateComponentInput(
        inp,
        def,
        availableUpstreamComponents.value,
        pipelineParameters.value,
      ) !== null
    );
  });

  // Emit update to parent
  emit('updateNode', props.selectedNode.id, {
    data: {
      ...props.selectedNode.data,
      status: hasErrors ? 'invalid' : undefined,
      component: {
        ...props.selectedNode.data?.component,
        inputs,
      },
    },
  });
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

watch(
  () => props.selectedNode,
  (newNode) => {
    if (newNode) {
      const label = (newNode.data?.label as string) || '';
      nextTick(() => {
        formData.nodeName = label;
        previousNodeName.value = label; // Track initial name
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

// Watch for component rename to update all references
watch(
  () => formData.nodeName,
  (newName) => {
    if (!props.selectedNode || !previousNodeName.value) return;

    const oldName = previousNodeName.value;

    // Only emit rename if name actually changed and is valid
    if (
      oldName !== newName &&
      newName &&
      oldName &&
      isComponentNameValid.value
    ) {
      emit('renameComponent', props.selectedNode.id, oldName, newName);
      previousNodeName.value = newName; // Update tracked name
    }
  },
);

// Watch for validation errors and update node status
watch(
  hasValidationErrors,
  (hasErrors) => {
    if (!props.selectedNode || props.readonly) return;

    // Check if status actually needs update to avoid re-renders interrupting drag
    const currentStatus = props.selectedNode.data?.status;
    const newStatus = hasErrors ? 'invalid' : undefined;

    if (currentStatus === newStatus) return;

    // Update node status based on validation
    emit('updateNode', props.selectedNode.id, {
      data: {
        ...props.selectedNode.data,
        status: newStatus,
      },
    });
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
    const componentName = (props.selectedNode.data?.label as string) || '';
    emit('deleteNode', props.selectedNode.id, componentName);
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
