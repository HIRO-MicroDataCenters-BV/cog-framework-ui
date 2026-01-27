<template>
  <div class="space-y-2 p-0">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Icon :name="getTypeIcon()" class="w-4 h-4 text-gray-500" />
        <span class="text-sm font-medium">{{ inputDefinition.name }}</span>
        <span class="text-xs text-gray-500">({{ inputDefinition.type }})</span>
      </div>
    </div>

    <!-- Readonly View -->
    <div v-if="readonly" class="pl-6">
      <div class="text-xs text-muted-foreground mb-0.5">
        {{ $t(`label.${localInput.value_source_type}`) }}
      </div>
      <div class="text-sm break-all font-medium">
        {{ localInput.source || '-' }}
      </div>
    </div>

    <!-- Edit View -->
    <div v-else class="grid grid-cols-[40%_60%] gap-3">
      <!-- Value Source Type Selector -->
      <div>
        <Select
          v-model="localInput.value_source_type"
          @update:model-value="onSourceTypeChange"
        >
          <SelectTrigger class="h-9">
            <SelectValue :placeholder="$t('placeholder.select_source_type')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="component_output">
              {{ $t('label.component_output') }}
            </SelectItem>
            <SelectItem value="pipeline_inputparam">
              {{ $t('label.pipeline_parameter') }}
            </SelectItem>
            <SelectItem value="constant">
              {{ $t('label.constant_value') }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Source Value Input (Dynamic based on type) -->
      <div>
        <!-- Component Output Selector -->
        <div v-if="localInput.value_source_type === 'component_output'">
          <Select
            v-model="selectedComponentOutput"
            @update:model-value="onComponentOutputChange"
          >
            <SelectTrigger class="h-9">
              <SelectValue
                :placeholder="$t('placeholder.select_component_output')"
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in componentOutputOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Pipeline Parameter Selector -->
        <div v-if="localInput.value_source_type === 'pipeline_inputparam'">
          <Select v-model="localInput.source" @update:model-value="emitUpdate">
            <SelectTrigger class="h-9">
              <SelectValue :placeholder="$t('placeholder.select_parameter')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="param in pipelineParams"
                :key="param.name"
                :value="param.name"
              >
                {{ param.name }}
                <span v-if="param.default" class="text-xs text-gray-500">
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
            class="h-9"
            @update:model-value="emitUpdate"
          />
        </div>
      </div>
    </div>

    <!-- Validation Error -->
    <div
      v-if="validationError && !readonly"
      class="text-xs text-red-500 flex items-center gap-1"
    >
      <Icon name="lucide:alert-circle" class="w-3 h-3" />
      {{ $t(validationError) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Label } from '~/components/ui/label';
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

// Validation
const validationError = computed(() => {
  return validateComponentInput(
    localInput.value,
    props.inputDefinition,
    props.availableComponents,
    props.pipelineParams,
  );
});

// Get icon for input type
function getTypeIcon(): string {
  const type = props.inputDefinition.type.toLowerCase();

  switch (type) {
    case 'integer':
    case 'int':
      return 'lucide:hash';
    case 'float':
    case 'double':
    case 'number':
      return 'lucide:hash';
    case 'boolean':
    case 'bool':
      return 'lucide:toggle-left';
    case 'string':
      return 'lucide:text';
    case 'jsonobject':
    case 'json':
      return 'lucide:braces';
    case 'array':
    case 'list':
      return 'lucide:list';
    default:
      return 'lucide:circle-dot';
  }
}

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
function onSourceTypeChange(newType: any) {
  if (!newType || typeof newType !== 'string') return;
  // Clear source when changing type
  localInput.value.source = '';
  selectedComponentOutput.value = '';
  emitUpdate();
}

// Handle component output change
function onComponentOutputChange(value: any) {
  if (!value || typeof value !== 'string') return;
  localInput.value.source = value;
  emitUpdate();
}

// Emit update to parent
function emitUpdate() {
  emit('update', { ...localInput.value });
}

// Watch for external changes
watch(
  () => props.input,
  (newInput) => {
    if (newInput) {
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
  { deep: true },
);
</script>
