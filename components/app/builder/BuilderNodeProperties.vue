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
              class="h-7 px-2 text-xs font-semibold bg-transparent flex-1"
              :class="{ 'text-red-500': !isComponentNameValid }"
              @keydown.enter="onSaveComponentName"
            />
            <Button
              v-if="!readonly"
              type="button"
              variant="outline"
              size="sm"
              class="h-7 px-2.5 shrink-0"
              :disabled="!hasNameChanged"
              :title="$t('action.cancel')"
              @click="onCancelComponentName"
            >
              <Tooltip>
                <TooltipTrigger as-child>
                  <Icon name="lucide:x" class="size-4 shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="top" class="text-xs">
                  {{ $t('action.cancel') }}
                </TooltipContent>
              </Tooltip>
            </Button>
            <Button
              v-if="!readonly"
              type="button"
              variant="outline"
              size="sm"
              class="h-7 px-2.5 shrink-0"
              :disabled="!hasNameChanged || !isComponentNameValid"
              :title="$t('action.save')"
              @click="onSaveComponentName"
            >
              <Tooltip>
                <TooltipTrigger as-child>
                  <Icon name="lucide:check" class="size-4 shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="top" class="text-xs">
                  {{ $t('action.save') }}
                </TooltipContent>
              </Tooltip>
            </Button>
            <div v-else class="font-semibold px-2">
              {{ selectedNode.data?.label }}
            </div>
          </div>
          <!-- Error sits under the name row; min-h keeps layout stable when it appears -->
          <div v-if="!readonly" class="mt-1 min-h-1.5" aria-live="polite">
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
                >Component Inputs</span
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
                  class="px-2 pt-2 pb-0.5"
                >
                  <InputParameterEditor
                    :input-definition="inputDef"
                    :input="getInputForDefinition(inputDef)"
                    :available-components="availableUpstreamComponents"
                    :pipeline-params="pipelineParams"
                    :readonly="readonly"
                    @update="
                      (updatedInput) => onInputUpdate(inputDef, updatedInput)
                    "
                    @create-parameter="onCreateParameter"
                    @manage-parameters="onManageParameters"
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
                >Component Output</span
              >
            </div>

            <div class="border-b border-border/60 px-2 py-2.5">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5">
                    <Icon
                      name="lucide:square-arrow-down"
                      class="size-3.5 shrink-0"
                      :class="
                        isSelectedNodePipelineOutput
                          ? 'text-sky-400'
                          : 'text-muted-foreground'
                      "
                    />
                    <span class="text-xs font-semibold">Pipeline Output</span>
                    <span
                      class="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium"
                      :class="
                        isSelectedNodePipelineOutput
                          ? 'border-sky-400/40 bg-sky-400/10 text-sky-600 dark:text-sky-300'
                          : 'border-border/70 bg-muted/40 text-muted-foreground'
                      "
                    >
                      {{
                        isSelectedNodePipelineOutput
                          ? 'Selected'
                          : 'Not selected'
                      }}
                    </span>
                  </div>
                  <p class="mt-1 text-[11px] text-muted-foreground">
                    Expose this component outputs as final pipeline output.
                  </p>
                </div>

                <Switch
                  v-if="!readonly"
                  v-model="isSelectedNodePipelineOutputModel"
                />
              </div>
            </div>

            <!-- Output Parameters -->
            <div>
              <div
                v-if="outputDefinitions.length"
                class="divide-y divide-border/50"
              >
                <div
                  v-for="(path, index) in outputDefinitions"
                  :key="path.key"
                  class="flex items-center gap-2 px-2 py-2"
                  @mouseenter="hoveredOutputIndex = index"
                  @mouseleave="hoveredOutputIndex = null"
                >
                  <div class="flex min-w-0 items-center gap-1 h-7">
                    <Input
                      v-if="!readonly && editingOutputIndex === index"
                      :model-value="outputNameDrafts[index] ?? path.name"
                      class="h-7 w-56 max-w-full border-border/60 bg-muted/30 px-2 text-xs font-semibold shadow-none transition-[border-color,background-color,box-shadow] duration-150 placeholder:font-normal placeholder:text-muted-foreground/50 hover:border-border/80 hover:bg-muted/40 focus-visible:border-border/80 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/25"
                      @update:model-value="
                        (v) => onOutputNameDraftChange(index, String(v))
                      "
                      @keydown.enter.prevent="onOutputNameSave(index)"
                    />
                    <span
                      v-else
                      class="inline-flex h-7 max-w-[16rem] items-center truncate px-2 text-xs font-semibold text-foreground"
                    >
                      {{ path.name }}
                    </span>
                    <Button
                      v-if="
                        !readonly &&
                        editingOutputIndex !== index &&
                        hoveredOutputIndex === index
                      "
                      type="button"
                      variant="outline"
                      size="sm"
                      class="h-7 px-2.5 shrink-0"
                      :title="$t('action.edit')"
                      @click="startOutputNameEdit(index)"
                    >
                      <Tooltip>
                        <TooltipTrigger as-child>
                          <Icon name="lucide:pencil" class="size-3.5 shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent side="top" class="text-xs">
                          {{ $t('action.edit') }}
                        </TooltipContent>
                      </Tooltip>
                    </Button>
                  </div>
                  <div
                    v-if="!readonly && editingOutputIndex === index"
                    class="flex items-center gap-1"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      class="h-7 px-2.5 shrink-0"
                      :title="$t('action.cancel')"
                      @click="onOutputNameCancel(index)"
                    >
                      <Tooltip>
                        <TooltipTrigger as-child>
                          <Icon name="lucide:x" class="size-3.5 shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent side="top" class="text-xs">
                          {{ $t('action.cancel') }}
                        </TooltipContent>
                      </Tooltip>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      class="h-7 px-2.5 shrink-0"
                      :title="$t('action.save')"
                      @click="onOutputNameSave(index)"
                    >
                      <Tooltip>
                        <TooltipTrigger as-child>
                          <Icon name="lucide:check" class="size-3.5 shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent side="top" class="text-xs">
                          {{ $t('action.save') }}
                        </TooltipContent>
                      </Tooltip>
                    </Button>
                  </div>
                  <div class="ml-auto flex items-center gap-2">
                    <span class="text-xs text-muted-foreground text-right break-all">
                      {{ path.type }}
                    </span>
                  </div>
                </div>
              </div>
              <p v-else class="px-2 py-2 text-xs text-muted-foreground italic">
                None
              </p>
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
import { Switch } from '~/components/ui/switch';
import { SheetTitle } from '~/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import type {
  ComponentInput,
  ComponentPath,
  PipelineInputParam,
  Node,
  NodeUpdate,
} from '~/types/canvas.types';
import {
  resolveComponentInput,
  validateComponentInput,
} from '~/utils/builder-validation';
import { useBuilderColors } from '~/composables/useBuilderColors';

const { t } = useI18n();
const { page } = useApp();
const { getCategoryColor } = useBuilderColors();
const {
  pipelineParameters: pipelineParams,
  outputNodeIds,
  toggleOutputNode,
} = usePipelineBuilder();

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
  createParameter: [parameter: PipelineInputParam];
  manageParameters: [];
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
  return resolveComponentInput(currentInputs.value, inputDef);
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
      pipelineParams.value,
    );
    return error !== null;
  });
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

// Handle create parameter
function onCreateParameter(parameter: PipelineInputParam) {
  emit('createParameter', parameter);
}

// Handle manage parameters
function onManageParameters() {
  emit('manageParameters');
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

const outputDefinitions = computed(() =>
  renderPathList(props.selectedNode?.data?.component?.output_path || []),
);

const isSelectedNodePipelineOutput = computed(() => {
  const nodeId = props.selectedNode?.id;
  if (!nodeId) return false;
  return outputNodeIds.value.includes(nodeId);
});

const isSelectedNodePipelineOutputModel = computed({
  get: () => isSelectedNodePipelineOutput.value,
  set: (next: boolean) => {
    if (!props.selectedNode) return;
    if (next !== isSelectedNodePipelineOutput.value) {
      toggleOutputNode(props.selectedNode.id);
    }
  },
});

const outputNameDrafts = ref<Record<number, string>>({});
const editingOutputIndex = ref<number | null>(null);
const hoveredOutputIndex = ref<number | null>(null);

function onOutputNameDraftChange(index: number, value: string) {
  outputNameDrafts.value[index] = value;
}

function startOutputNameEdit(index: number) {
  if (props.readonly) return;
  editingOutputIndex.value = index;
}

function onOutputNameCancel(index: number) {
  const currentOutputPath =
    props.selectedNode?.data?.component?.output_path || [];
  const current = currentOutputPath[index];
  if (current) outputNameDrafts.value[index] = current.name;
  editingOutputIndex.value = null;
}

function onOutputNameSave(index: number) {
  if (!props.selectedNode || props.readonly) return;
  const currentOutputPath =
    props.selectedNode.data?.component?.output_path || [];
  const current = currentOutputPath[index];
  if (!current) return;

  const draft = (outputNameDrafts.value[index] ?? current.name).trim();
  if (!draft) {
    outputNameDrafts.value[index] = current.name;
    editingOutputIndex.value = null;
    return;
  }
  if (draft === current.name) {
    editingOutputIndex.value = null;
    return;
  }

  // Prevent duplicate output names within the same component.
  const duplicate = currentOutputPath.some(
    (out, i) => i !== index && out.name === draft,
  );
  if (duplicate) {
    outputNameDrafts.value[index] = current.name;
    editingOutputIndex.value = null;
    return;
  }

  const nextOutputPath = currentOutputPath.map((out, i) =>
    i === index ? { ...out, name: draft } : { ...out },
  );

  emit('updateNode', props.selectedNode.id, {
    data: {
      component: {
        output_path: nextOutputPath,
      },
    },
  });
  editingOutputIndex.value = null;
}

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

const onCancelComponentName = () => {
  if (!props.selectedNode || !hasNameChanged.value) return;
  formData.nodeName = previousNodeName.value;
};

const onSaveComponentName = () => {
  if (!props.selectedNode || !isComponentNameValid.value) return;

  const oldName = previousNodeName.value;
  const newName = formData.nodeName;

  if (oldName !== newName && newName && oldName) {
    emit('renameComponent', props.selectedNode.id, oldName, newName);
    previousNodeName.value = newName;

    // console.log('[builder] component JSON after rename:---');
    // console.log(
    //   JSON.stringify(props.selectedNode.data?.component ?? null, null, 2),
    // );
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

    if (newNode) {
      const outputPath = newNode.data?.component?.output_path || [];
      outputNameDrafts.value = Object.fromEntries(
        outputPath.map((out, i) => [i, out.name]),
      );
      editingOutputIndex.value = null;
    } else {
      outputNameDrafts.value = {};
      editingOutputIndex.value = null;
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
