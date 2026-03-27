<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div
          class="w-6 h-6 flex items-center justify-center text-muted-foreground"
        >
          <Icon :name="getTypeIcon(inputDefinition.type)" class="w-3.5 h-3.5" />
        </div>
        <span class="text-sm">
          {{ inputDefinition.name }}
          <span v-if="!inputDefinition.optional" class="text-orange-500"
            >*</span
          >
        </span>
      </div>
      <span class="text-[10px] font-mono px-1.5 py-0.5 text-muted-foreground">
        {{ inputDefinition.type }}
      </span>
    </div>

    <!-- Readonly View -->
    <div v-if="readonly" class="pl-1">
      <div
        class="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold"
      >
        {{ $t(`label.${localInput.value_source_type}`) }}
      </div>
      <div class="text-sm break-all font-medium py-1 px-2">
        {{ resolvedValue || '-' }}
      </div>
    </div>

    <!-- Edit View: grid + error grouped so validation sits tight under the row -->
    <div v-else class="flex flex-col gap-1">
      <div class="grid grid-cols-[150px_1fr] gap-3 items-start">
        <!-- Value Source Type Selector -->
        <div>
          <Select
            v-model="localInput.value_source_type"
            :modal="false"
            @update:model-value="onSourceTypeChange"
          >
            <SelectTrigger size="sm" class="w-full text-xs" @blur="markTouched">
              <SelectValue
                :placeholder="$t('placeholder.select_source_type')"
              />
            </SelectTrigger>
            <SelectContent align="start" side="bottom">
              <SelectItem value="component_output" class="text-xs">
                {{ $t('label.component_output') }}
              </SelectItem>
              <SelectItem value="pipeline_inputparam" class="text-xs">
                {{ $t('label.pipeline_parameter') }}
              </SelectItem>
              <SelectItem value="constant" class="text-xs">
                {{ $t('label.constant_value') }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Source Value Input (Dynamic based on type) -->
        <div class="relative">
          <!-- Component Output Selector -->
          <div v-if="localInput.value_source_type === 'component_output'">
            <Select
              v-model="selectedComponentOutput"
              :modal="false"
              @update:model-value="onComponentOutputChange"
            >
              <SelectTrigger
                size="sm"
                class="w-full text-xs font-mono"
                @blur="markTouched"
              >
                <SelectValue
                  :placeholder="$t('placeholder.select_component_output')"
                />
              </SelectTrigger>
              <SelectContent align="start" side="bottom">
                <SelectItem
                  v-for="option in componentOutputOptions"
                  :key="option.value"
                  :value="option.value"
                  class="text-xs font-mono"
                >
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Pipeline Parameter Selector -->
          <div v-if="localInput.value_source_type === 'pipeline_inputparam'">
            <Select
              v-model="localInput.source"
              :open="selectOpen"
              :modal="false"
              @update:open="selectOpen = $event"
              @update:model-value="handleParameterSelect"
            >
              <SelectTrigger
                size="sm"
                class="w-full text-xs font-mono"
                @blur="markTouched"
              >
                <SelectValue
                  :placeholder="$t('placeholder.select_parameter')"
                />
              </SelectTrigger>
              <SelectContent align="start" side="bottom">
                <!-- Create New Parameter Option -->
                <div
                  class="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-xs outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 bg-primary/5"
                  role="option"
                  @click.stop="openCreateDialog"
                  @mousedown.prevent.stop
                >
                  <Icon
                    name="lucide:plus-circle"
                    class="absolute left-2 w-3.5 h-3.5 text-blue-500"
                  />
                  <span class="font-semibold text-primary">
                    {{ $t('builder.create_new_parameter') }}
                  </span>
                </div>

                <!-- Divider -->
                <div
                  v-if="pipelineParams.length > 0"
                  class="h-px bg-border my-1"
                />

                <!-- Existing Parameters -->
                <SelectItem
                  v-for="param in pipelineParams"
                  :key="param.name"
                  :value="param.name"
                  class="text-xs font-mono"
                >
                  {{ param.name }}
                  <span
                    v-if="param.default"
                    class="text-[10px] text-muted-foreground ml-2"
                  >
                    (default: {{ param.default }})
                  </span>
                </SelectItem>

                <!-- Divider -->
                <div
                  v-if="pipelineParams.length > 0"
                  class="h-px bg-border my-1"
                />

                <!-- Manage Parameters Option -->
                <div
                  class="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-xs outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 bg-primary/5"
                  role="option"
                  @click.stop="openManagePanel"
                  @mousedown.prevent.stop
                >
                  <Icon
                    name="lucide:settings"
                    class="absolute left-2 w-3.5 h-3.5 text-blue-500"
                  />
                  <span class="font-semibold text-primary">{{ $t('builder.manage_parameters') }}</span>
                </div>
              </SelectContent>
            </Select>
          </div>

          <!-- Constant Value Input -->
          <div v-if="localInput.value_source_type === 'constant'">
            <Input
              v-model="localInput.source"
              type="text"
              :placeholder="getConstantPlaceholder()"
              class="h-8 text-xs font-mono"
              @update:model-value="emitUpdate"
              @blur="markTouched"
            />
          </div>
        </div>
      </div>

      <!-- Reserve height so showing/hiding validation does not shift the sheet layout -->
      <div
        v-if="!readonly"
        class="flex min-h-4 items-start gap-1 px-0.5 text-[10px] leading-snug text-red-500"
      >
        <template v-if="displayValidationError">
          <Icon
            name="lucide:alert-circle"
            class="w-3 h-3 shrink-0 translate-y-px"
          />
          <span>{{ $t(displayValidationError) }}</span>
        </template>
      </div>
    </div>
  </div>

  <!-- Create Parameter Dialog -->
  <CreateParameterDialog
    :open="showCreateDialog"
    :existing-parameters="pipelineParams"
    @update:open="showCreateDialog = $event"
    @create="handleParameterCreated"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { Input } from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import CreateParameterDialog from './CreateParameterDialog.vue';
import type {
  ComponentInput,
  ComponentPath,
  Node,
  PipelineInputParam,
} from '~/types/canvas.types';
import { validateComponentInput } from '~/utils/builder-validation';
import { useBuilderColors } from '~/composables/useBuilderColors';
import { useBuilderIcons } from '~/composables/useBuilderIcons';

const { getTypeColor } = useBuilderColors();
const { getTypeIcon } = useBuilderIcons();

interface Props {
  inputDefinition: ComponentPath;
  input?: ComponentInput;
  availableComponents: Node[];
  pipelineParams: PipelineInputParam[];
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
});

const emit = defineEmits<{
  update: [input: ComponentInput];
  'create-parameter': [parameter: PipelineInputParam];
  'manage-parameters': [];
}>();

// State for create parameter dialog
const showCreateDialog = ref(false);
// State for select dropdown
const selectOpen = ref(false);

// Initialize local input state
const localInput = ref<ComponentInput>(
  props.input || {
    destination: props.inputDefinition.name,
    value_source_type: 'constant',
    source: props.inputDefinition.default || '',
  },
);

// For component_output, we need to track the selected value separately
const selectedComponentOutput = ref(localInput.value.source);

// Build component output options
const componentOutputOptions = computed(() => {
  const options: Array<{ value: string; label: string }> = [];

  props.availableComponents.forEach((node) => {
    const componentName = node.data?.label || '';
    const outputs = node.data?.component?.output_path || [];

    outputs.forEach((output) => {
      options.push({
        value: `${componentName}.${output.name}`,
        label: `${componentName}.${output.name} (${output.type})`,
      });
    });
  });

  return options;
});

// Resolve value for display in readonly mode
const resolvedValue = computed(() => {
  if (localInput.value.value_source_type === 'pipeline_inputparam') {
    // Find the parameter in pipelineParams and return its default value
    const param = props.pipelineParams.find(
      (p) => p.name === localInput.value.source,
    );
    return param?.default || localInput.value.source;
  }
  return localInput.value.source;
});

// Validation (always computed for canvas/header); inline message only after user touches field
const validationError = computed(() => {
  return validateComponentInput(
    localInput.value,
    props.inputDefinition,
    props.availableComponents,
    props.pipelineParams,
  );
});

const fieldTouched = ref(false);

function markTouched() {
  fieldTouched.value = true;
}

const displayValidationError = computed(() => {
  if (!fieldTouched.value) return null;
  return validationError.value;
});

// Get placeholder for constant input based on type
function getConstantPlaceholder(): string {
  const type = props.inputDefinition.type.toLowerCase();

  switch (type) {
    case 'integer':
    case 'int':
      return 'e.g., 42';
    case 'float':
    case 'double':
    case 'number':
      return 'e.g., 0.001';
    case 'boolean':
    case 'bool':
      return 'true or false';
    case 'string':
      return 'Enter text value';
    default:
      return `Enter ${type} value`;
  }
}

// Handle source type change — always reset bound value; formats are not interchangeable
// (e.g. "Node.output" is invalid as a constant or pipeline param name).
function onSourceTypeChange(newType: unknown) {
  if (!newType || typeof newType !== 'string') return;
  localInput.value.source = '';
  selectedComponentOutput.value = '';
  emitUpdate();
}

// Handle component output change
function onComponentOutputChange(value: unknown) {
  if (!value || typeof value !== 'string') return;
  localInput.value.source = value;
  emitUpdate();
}

// Emit update to parent
function emitUpdate() {
  markTouched();
  emit('update', { ...localInput.value });
}

// Handle opening create parameter dialog
function openCreateDialog() {
  // Close the Select dropdown first to avoid aria-hidden conflicts
  selectOpen.value = false;

  // Wait for Select to close before opening dialog
  nextTick(() => {
    showCreateDialog.value = true;
  });
}

// Handle opening manage parameters panel
function openManagePanel() {
  // Close the Select dropdown first
  selectOpen.value = false;

  // Wait for Select to close before emitting
  nextTick(() => {
    emit('manage-parameters');
  });
}

// Handle parameter selection
function handleParameterSelect(value: unknown) {
  if (!value || typeof value !== 'string') return;
  emitUpdate();
}

// Handle parameter created
async function handleParameterCreated(parameter: PipelineInputParam) {
  // Emit to parent to add the parameter
  emit('create-parameter', parameter);

  // Wait for the parameter to be added to the composable state
  await nextTick();

  // Auto-select the newly created parameter
  localInput.value.source = parameter.name;
  emitUpdate();
}

// Watch for external changes
// Watch for external changes
watch(
  () => props.input,
  (newInput) => {
    if (newInput) {
      // Check for equality to avoid unnecessary resets (which break typing/focus)
      if (
        newInput.destination === localInput.value.destination &&
        newInput.value_source_type === localInput.value.value_source_type &&
        newInput.source === localInput.value.source
      ) {
        return;
      }

      fieldTouched.value = false;
      localInput.value = { ...newInput };
      if (newInput.value_source_type === 'component_output') {
        selectedComponentOutput.value = newInput.source;
      }
    } else {
      // Reset local state when input is undefined/null
      fieldTouched.value = false;
      localInput.value = {
        destination: props.inputDefinition.name,
        value_source_type: 'constant',
        source: '',
      };
      selectedComponentOutput.value = '';
    }
  },
  { deep: true, immediate: true },
);
</script>
