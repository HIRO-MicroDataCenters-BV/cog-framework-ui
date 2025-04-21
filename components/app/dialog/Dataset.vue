<template>
  <AppDialog
    :open="open"
    :title="t('title.add_dataset')"
    :step-form-actions="stepFormActions"
    :navigation="formNavigation"
    :step="currentStep"
    @on-close="handleClose"
    @on-action="handleAction"
    @on-set-step="handleSetStep"
  >
    <StepForm
      :title="t('title.add_dataset')"
      :steps="formSteps"
      :validation-schema="formSchema"
      :initial-values="form.values"
      :review-items="reviewItems"
      :action-labels="actionLabels"
      :step="currentStep"
      :is-submit="isSubmit"
      @on-submit="onSubmit"
      @update-actions="(actions) => (stepFormActions = actions)"
    />
  </AppDialog>
</template>

<script lang="ts" setup>
import { useForm } from 'vee-validate';
import StepForm from '@/components/app/StepForm.vue';
import type { FormValues } from '@/types/form';
import {
  datasetFormSchema,
  datasetReviewItems,
} from '@/schemas/dataset-form.schema';
import {
  getDatasetFormSteps,
  datasetFormNavigation,
  getDatasetActionLabels,
} from '@/components/forms/dataset/steps';

const { t } = useI18n();
const props = withDefaults(
  defineProps<{
    open?: boolean;
  }>(),
  {
    open: false,
  },
);

const open = ref(props.open);
const currentStep = ref(0);
const stepFormActions = ref<string[]>([]);
const isSubmit = ref(false);
watch(
  () => props.open,
  (value) => {
    open.value = value;
  },
);

const emit = defineEmits<{
  (e: 'on-close'): void;
  (e: 'on-confirm', value: string | number | boolean): void;
}>();

const reviewItems = ref(datasetReviewItems);
const formSchema = datasetFormSchema;

const form = useForm<FormValues>({
  validationSchema: formSchema,
  //initialValues: datasetFormInitialValues,
});

const formNavigation = datasetFormNavigation;
const actionLabels = getDatasetActionLabels(t);

const formSteps = getDatasetFormSteps(t);

const handleClose = async () => {
  await emit('on-close');
  currentStep.value = 0;
  return true;
};

const handleSetStep = (step: number) => {
  currentStep.value = step;
};

const handleAction = (action: string | number | boolean) => {
  console.log('handleAction', action);
  isSubmit.value = false;
  if (action === 'close') {
    handleClose();
  } else if (action === 'submit') {
    isSubmit.value = true;
  }
};

const onSubmit = async (values: FormValues) => {
  console.log('onSubmit', values);
  isSubmit.value = false;
  try {
    const { submitDatasetForm } = useDatasetForm();
    const response = await submitDatasetForm(values);
    emit('on-close');

    return response;
  } catch (_) {
    currentStep.value = 0;
    return undefined;
  }
};
</script>
