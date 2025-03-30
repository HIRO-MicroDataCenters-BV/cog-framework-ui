<template>
  <div class="step-form-content">
    <div class="mb-8">
      <form @submit="onSubmit">
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
                  'field-wrapper': true,
                }"
              >
                <template
                  v-for="field in row.fields"
                  :key="`${stepIndex}-${rowIndex}-${field.name}`"
                >
                  <div
                    v-if="checkFieldCondition(field)"
                    :class="{
                      'field-wrapper': row.fields.length === 1,
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
                              <FormItem
                                v-for="option in field.options"
                                :key="option.value"
                                class="form-item"
                              >
                                <FormControl>
                                  <RadioGroupItem :value="option.value" />
                                </FormControl>
                                <FormLabel class="font-normal">
                                  <div class="label">
                                    {{ option.label }}
                                  </div>
                                  <div
                                    v-if="option.subtitle"
                                    class="label-subtitle"
                                  >
                                    {{ option.subtitle }}
                                  </div>
                                </FormLabel>
                              </FormItem>
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
                        <FormItem class="form-item form-item-input">
                          <FormLabel v-if="field.label" class="label">{{
                            field.label
                          }}</FormLabel>
                          <FormControl class="field">
                            <Input
                              type="text"
                              v-bind="componentField"
                              :placeholder="field.placeholder || ''"
                            />
                          </FormControl>
                        </FormItem>
                        <FormMessage />
                      </FormField>
                    </template>

                    <template v-else-if="field.type === 'number'">
                      <FormField
                        v-slot="{ componentField }"
                        type="number"
                        :name="field.name"
                      >
                        <FormItem class="form-item form-item-input">
                          <FormLabel v-if="field.label" class="label">{{
                            field.label
                          }}</FormLabel>
                          <FormControl class="field">
                            <Input
                              type="number"
                              v-bind="componentField"
                              :placeholder="field.placeholder || ''"
                            />
                          </FormControl>
                        </FormItem>
                        <FormMessage />
                      </FormField>
                    </template>

                    <template v-else-if="field.type === 'textarea'">
                      <FormField
                        v-slot="{ componentField }"
                        type="textarea"
                        :name="field.name"
                      >
                        <FormItem class="form-item form-item-input">
                          <FormLabel v-if="field.label" class="font-normal">{{
                            field.label
                          }}</FormLabel>
                          <FormControl>
                            <Textarea
                              v-bind="componentField"
                              :placeholder="field.placeholder || ''"
                            />
                          </FormControl>
                        </FormItem>
                        <FormMessage />
                      </FormField>
                    </template>

                    <template v-else-if="field.type === 'file'">
                      <FormField type="file" :name="field.name">
                        <FormItem class="form-item form-item-input">
                          <FormLabel v-if="field.label" class="label">{{
                            field.label
                          }}</FormLabel>
                          <FormControl class="field">
                            <Input
                              type="file"
                              :accept="field.accept || '.csv,.json'"
                              :placeholder="field.placeholder || ''"
                              @change="
                                (e: Event) => handleFileChange(e, field.name)
                              "
                            />
                          </FormControl>
                        </FormItem>
                        <FormMessage />
                      </FormField>
                    </template>

                    <template v-else-if="field.type === 'select'">
                      <FormField
                        v-slot="{ componentField }"
                        type="select"
                        :name="field.name"
                      >
                        <FormItem class="form-item form-item-input">
                          <FormLabel v-if="field.label" class="label">{{
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
                          <div class="space-y-1 leading-none">
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
          <Table class="table-review table-fixed">
            <TableBody>
              <TableRow
                v-for="(item, index) in reviewData"
                :key="`review-item-${index}`"
              >
                <TableCell class="th">{{ t(`label.${item.label}`) }}</TableCell>
                <TableCell class="td">{{ item.value }}</TableCell>
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
import { get as useGet } from 'lodash-es';

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
} from '@/types/form';

const { t } = useI18n();

const props = withDefaults(defineProps<StepFormProps>(), {
  title: '',
  step: 0,
  showReviewStep: true,
  initialValues: () => ({}),
  reviewItems: () => ({}) as ReviewItemsByType,
  actionLabels: () => ({
    close: 'Close',
    back: 'Back',
    next: 'Next',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
  }),
});

const emit = defineEmits<{
  'on-action': [action: ActionType, values: FormValues];
  'on-submit': [values: FormValues];
  'on-step-change': [step: number, actions: ActionType[]];
  'on-confirm': [values: FormValues];
  'update-actions': [actions: ActionType[]];
}>();

const currentStep = ref(props.step);

const form = useForm<FormValues>({
  validationSchema: props.validationSchema,
  initialValues: props.initialValues || {},
});

const currentActions = computed(() => {
  const totalSteps = props.steps.length + (props.showReviewStep ? 1 : 0);

  if (currentStep.value === 0) {
    return ['close', 'next'];
  } else if (currentStep.value === totalSteps - 1) {
    return ['back', 'confirm'];
  } else {
    return ['back', 'next'];
  }
});

watch(
  currentActions,
  (actions) => {
    emit('update-actions', actions);
  },
  { immediate: true },
);

watch(
  currentStep,
  (step) => {
    emit('on-step-change', step, currentActions.value);
  },
  { immediate: true },
);

watch(
  () => props.step,
  (value) => {
    currentStep.value = value;
  },
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
  reviewList = [...reviewList, ...props.reviewItems[type as string]];

  return reviewList.map((item) => {
    return {
      label: item.label,
      value: useGet(formValues, item.valuePath),
    };
  });
});

const handleFileChange = (event: Event, fieldName: string): void => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    form.setFieldValue(fieldName, file);
  }
};

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

const onSubmit = form.handleSubmit((values: FormValues) => {
  emit('on-submit', values);
});
</script>

<style>
.step-form-container {
  @apply flex;
}
.step-form-sidebar {
  @apply w-40 border-r pr-4;
}
.step-form-sidebar-header {
  @apply mb-4;
}
.step-form-title {
  @apply text-lg font-medium;
}
.step-form-content {
  @apply flex-1 pl-4;
}
.step-form-footer {
  @apply flex justify-end space-x-2;
}
.step-form-sidebar-menu-button {
  @apply font-light items-center;
}
.step-form-sidebar-menu-button.is-active {
  @apply font-medium;
}
.field {
  width: 100%;
}
.field-wrapper {
  @apply mb-6;
}
.label {
  @apply mb-1 w-full;
}
.label-subtitle {
  @apply text-sm text-gray-400;
}
.form-item {
  @apply flex space-y-0 gap-x-3;
}
.form-item-input {
  @apply mb-1 w-full flex flex-col;
}
.form-item-input label {
  @apply mb-2;
}
textarea {
  @apply w-full;
}
[role='alert'] {
  @apply text-xs;
}
.table-review {
  @apply w-full;
}
.table-review tr {
  @apply border-none;
}
.table-review .th,
.table-review .td {
  @apply text-left pb-4 pr-8 border-none;
}
.table-review .th {
  @apply text-gray-400;
}
.table-review .schema {
  @apply overflow-hidden overflow-y-auto;
  max-height: 10rem;
  width: 100%;
}
</style>
