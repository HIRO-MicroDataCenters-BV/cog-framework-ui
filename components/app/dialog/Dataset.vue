<template>
  <AppDialog
    :open="open"
    :title="t('title.add_dataset')"
    :step-form-actions="stepFormActions"
    :navigation="formNavigation"
    :step="currentStep"
    :is-next-enabled="isNextEnabled"
    class="max-h-full overflow-hidden h-[552px]"
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
      @update-next-enabled="(enabled) => (isNextEnabled = enabled)"
      @on-field-action="handleFieldAction"
    />
  </AppDialog>
</template>

<script lang="ts" setup>
import { useForm } from 'vee-validate';
import StepForm from '@/components/app/StepForm.vue';
import type { FormValues } from '~/types/form.types';
import {
  datasetFormSchema,
  datasetReviewItems,
} from '@/schemas/dataset-form.schema';
import {
  getDatasetFormSteps,
  getDatasetActionLabels,
  datasetFormNavigation,
} from '@/components/forms/dataset/steps';
import { useApi } from '@/composables/api';

const { getBrokerDetails, getTopicDetails } = useApi();

const { t } = useI18n();
const toaster = useToaster();
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
const isNextEnabled = ref(true);
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
  initialValues: {
    source_settings: {
      broker_selection: 'existing',
      topic_selection: 'existing',
    },
  },
});

const formNavigation = datasetFormNavigation;
const actionLabels = getDatasetActionLabels(t);

const brokerOptions = ref<{ label: string; value: string | number }[]>([]);
const topicOptions = ref<{ label: string; value: string | number }[]>([]);

const formSteps = computed(
  () => getDatasetFormSteps(t, brokerOptions, topicOptions).value,
);

interface BrokerDetail {
  id: number;
  broker_name: string;
  broker_ip: string;
  broker_port: number;
  creation_date: string;
}

interface TopicDetail {
  id: number;
  topic_name: string;
  topic_schema: string | Record<string, unknown>;
  broker_id: number;
  creation_date: string;
}

const fetchBrokerAndTopicDetails = async () => {
  try {
    const brokers = (await getBrokerDetails()) as {
      data?: BrokerDetail[];
    } | null;
    if (brokers?.data) {
      brokerOptions.value = brokers.data.map((b: BrokerDetail) => ({
        label: `${b.broker_name} (${b.broker_ip}:${b.broker_port})`,
        value: b.id,
      }));
    }

    const topics = (await getTopicDetails()) as {
      data?: TopicDetail[];
    } | null;
    if (topics?.data) {
      topicOptions.value = topics.data.map((topic: TopicDetail) => ({
        label: topic.topic_name,
        value: topic.id,
      }));
    }
  } catch (error) {
    console.error('Failed to fetch broker/topic details:', error);
  }
};

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      fetchBrokerAndTopicDetails();
    }
  },
  { immediate: true },
);

const { submitDatasetForm } = useDatasetForm();

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

const handleFieldAction = async (action: string, values: FormValues) => {
  if (action === 'test_connection') {
    const sourceSettings = values.source_settings as Record<string, unknown>;
    const db_url = sourceSettings?.db_url;
    const table_name = sourceSettings?.table_name;

    // Basic validation
    if (!db_url) {
      toaster.show('error', 'required_field');
      return;
    }

    try {
      console.log('Testing connection to:', db_url, 'table:', table_name);

      const config = useRuntimeConfig();
      const baseURL = config.app.baseURL || '/';

      const response = await fetch(`${baseURL}api/dataset/test-db-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ db_url, table_name }),
      });

      const result = await response.json();
      console.log('Connection test result:', result);

      if (result.success) {
        const { data } = result;
        if (table_name) {
          if (data.tableExists) {
            toaster.show('success', 'test_connection');
          } else {
            toaster.show('warning', 'test_connection');
          }
        } else {
          toaster.show('success', 'test_connection_no_table');
        }
      } else {
        toaster.show('error', 'connection_failed');
      }
    } catch (e: unknown) {
      console.error('Connection test error:', e);
      toaster.show('error', 'connection_failed');
    }
  }
};

const onSubmit = async (values: FormValues) => {
  console.log('onSubmit', values);
  isSubmit.value = false;
  try {
    const response = await submitDatasetForm(values);
    if (response && !('detail' in response)) {
      emit('on-close');
      currentStep.value = 0;
    }
    return response;
  } catch (error) {
    console.error('Error submitting dataset form:', error);
    currentStep.value = 0;
    return undefined;
  }
};
</script>
