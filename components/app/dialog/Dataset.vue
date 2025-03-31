<template>
  <AppDialog
    :open="open"
    :title="t('title.add_dataset')"
    :step-form-actions="stepFormActions"
    :navigation="formNavigation"
    :step="currentStep"
    @on-close="
      async () => {
        await emit('on-close');
        currentStep = 0;
        return true;
      }
    "
    @on-next="
      async () => {
        currentStep++;
        return true;
      }
    "
    @on-back="
      async () => {
        currentStep--;
        return true;
      }
    "
    @on-set-step="
      async (index) => {
        currentStep = index;
      }
    "
    @on-action="(action) => handleAction(action as string)"
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
      @on-step-change="
        (step, actions) => {
          currentStep = step;
          stepFormActions = actions;
        }
      "
      @update-actions="(actions) => (stepFormActions = actions)"
    />
  </AppDialog>
</template>

<script lang="ts" setup>
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import StepForm from '@/components/app/StepForm.vue';

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
}>();

const reviewItems = ref({
  file: [
    {
      label: 'data_source',
      valuePath: 'source_settings.dataset_file.name',
    },
  ],
  table: [
    {
      label: 'db_url',
      valuePath: 'source_settings.database_url',
    },
    {
      label: 'table_name',
      valuePath: 'source_settings.table_name',
    },
    {
      label: 'fields',
      valuePath: 'source_settings.selected_fields',
    },
  ],
  data_stream: [
    {
      label: 'broker_name',
      valuePath: 'source_settings.broker_name',
    },
    {
      label: 'broker_ip_address',
      valuePath: 'source_settings.broker_ip_address',
    },
    {
      label: 'broker_port',
      valuePath: 'source_settings.broker_port',
    },
    {
      label: 'topic_name',
      valuePath: 'source_settings.topic_name',
    },
    {
      label: 'topic_schema',
      valuePath: 'source_settings.topic_schema',
    },
  ],
});

const formSchema = toTypedSchema(
  z.object({
    type: z.enum(['file', 'table', 'data_stream']),
    metadata: z.object({
      name: z.string(),
      description: z.string(),
    }),
    source_settings: z.object({
      dataset_file: z.any().nullable().optional(),
      broker_name: z.string().optional(),
      broker_ip_address: z.string().ip().optional(),
      broker_port: z.number().optional(),
      topic_name: z.string().optional(),
      topic_schema: z.string().optional(),
      database_url: z.string().optional(),
      table_name: z.string().optional(),
      selected_fields: z.string().optional(),
    }),
  }),
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    type: 'file',
    metadata: {
      name: '',
      description: '',
    },
    source_settings: {
      broker_name: '',
      broker_ip_address: '',
      broker_port: 0,
      topic_name: '',
      topic_schema: '',
    },
  },
});

// Define navigation items for the form
const formNavigation = ['type', 'metadata', 'source_settings'];

// Define action labels
const actionLabels = {
  close: t('action.close'),
  back: t('action.back'),
  next: t('action.next'),
  confirm: t('action.confirm_add'),
};

const formSteps = ref([
  {
    rows: [
      {
        fields: [
          {
            type: 'radio',
            name: 'type',
            options: [
              {
                value: 'file',
                label: t('label.file'),
                subtitle: t('label_subtitle.file'),
              },
              {
                value: 'table',
                label: t('label.table'),
                subtitle: t('label_subtitle.table'),
              },
              {
                value: 'data_stream',
                label: t('label.data_stream'),
                subtitle: t('label_subtitle.data_stream'),
              },
            ],
          },
        ],
      },
    ],
  },
  {
    rows: [
      {
        fields: [
          {
            type: 'text',
            name: 'metadata.name',
            label: t('label.name'),
            placeholder: t('placeholder.dataset_name'),
          },
        ],
      },
      {
        fields: [
          {
            type: 'textarea',
            name: 'metadata.description',
            label: t('label.description'),
            placeholder: t('placeholder.dataset_description'),
          },
        ],
      },
    ],
  },
  {
    rows: [
      {
        fields: [
          {
            type: 'file',
            name: 'source_settings.dataset_file',
            label: t('label.dataset_file'),
            placeholder: t('placeholder.browse'),
            accept: '.csv,.json',
            condition: {
              field: 'type',
              operator: 'eq',
              value: 'file',
            },
          },
        ],
      },
      {
        fields: [
          {
            type: 'text',
            name: 'source_settings.database_url',
            label: t('label.database_url'),
            placeholder: t('placeholder.database_url'),
            condition: {
              field: 'type',
              operator: 'eq',
              value: 'table',
            },
          },
        ],
      },
      {
        fields: [
          {
            type: 'text',
            name: 'source_settings.table_name',
            label: t('label.table_name'),
            placeholder: t('placeholder.table_name'),
            condition: {
              field: 'type',
              operator: 'eq',
              value: 'table',
            },
          },
        ],
      },
      {
        fields: [
          {
            type: 'text',
            name: 'source_settings.selected_fields',
            label: t('label.selected_fields'),
            placeholder: t('placeholder.selected_fields'),
            condition: {
              field: 'type',
              operator: 'eq',
              value: 'table',
            },
          },
        ],
      },
      {
        fields: [
          {
            type: 'text',
            name: 'source_settings.broker_name',
            label: t('label.broker_name'),
            placeholder: t('placeholder.broker_name'),
            condition: {
              field: 'type',
              operator: 'eq',
              value: 'data_stream',
            },
          },
        ],
      },
      {
        fields: [
          {
            type: 'text',
            name: 'source_settings.broker_ip_address',
            label: t('label.broker_ip_address'),
            placeholder: t('placeholder.broker_ip_address'),
            condition: {
              field: 'type',
              operator: 'eq',
              value: 'data_stream',
            },
          },
          {
            type: 'number',
            name: 'source_settings.broker_port',
            label: t('label.broker_port'),
            placeholder: t('placeholder.broker_port'),
            condition: {
              field: 'type',
              operator: 'eq',
              value: 'data_stream',
            },
          },
        ],
      },
      {
        fields: [
          {
            type: 'text',
            name: 'source_settings.topic_name',
            label: t('label.topic_name'),
            placeholder: t('placeholder.topic_name'),
            condition: {
              field: 'type',
              operator: 'eq',
              value: 'data_stream',
            },
          },
        ],
      },
      {
        fields: [
          {
            type: 'textarea',
            name: 'source_settings.topic_schema',
            label: t('label.topic_schema'),
            placeholder: t('placeholder.topic_schema'),
            condition: {
              field: 'type',
              operator: 'eq',
              value: 'data_stream',
            },
          },
        ],
      },
    ],
  },
]);

const handleAction = (action: string) => {
  if (action === 'close') {
    emit('on-close');
  } else if (action === 'back') {
    currentStep.value--;
  } else if (action === 'next') {
    currentStep.value++;
  } else if (action === 'confirm') {
    form.handleSubmit(onSubmit)();
  }
};

const onSubmit = async (values: typeof form.values) => {
  console.log('Form submitted!', values);
};
</script>

<style>
/* Styles are now handled by the StepForm component */
</style>
