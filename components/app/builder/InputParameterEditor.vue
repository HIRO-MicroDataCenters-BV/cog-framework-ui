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
          <span v-if="!inputDefinition.optional" class="text-orange-500">*</span>
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
            @update:model-value="onSourceTypeChange"
          >
            <SelectTrigger size="sm" class="w-full text-xs">
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
              @update:model-value="onComponentOutputChange"
            >
              <SelectTrigger size="sm" class="w-full text-xs font-mono">
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
              @update:model-value="emitUpdate"
            >
              <SelectTrigger size="sm" class="w-full text-xs font-mono">
                <SelectValue
                  :placeholder="$t('placeholder.select_parameter')"
                />
              </SelectTrigger>
              <SelectContent align="start" side="bottom">
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
            />
          </div>
        </div>
      </div>

      <div
        v-if="validationError && !readonly"
        class="text-[10px] text-red-500 flex items-center gap-1 px-0.5"
      >
        <Icon name="lucide:alert-circle" class="w-3 h-3 shrink-0" />
        {{ $t(validationError) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Input } from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import type {
  ComponentInput,
  ComponentPath,
  Node,
  PipelineInputParam,
} from '~/types/builder.types';
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
}>();

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

// Validation
const validationError = computed(() => {
  return validateComponentInput(
    localInput.value,
    props.inputDefinition,
    props.availableComponents,
    props.pipelineParams,
  );
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

// Handle source type change
function onSourceTypeChange(newType: unknown) {
  if (!newType || typeof newType !== 'string') return;
  // We no longer clear source when changing type to improve UX
  // localInput.value.source = '';
  // selectedComponentOutput.value = '';
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
  emit('update', { ...localInput.value });
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

      localInput.value = { ...newInput };
      if (newInput.value_source_type === 'component_output') {
        selectedComponentOutput.value = newInput.source;
      }
    } else {
      // Reset local state when input is undefined/null
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
