<template>
  <AppDialog
    :open="open"
    :title="t('title.add_dataset')"
    :step-form-actions="stepFormActions"
    :navigation="formNavigation"
    :step="currentStep"
    @on-close="handleClose"
    @on-action="handleAction"
  >
    <StepForm
      :title="t('title.add_dataset')"
      :steps="formSteps"
      :validation-schema="formSchema"
      :initial-values="form.values"
      :review-items="reviewItems"
      :action-labels="actionLabels"
      :step="currentStep"
      @on-submit="onSubmit"
      @on-confirm="onSubmit"
      @on-step-change="handleStepChange"
      @update-actions="(actions) => (stepFormActions = actions)"
    />
  </AppDialog>
</template>

<script lang="ts" setup>
import { useForm } from 'vee-validate';
import StepForm from '@/components/app/StepForm.vue';
import {
  datasetFormSchema,
  datasetFormInitialValues,
  datasetReviewItems,
} from '@/components/forms/dataset/schema';
import {
  getDatasetFormSteps,
  datasetFormNavigation,
  getDatasetActionLabels,
} from '@/components/forms/dataset/steps';
import { submitDatasetForm } from '@/components/forms/dataset/handlers';

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
watch(
  () => props.open,
  (value) => {
    open.value = value;
  },
);

const emit = defineEmits<{
  (e: 'on-close'): void;
  (e: 'on-confirm'): void;
}>();

const reviewItems = ref(datasetReviewItems);
const formSchema = datasetFormSchema;

const form = useForm({
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

const handleStepChange = (step: number, actions: string[]) => {
  currentStep.value = step;
  stepFormActions.value = actions;
};

const handleAction = (action: string | number | boolean) => {
  if (action === 'close') {
    handleClose();
  } else if (action === 'confirm') {
    form.handleSubmit(onSubmit)();
  } else if (
    action === 'save' &&
    currentStep.value === formNavigation.length - 1
  ) {
    form.handleSubmit(onSubmit)();
  }
};

const onSubmit = async (values: typeof form.values | undefined) => {
  if (!values) {
    return undefined;
  }
  try {
    const res = await submitDatasetForm(values);
    emit('on-close');
    return res;
  } catch (error) {
    if (!(error instanceof Error && error.message.includes('validation'))) {
      currentStep.value = 0;
    }
    return undefined;
  }
};
</script>
