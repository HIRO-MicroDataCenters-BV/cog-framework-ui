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
                      'mb-6': row.fields.length === 1,
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
                                class="flex space-y-0 gap-x-3"
                              >
                                <FormControl>
                                  <RadioGroupItem :value="option.value" />
                                </FormControl>
                                <FormLabel class="font-normal flex flex-col">
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
                        <FormItem
                          class="flex space-y-0 gap-x-3 mb-1 w-full flex flex-col"
                        >
                          <FormLabel v-if="field.label" class="mb-1 w-full">{{
                            field.label
                          }}</FormLabel>
                          <FormControl class="w-full">
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
                        <FormItem
                          class="flex space-y-0 gap-x-3 mb-1 w-full flex flex-col"
                        >
                          <FormLabel v-if="field.label" class="mb-1 w-full">{{
                            field.label
                          }}</FormLabel>
                          <FormControl class="w-full">
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
                        <FormItem
                          class="flex space-y-0 gap-x-3 mb-1 w-full flex flex-col"
                        >
                          <FormLabel
                            v-if="field.label"
                            class="font-normal mb-2"
                            >{{ field.label }}</FormLabel
                          >
                          <FormControl>
                            <Textarea
                              v-bind="componentField"
                              :placeholder="field.placeholder || ''"
                              class="w-full"
                            />
                          </FormControl>
                        </FormItem>
                        <FormMessage />
                      </FormField>
                    </template>

                    <template v-else-if="field.type === 'file'">
                      <FormField type="file" :name="field.name">
                        <FormItem
                          class="flex space-y-0 gap-x-3 mb-1 w-full flex flex-col"
                        >
                          <FormLabel v-if="field.label" class="mb-1 w-full">{{
                            field.label
                          }}</FormLabel>
                          <FormControl class="w-full">
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
                        <FormItem
                          class="flex space-y-0 gap-x-3 mb-1 w-full flex flex-col"
                        >
                          <FormLabel v-if="field.label" class="mb-1 w-full">{{
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
                <TableCell
                  class="text-left pb-4 pr-8 border-none text-gray-400"
                  >{{ t(`label.${item.label}`) }}</TableCell
                >
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
}>();
const currentStep = ref(props.step);

const form = useForm<FormValues>({
  validationSchema: props.validationSchema,
  initialValues: props.initialValues || {},
});

const handleAction = (action: ActionType) => {
  if (action === 'next') {
    currentStep.value++;
    emit('on-step-change', currentStep.value, currentActions.value);
  } else if (action === 'back' && currentStep.value > 0) {
    currentStep.value--;
    emit('on-step-change', currentStep.value, currentActions.value);
  } else if (action === 'submit') {
    onSubmit();
  }

  emit('on-action', action, form.values);
};

const currentActions = computed(() => {
  const totalSteps = props.steps.length + (props.showReviewStep ? 1 : 0);

  if (currentStep.value === 0) {
    return ['next'];
  } else if (currentStep.value === totalSteps - 1) {
    return ['back', 'submit'];
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
  (value) => {
    emit('on-step-change', value, currentActions.value);
  },
  { immediate: true },
);

watch(
  () => props.isSubmit,
  (value) => {
    if (value) {
      onSubmit();
    }
  },
  { immediate: true },
);

watch(
  () => props.step,
  (value) => {
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
  console.log('Form values:', values);
  emit('on-submit', values);
});
</script>
