<template>
  <div class="flex-1 pl-4">
    <div class="mb-8">
      <form>
        <template
          v-for="(item, stepIndex) in Array.isArray(steps) ? steps : []"
          :key="stepIndex"
        >
          <div v-show="currentStep === stepIndex">
            <template
              v-for="(row, rowIndex) in item.rows"
              :key="`${stepIndex}-${rowIndex}`"
            >
              <div
                :class="{
                  'flex gap-2': row.fields.length > 1,
                  'mb-6': true,
                }"
              >
                <template
                  v-for="field in row.fields"
                  :key="`${stepIndex}-${rowIndex}-${field.name}`"
                >
                  <div
                    v-if="checkFieldCondition(field)"
                    :class="{
                      'flex-1': row.fields.length > 1,
                    }"
                  >
                    <template v-if="field.type === 'radio'">
                      <FormField
                        v-slot="{ componentField }"
                        type="radio"
                        :name="field.name"
                      >
                        <FormItem class="space-y-3">
                          <FormLabel v-if="field.label">{{
                            field.label
                          }}</FormLabel>
                          <FormControl>
                            <RadioGroup
                              class="flex flex-col space-y-1"
                              v-bind="componentField"
                            >
                              <div
                                v-for="option in field.options"
                                :key="option.value"
                                class="flex items-center items-start space-x-3"
                              >
                                <RadioGroupItem :value="option.value" />
                                <FormLabel
                                  class="font-normal flex flex-col cursor-pointer"
                                >
                                  <div class="mb-1 w-full">
                                    {{ option.label }}
                                  </div>
                                  <div
                                    v-if="option.subtitle"
                                    class="text-sm text-gray-400"
                                  >
                                    {{ option.subtitle }}
                                  </div>
                                </FormLabel>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      </FormField>
                    </template>

                    <template v-else-if="field.type === 'text'">
                      <FormField
                        v-slot="{ componentField }"
                        type="text"
                        :name="field.name"
                      >
                        <FormItem
                          :class="row.fields.length > 1 ? 'w-full' : 'w-full'"
                        >
                          <FormLabel>{{ field.label }}</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              v-bind="componentField"
                              :placeholder="field.placeholder || ''"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      </FormField>
                    </template>

                    <template v-else-if="field.type === 'number'">
                      <FormField
                        v-slot="{ componentField }"
                        type="number"
                        :name="field.name"
                      >
                        <FormItem class="w-full">
                          <FormLabel>{{ field.label }}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              v-bind="componentField"
                              :placeholder="field.placeholder || ''"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      </FormField>
                    </template>

                    <template v-else-if="field.type === 'textarea'">
                      <FormField
                        v-slot="{ componentField }"
                        type="textarea"
                        :name="field.name"
                      >
                        <FormItem class="w-full">
                          <FormLabel v-if="field.label">{{
                            field.label
                          }}</FormLabel>
                          <FormControl>
                            <Textarea
                              v-bind="componentField"
                              :placeholder="field.placeholder || ''"
                              class="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      </FormField>
                    </template>

                    <template v-else-if="field.type === 'file'">
                      <FormField type="file" :name="field.name">
                        <FormItem class="w-full">
                          <FormLabel v-if="field.label">{{
                            field.label
                          }}</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              :accept="field.accept || '.csv,.json'"
                              :placeholder="field.placeholder || ''"
                              @change="
                                (e: Event) => handleFileChange(e, field.name)
                              "
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      </FormField>
                    </template>

                    <template v-else-if="field.type === 'select'">
                      <FormField
                        v-slot="{ componentField }"
                        type="select"
                        :name="field.name"
                      >
                        <FormItem class="w-full">
                          <FormLabel v-if="field.label">{{
                            field.label
                          }}</FormLabel>
                          <Select v-bind="componentField">
                            <SelectTrigger>
                              <SelectValue
                                :placeholder="field.placeholder || ''"
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem
                                v-for="option in field.options"
                                :key="option.value"
                                :value="option.value"
                              >
                                {{ option.label }}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      </FormField>
                    </template>

                    <template v-else-if="field.type === 'checkbox'">
                      <FormField
                        v-slot="{ componentField }"
                        type="checkbox"
                        :name="field.name"
                      >
                        <FormItem
                          class="flex flex-row items-start space-x-3 space-y-0 p-4"
                        >
                          <FormControl>
                            <Checkbox v-bind="componentField" />
                          </FormControl>
                          <div class="space-y-1 leading-none flex">
                            <FormLabel v-if="field.label">{{
                              field.label
                            }}</FormLabel>
                            <FormDescription v-if="field.description">
                              {{ field.description }}
                            </FormDescription>
                          </div>
                        </FormItem>
                      </FormField>
                    </template>

                    <template v-else-if="field.type === 'action_button'">
                      <div class="flex items-center pt-8">
                        <Button
                          type="button"
                          variant="secondary"
                          @click.prevent="
                            emit(
                              'on-field-action',
                              field.actionName || field.name,
                              form.values,
                            )
                          "
                        >
                          {{ field.buttonLabel || field.label }}
                        </Button>
                      </div>
                    </template>
                  </div>
                </template>
              </div>
            </template>
          </div>
        </template>

        <div v-show="currentStep === steps.length && showReviewStep">
          <Table class="w-full table-fixed">
            <TableBody>
              <TableRow
                v-for="(item, index) in reviewData"
                :key="`review-item-${index}`"
              >
                <TableCell class="text-left pb-4 pr-8 border-none text-gray-400"
                  >{{ t(`label.${item.label}`) }}
                </TableCell>
                <TableCell class="text-left pb-4 pr-8 border-none">{{
                  item.value
                }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useForm } from 'vee-validate';
import { nextTick, onMounted } from 'vue';
// import { get as useGet } from 'lodash-es';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';

import type {
  ActionType,
  Field,
  FieldCondition,
  ReviewItem,
  ReviewItemsByType,
  ReviewTableItem,
  StepFormProps,
  FormValues,
} from '~/types/form.types';

const { t } = useI18n();

const props = withDefaults(defineProps<StepFormProps>(), {
  title: '',
  step: 0,
  showReviewStep: true,
  isSubmit: false,
  initialValues: () => ({}),
  reviewItems: () => ({}) as ReviewItemsByType,
  actionLabels: () => ({
    close: 'Close',
    back: 'Back',
    next: 'Next',
    save: 'Save',
  }),
});

const emit = defineEmits<{
  'on-action': [action: ActionType, values: FormValues];
  'on-submit': [values: FormValues];
  'on-step-change': [step: number, actions: ActionType[]];
  'update-actions': [actions: ActionType[]];
  'update-step-validity': [isValid: boolean];
  'update-next-enabled': [enabled: boolean];
  'on-field-action': [actionName: string, values: FormValues];
}>();
const currentStep = ref(props.step);

const form = useForm<FormValues>({
  validationSchema: props.validationSchema,
  initialValues: props.initialValues || {},
});

const getNestedValue = (
  obj: Record<string, unknown>,
  path: string,
): unknown => {
  return path.split('.').reduce((acc: unknown, part: string) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
};

const evaluateCondition = (
  condition: FieldCondition,
  formValues: Record<string, unknown>,
): boolean => {
  if (condition.group) {
    if (!condition.conditions || condition.conditions.length === 0) return true;
    if (condition.group === 'and') {
      return condition.conditions.every((c) =>
        evaluateCondition(c, formValues),
      );
    } else if (condition.group === 'or') {
      return condition.conditions.some((c) => evaluateCondition(c, formValues));
    }
    return true;
  }

  if (!condition.field || !condition.operator) return true;

  const { field: conditionField, operator, value } = condition;
  const fieldValue = getNestedValue(formValues, conditionField);

  switch (operator) {
    case 'eq':
      return fieldValue === value;
    case 'neq':
      return fieldValue !== value;
    case 'contains':
      return Array.isArray(fieldValue) && fieldValue.includes(value as unknown);
    case 'not_contains':
      return (
        Array.isArray(fieldValue) && !fieldValue.includes(value as unknown)
      );
    default:
      return true;
  }
};

const formValuesKey = ref(0);

watch(
  () => form.values,
  () => {
    formValuesKey.value++;
  },
  { deep: true },
);

const checkFieldCondition = computed(() => {
  // Access formValuesKey to trigger reactivity
  const _ = formValuesKey.value;
  const values = form.values;
  return (field: Field): boolean => {
    if (!field.condition) return true;
    return evaluateCondition(field.condition, values);
  };
});

// Get all field names for a specific step
const getStepFields = (stepIndex: number): string[] => {
  const step = Array.isArray(props.steps) ? props.steps[stepIndex] : null;
  if (!step || !step.rows) return [];

  const fields: string[] = [];
  step.rows.forEach((row) => {
    row.fields.forEach((field) => {
      if (checkFieldCondition.value(field)) {
        fields.push(field.name);
      }
    });
  });
  return fields;
};

// Validate fields for a specific step
const validateStep = async (stepIndex: number): Promise<boolean> => {
  const stepFields = getStepFields(stepIndex);
  if (stepFields.length === 0) return true;

  // Validate all fields in the step
  const validations = await Promise.all(
    stepFields.map((fieldName) => form.validateField(fieldName)),
  );

  return validations.every((result) => result.valid);
};

// Check if current step is valid (computed for reactivity)
const isStepValid = ref(true);

// Check step validity based on field errors and required values
const checkStepValidity = () => {
  const step = Array.isArray(props.steps)
    ? props.steps[currentStep.value]
    : null;
  if (!step || !step.rows) {
    isStepValid.value = true;
    return;
  }

  const errors = form.errors.value;
  const values = form.values;

  // Get active fields for current step
  const activeFields: Field[] = [];
  step.rows.forEach((row) => {
    row.fields.forEach((field) => {
      // Check condition
      if (checkFieldCondition.value(field)) {
        activeFields.push(field);
      }
    });
  });

  if (activeFields.length === 0) {
    isStepValid.value = true;
    return;
  }

  // Check for errors and required values
  const isValid = activeFields.every((field) => {
    // 1. Check if field has error
    if (errors[field.name]) {
      return false;
    }

    // 2. Check if field is required and has value
    if (field.required) {
      const val = getNestedValue(values, field.name);

      // Check for empty values
      if (val === undefined || val === null) {
        return false;
      }
      if (typeof val === 'string' && val.trim() === '') {
        return false;
      }
      if (Array.isArray(val) && val.length === 0) {
        return false;
      }
    }

    return true;
  });

  isStepValid.value = isValid;
};

// Watch form values and errors to update step validity
watch(
  () => [form.values, form.errors.value, currentStep.value],
  async () => {
    await nextTick();
    checkStepValidity();
  },
  { deep: true },
);

// Initialize step validity after component is mounted
onMounted(() => {
  nextTick(() => {
    checkStepValidity();
  });
});

const handleAction = async (action: ActionType) => {
  if (action === 'next') {
    // Validate current step before moving to next
    const isValid = await validateStep(currentStep.value);
    if (!isValid) {
      // Don't proceed to next step if validation fails
      return;
    }
    currentStep.value++;
    emit('on-step-change', currentStep.value, currentActions.value);
  } else if (action === 'back' && currentStep.value > 0) {
    currentStep.value--;
    emit('on-step-change', currentStep.value, currentActions.value);
  }
  if (action === 'submit') {
    onSubmit();
  }

  emit('on-action', action, form.values);
};

const currentActions = computed(() => {
  const totalSteps = props.steps.length + (props.showReviewStep ? 1 : 0);

  if (currentStep.value === 0) {
    // On first step, always show next button
    return ['next'];
  } else if (currentStep.value === totalSteps - 1) {
    return ['back', 'submit'];
  } else {
    // Always show next button, but it will be disabled if step is invalid
    return ['back', 'next'];
  }
});

// Computed property to determine if Next button should be enabled
const isNextEnabled = computed(() => {
  return isStepValid.value;
});

watch(
  currentActions,
  (actions: ActionType[]) => {
    emit('update-actions', actions);
  },
  { immediate: true },
);

watch(
  isNextEnabled,
  (enabled: boolean) => {
    emit('update-next-enabled', enabled);
  },
  { immediate: true },
);

watch(
  currentStep,
  (value: number) => {
    // Check validity when step changes
    nextTick(() => {
      checkStepValidity();
    });
    emit('on-step-change', value, currentActions.value);
  },
  { immediate: true },
);

watch(
  () => props.isSubmit,
  (value: boolean) => {
    if (value) {
      form.submitForm();
      onSubmit();
    }
  },
  { immediate: true },
);

watch(
  () => props.step,
  (value: number) => {
    if (value !== undefined && value !== currentStep.value) {
      currentStep.value = value;
    }
  },
  { immediate: true },
);

const reviewData = computed((): ReviewTableItem[] => {
  const formValues = form.values;
  const typeField = Object.keys(formValues).find((key) => key === 'type');
  const type = typeField ? formValues[typeField] : null;

  let reviewList: ReviewItem[] = [
    {
      label: 'type',
      valuePath: 'type',
    },
    {
      label: 'name',
      valuePath: 'metadata.name',
    },
    {
      label: 'description',
      valuePath: 'metadata.description',
    },
  ];
  reviewList = [...reviewList, ...(props.reviewItems[type as string] || [])];
  return reviewList.map((item) => {
    return {
      label: item.label,
      value: item.valuePath
        .split('.')
        .reduce(
          (obj: Record<string, unknown>, key: string) =>
            obj?.[key] as Record<string, unknown>,
          formValues as Record<string, unknown>,
        ),
    };
  });
});

const handleFileChange = (event: Event, fieldName: string): void => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (fieldName.includes('files')) {
    form.setFieldValue(fieldName, file ? [file] : []);
  } else {
    form.setFieldValue(fieldName, file || null);
  }
};

const onSubmit = form.handleSubmit((values: FormValues) => {
  emit('on-submit', values);
});
</script>
