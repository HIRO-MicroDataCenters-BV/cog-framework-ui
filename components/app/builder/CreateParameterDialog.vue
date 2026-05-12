<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ $t('builder.create_parameter') }}</DialogTitle>
        <DialogDescription>
          {{ $t('builder.create_parameter_description') }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <!-- Parameter Name -->
        <div class="space-y-2">
          <Label for="param-name">
            {{ $t('builder.parameter_name') }}
            <span class="text-destructive">*</span>
          </Label>
          <Input
            id="param-name"
            ref="nameInputRef"
            v-model="formData.name"
            type="text"
            autofocus
            :placeholder="$t('placeholder.parameter_name')"
            :aria-invalid="!!errors.name"
            @input="validateName"
            @keydown.enter="handleCreate"
          />
          <div class="h-1 -mt-1" aria-live="polite">
            <p
              v-if="errors.name"
              class="text-xs text-destructive leading-tight"
              role="alert"
            >
              {{ errors.name }}
            </p>
          </div>
        </div>

        <!-- Type -->
        <div class="space-y-2">
          <Label for="param-type">
            {{ $t('builder.parameter_type') }}
            <span class="text-destructive">*</span>
          </Label>
          <Select v-model="formData.type">
            <SelectTrigger id="param-type">
              <SelectValue :placeholder="$t('placeholder.select_type')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="String">String</SelectItem>
              <SelectItem value="Integer">Integer</SelectItem>
              <SelectItem value="Float">Float</SelectItem>
              <SelectItem value="Boolean">Boolean</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Default Value -->
        <div class="space-y-2">
          <Label for="param-default">
            {{ $t('builder.default_value') }}
          </Label>
          <Input
            id="param-default"
            v-model="formData.default"
            type="text"
            :placeholder="getDefaultPlaceholder()"
            :aria-invalid="!!errors.default"
            @input="validateDefault"
          />
          <div class="h-1 -mt-1" aria-live="polite">
            <p
              v-if="errors.default"
              class="text-xs text-destructive leading-tight"
              role="alert"
            >
              {{ errors.default }}
            </p>
          </div>
        </div>

        <!-- Description -->
        <div class="space-y-2">
          <Label for="param-description">
            {{ $t('builder.description') }}
          </Label>
          <Input
            id="param-description"
            v-model="formData.description"
            type="text"
            :placeholder="$t('placeholder.parameter_description')"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleCancel">
          {{ $t('action.cancel') }}
        </Button>
        <Button :disabled="!isValid" @click="handleCreate">
          {{ $t('action.create') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PipelineInputParam } from '~/types/canvas.types';
import { validateConstant } from '~/utils/builder-validation';

interface Props {
  open: boolean;
  existingParameters?: PipelineInputParam[];
  suggestedName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  existingParameters: () => [],
  suggestedName: '',
});

const emit = defineEmits<{
  'update:open': [value: boolean];
  create: [parameter: PipelineInputParam];
}>();

const { t } = useI18n();

const nameInputRef = ref<HTMLElement | null>(null);

const formData = ref({
  name: '',
  type: 'String',
  default: '',
  description: '',
});

const errors = ref({
  name: '',
  default: '',
});

// Auto-focus name input when dialog opens
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      // Reset form
      formData.value = {
        name: props.suggestedName || '',
        type: 'String',
        default: '',
        description: '',
      };
      errors.value = { name: '', default: '' };

      // Focus name input - use getElementById as fallback
      nextTick(() => {
        const inputElement = document.getElementById(
          'param-name',
        ) as HTMLInputElement;
        inputElement?.focus();
      });
    }
  },
);

// Validate parameter name
const validateName = () => {
  const name = formData.value.name.trim();

  if (!name) {
    errors.value.name = t('validation.parameter.name_required');
    return false;
  }

  // Check valid characters (alphanumeric, underscore, hyphen)
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    errors.value.name = t('validation.parameter.name_format');
    return false;
  }

  // Check for duplicates
  const isDuplicate = props.existingParameters.some(
    (p) => p.name.toLowerCase() === name.toLowerCase(),
  );

  if (isDuplicate) {
    errors.value.name = t('validation.parameter.name_unique');
    return false;
  }

  errors.value.name = '';
  return true;
};

// Validate default value against the selected type. Default is optional, so
// empty is fine; non-empty must satisfy the type-specific rule (e.g. an
// Integer parameter cannot have "1.0" as its default).
const validateDefault = () => {
  const value = formData.value.default.trim();

  if (!value) {
    errors.value.default = '';
    return true;
  }

  const errorKey = validateConstant(value, formData.value.type);

  if (errorKey && errorKey !== 'validation.input.constant_required') {
    errors.value.default = t(errorKey);
    return false;
  }

  errors.value.default = '';
  return true;
};

// Re-validate whenever the user changes the type via the dropdown.
watch(() => formData.value.type, validateDefault);

// Get placeholder based on type
const getDefaultPlaceholder = (): string => {
  switch (formData.value.type) {
    case 'Integer':
      return 'e.g., 42';
    case 'Float':
      return 'e.g., 0.001';
    case 'Boolean':
      return 'true or false';
    case 'String':
    default:
      return 'e.g., default value';
  }
};

// Check if form is valid
const isValid = computed(() => {
  return (
    formData.value.name.trim() !== '' &&
    formData.value.type !== '' &&
    !errors.value.name &&
    !errors.value.default
  );
});

// Handle create
const handleCreate = () => {
  if (!validateName() || !validateDefault() || !isValid.value) return;

  const newParameter: PipelineInputParam = {
    name: formData.value.name.trim(),
    type: formData.value.type,
    default: formData.value.default.trim() || undefined,
    description: formData.value.description.trim() || undefined,
  };

  emit('create', newParameter);
  emit('update:open', false);
};

// Handle cancel
const handleCancel = () => {
  emit('update:open', false);
};

// Handle dialog open change
const handleOpenChange = (value: boolean) => {
  emit('update:open', value);
};
</script>
