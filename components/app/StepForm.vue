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

import type {
  ActionType,
  Field,
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
}>();
const currentStep = ref(props.step);

const form = useForm<FormValues>({
  validationSchema: props.validationSchema,
  initialValues: props.initialValues || {},
  validateOnBlur: true,
  validateOnChange: true,
});

const checkFieldCondition = (field: Field): boolean => {
  if (!field.condition) return true;

  const { field: conditionField, operator, value } = field.condition;
  const fieldValue = form.values[conditionField];

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

// Get all field names for a specific step
const getStepFields = (stepIndex: number): string[] => {
  const step = Array.isArray(props.steps) ? props.steps[stepIndex] : null;
  if (!step || !step.rows) return [];

  const fields: string[] = [];
  step.rows.forEach((row) => {
    row.fields.forEach((field) => {
      if (checkFieldCondition(field)) {
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
  const stepFields = getStepFields(currentStep.value);
  if (stepFields.length === 0) {
    isStepValid.value = true;
    return;
  }

  const errors = form.errors.value;
  const formValues = form.values;

  // Check for errors in step fields
  const hasErrors = stepFields.some((fieldName) => {
    return errors[fieldName];
  });

  if (hasErrors) {
    isStepValid.value = false;
    return;
  }

  // Check if required fields have values (basic check)
  // Full validation happens on blur/change through form.validateField
  const step = Array.isArray(props.steps)
    ? props.steps[currentStep.value]
    : null;
  if (!step) {
    isStepValid.value = true;
    return;
  }

  // For step 0 (type selection), check if type is selected
  if (currentStep.value === 0) {
    isStepValid.value = !!formValues.type;
    return;
  }

  const type = formValues.type as string;
  const metadata = formValues.metadata as Record<string, unknown> | undefined;

  // Detect form type: dataset has 'dataset_type' and 'source_settings', model has 'file' or 'datastream'
  const isDatasetForm =
    'dataset_type' in formValues || 'source_settings' in formValues;
  const isModelForm = 'file' in formValues || 'datastream' in formValues;

  // For step 1 (metadata)
  if (currentStep.value === 1) {
    // Common: name and description required
    const hasName = !!(
      metadata &&
      metadata.name &&
      String(metadata.name).trim()
    );
    const hasDescription = !!(
      metadata &&
      metadata.description &&
      String(metadata.description).trim()
    );

    if (isDatasetForm) {
      // Dataset: also requires dataset_type
      const datasetType = formValues.dataset_type;
      isStepValid.value = !!(
        hasName &&
        hasDescription &&
        datasetType !== undefined &&
        datasetType !== null
      );
    } else if (isModelForm) {
      // Model: also requires file_type based on type
      const fileData = formValues.file as Record<string, unknown> | undefined;
      const datastreamData = formValues.datastream as
        | Record<string, unknown>
        | undefined;

      if (type === 'file') {
        isStepValid.value = !!(
          hasName &&
          hasDescription &&
          fileData?.file_type !== undefined &&
          fileData?.file_type !== null
        );
      } else if (type === 'datastream') {
        isStepValid.value = !!(
          hasName &&
          hasDescription &&
          datastreamData?.model_id &&
          String(datastreamData.model_id).trim() &&
          datastreamData?.file_type !== undefined &&
          datastreamData?.file_type !== null
        );
      } else {
        isStepValid.value = hasName && hasDescription;
      }
    } else {
      isStepValid.value = hasName && hasDescription;
    }
    return;
  }

  // For step 2 (source/file settings)
  if (currentStep.value === 2) {
    if (isDatasetForm) {
      // Dataset form validation
      const sourceSettings = formValues.source_settings as
        | Record<string, unknown>
        | undefined;

      if (type === 'file') {
        isStepValid.value = !!(sourceSettings && sourceSettings.dataset_file);
      } else if (type === 'table') {
        isStepValid.value = !!(
          sourceSettings &&
          sourceSettings.db_url &&
          String(sourceSettings.db_url).trim() &&
          sourceSettings.table_name &&
          String(sourceSettings.table_name).trim() &&
          sourceSettings.selected_fields &&
          String(sourceSettings.selected_fields).trim()
        );
      } else if (type === 'data_stream') {
        const ipAddressRegex =
          /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

        const brokerName = sourceSettings?.broker_name
          ? String(sourceSettings.broker_name).trim()
          : '';
        const brokerIp = sourceSettings?.broker_ip_address
          ? String(sourceSettings.broker_ip_address).trim()
          : '';
        const brokerPort = sourceSettings?.broker_port;
        const topicName = sourceSettings?.topic_name
          ? String(sourceSettings.topic_name).trim()
          : '';

        let portValid = false;
        if (
          brokerPort !== undefined &&
          brokerPort !== null &&
          brokerPort !== 0
        ) {
          const port =
            typeof brokerPort === 'string'
              ? parseInt(brokerPort.trim(), 10)
              : Number(brokerPort);
          portValid = !isNaN(port) && port >= 1 && port <= 65535;
        }

        isStepValid.value = !!(
          brokerName &&
          brokerIp &&
          ipAddressRegex.test(brokerIp) &&
          portValid &&
          topicName
        );
      } else {
        isStepValid.value = true;
      }
    } else if (isModelForm) {
      // Model form validation
      const fileData = formValues.file as Record<string, unknown> | undefined;
      const datastreamData = formValues.datastream as
        | Record<string, unknown>
        | undefined;

      if (type === 'file') {
        isStepValid.value = !!(fileData && fileData.files);
      } else if (type === 'datastream') {
        isStepValid.value = !!(
          datastreamData &&
          datastreamData.uri &&
          String(datastreamData.uri).trim()
        );
      } else {
        isStepValid.value = true;
      }
    } else {
      isStepValid.value = true;
    }
    return;
  }

  isStepValid.value = true;
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
  if (currentStep.value === 0) {
    // First step: next is enabled if type is selected
    return !!form.values.type;
  }
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
