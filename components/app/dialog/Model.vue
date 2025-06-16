<template>
  <AppDialog
    :open="open"
    :title="t('title.add_model')"
    :step-form-actions="stepFormActions"
    :navigation="formNavigation"
    :step="currentStep"
    @on-close="handleClose"
    @on-action="handleAction"
    @on-set-step="handleSetStep"
  >
    <StepForm
      :title="t('title.add_model')"
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
import type { FormValues } from '~/types/form.types';
import { modelFormSchema, modelReviewItems } from '@/schemas/model-form.schema';
import {
  getModelFormSteps,
  modelFormNavigation,
  getModelActionLabels,
} from '@/components/forms/model/steps';

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

const reviewItems = ref(modelReviewItems);
const formSchema = modelFormSchema;

const form = useForm<FormValues>({
  validationSchema: formSchema,
  // initialValues: datasetFormInitialValues,
});

const formNavigation = modelFormNavigation;
const actionLabels = getModelActionLabels(t);

const formSteps = getModelFormSteps(t);

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
    const { submitModelForm } = useModelForm();
    const response = await submitModelForm(values);
    emit('on-close');

    return response;
  } catch (_) {
    currentStep.value = 0;
    return undefined;
  }
};
</script>
