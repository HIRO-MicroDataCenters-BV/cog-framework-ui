<template>
  <AppDialog
    :open="open"
    :navigation="navigation"
    :title="t('title.add_dataset')"
    :actions="actions"
    :step="step"
    @on-set-step="
      async (value: number) => {
        step = value;
        return false;
      }
    "
    @on-back="
      async () => {
        step--;
        return false;
      }
    "
    @on-next="
      async () => {
        step++;
        return false;
      }
    "
    @on-close="
      async () => {
        await emit('on-close');
        step = 0;
        return true;
      }
    "
    @on-save="
      async () => {
        return false;
      }
    "
  >
    <div class="mb-8">
      <form @submit="onSubmit">
        <div v-show="step == 0">
          <FormField v-slot="{ componentField }" type="radio" name="type">
            <FormItem class="space-y-3">
              <FormControl>
                <RadioGroup
                  class="flex flex-col space-y-1"
                  v-bind="componentField"
                >
                  <FormItem class="form-item">
                    <FormControl>
                      <RadioGroupItem value="file" />
                    </FormControl>
                    <FormLabel class="font-normal"
                      ><div class="label">
                        {{ t('label.file') }}
                      </div>
                      <div class="label-subtitle">
                        {{ t('label_subtitle.file') }}
                      </div></FormLabel
                    >
                  </FormItem>
                  <FormItem class="form-item">
                    <FormControl>
                      <RadioGroupItem value="table" />
                    </FormControl>
                    <FormLabel class="font-normal"
                      ><div class="label">
                        {{ t('label.table') }}
                      </div>
                      <div class="label-subtitle">
                        {{ t('label_subtitle.table') }}
                      </div></FormLabel
                    >
                  </FormItem>
                  <FormItem class="form-item">
                    <FormControl>
                      <RadioGroupItem value="data_stream" />
                    </FormControl>
                    <FormLabel class="font-normal"
                      ><div class="label">
                        {{ t('label.data_stream') }}
                      </div>
                      <div class="label-subtitle">
                        {{ t('label_subtitle.data_stream') }}
                      </div></FormLabel
                    >
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
        </div>
        <div v-show="step == 1">
          <div class="field-wrapper">
            <FormField
              v-slot="{ componentField }"
              type="text"
              name="metadata.name"
            >
              <FormItem class="form-item form-item-input">
                <FormLabel class="label">{{ t('label.name') }}</FormLabel>
                <FormControl class="field">
                  <Input
                    type="text"
                    v-bind="componentField"
                    :placeholder="t('placeholder.dataset_name')"
                  />
                </FormControl>
              </FormItem>
              <FormMessage />
            </FormField>
          </div>
          <div class="field-wrapper">
            <FormField
              v-slot="{ componentField }"
              type="textarea"
              name="metadata.description"
            >
              <FormItem class="form-item form-item-input">
                <FormLabel class="font-normal">{{
                  t('label.description')
                }}</FormLabel>
                <FormControl>
                  <Textarea
                    v-bind="componentField"
                    :placeholder="t('placeholder.dataset_description')"
                  />
                </FormControl>
              </FormItem>
              <FormMessage />
            </FormField>
          </div>
        </div>

        <div v-show="step == 2 && form.values.type == 'file'">
          <div class="field-wrapper">
            <FormField type="file" name="source_settings.dataset_file">
              <FormItem class="form-item form-item-input">
                <FormLabel class="label">{{
                  t('label.dataset_file')
                }}</FormLabel>
                <FormControl class="field">
                  <Input
                    type="file"
                    accept=".csv,.json"
                    @change="handleFileChange"
                    :placeholder="t('placeholder.browse')"
                  />
                </FormControl>
              </FormItem>
              <FormMessage />
            </FormField>
          </div>
        </div>

        <div v-show="step == 2 && form.values.type == 'table'">
          <div class="field-wrapper">
            <FormField
              v-slot="{ componentField }"
              type="text"
              name="source_settings.database_url"
            >
              <FormItem class="form-item form-item-input">
                <FormLabel class="label">{{
                  t('label.database_url')
                }}</FormLabel>
                <FormControl class="field">
                  <Input
                    type="text"
                    accept=".csv,.json"
                    v-bind="componentField"
                    :placeholder="t('placeholder.database_url')"
                  />
                </FormControl>
              </FormItem>
              <FormMessage />
            </FormField>
          </div>
          <div class="field-wrapper">
            <FormField
              v-slot="{ componentField }"
              type="text"
              name="source_settings.table_name"
            >
              <FormItem class="form-item form-item-input">
                <FormLabel class="label">{{ t('label.table_name') }}</FormLabel>
                <FormControl class="field">
                  <Input
                    type="text"
                    accept=".csv,.json"
                    v-bind="componentField"
                    :placeholder="t('placeholder.table_name')"
                  />
                </FormControl>
              </FormItem>
              <FormMessage />
            </FormField>
          </div>
          <div class="field-wrapper">
            <FormField
              v-slot="{ componentField }"
              type="text"
              name="source_settings.selected_fields"
            >
              <FormItem class="form-item form-item-input">
                <FormLabel class="label">{{
                  t('label.selected_fields')
                }}</FormLabel>
                <FormControl class="field">
                  <Input
                    type="text"
                    accept=".csv,.json"
                    v-bind="componentField"
                    :placeholder="t('placeholder.selected_fields')"
                  />
                </FormControl>
              </FormItem>
              <FormMessage />
            </FormField>
          </div>
        </div>

        <div v-show="step == 2 && form.values.type == 'data_stream'">
          <div class="field-wrapper">
            <FormField
              v-slot="{ componentField }"
              type="text"
              name="source_settings.broker_name"
            >
              <FormItem class="form-item form-item-input">
                <FormLabel class="label">{{
                  t('label.broker_name')
                }}</FormLabel>
                <FormControl class="field">
                  <Input
                    type="text"
                    v-bind="componentField"
                    :placeholder="t('placeholder.broker_name')"
                  />
                </FormControl>
              </FormItem>
              <FormMessage />
            </FormField>
          </div>
          <div class="flex gap-2">
            <div class="field-wrapper">
              <FormField
                v-slot="{ componentField }"
                type="text"
                name="source_settings.broker_ip_address"
              >
                <FormItem class="form-item form-item-input">
                  <FormLabel class="label">{{
                    t('label.broker_ip_address')
                  }}</FormLabel>
                  <FormControl class="field">
                    <Input
                      type="text"
                      v-bind="componentField"
                      :placeholder="t('placeholder.broker_ip_address')"
                    />
                  </FormControl>
                </FormItem>
                <FormMessage />
              </FormField>
            </div>
            <div class="field-wrapper">
              <FormField
                v-slot="{ componentField }"
                type="text"
                name="source_settings.broker_port"
              >
                <FormItem class="form-item form-item-input">
                  <FormLabel class="label">{{
                    t('label.broker_port')
                  }}</FormLabel>
                  <FormControl class="field">
                    <Input
                      type="number"
                      v-bind="componentField"
                      :placeholder="t('placeholder.broker_port')"
                    />
                  </FormControl>
                </FormItem>
                <FormMessage />
              </FormField>
            </div>
          </div>
          <div class="field-wrapper">
            <FormField
              v-slot="{ componentField }"
              type="text"
              name="source_settings.topic_name"
            >
              <FormItem class="form-item form-item-input">
                <FormLabel class="label">{{ t('label.topic_name') }}</FormLabel>
                <FormControl class="field">
                  <Input
                    type="text"
                    v-bind="componentField"
                    :placeholder="t('placeholder.topic_name')"
                  />
                </FormControl>
              </FormItem>
              <FormMessage />
            </FormField>
          </div>
          <div class="field-wrapper">
            <FormField
              v-slot="{ componentField }"
              type="textarea"
              name="source_settings.topic_schema"
            >
              <FormItem class="form-item form-item-input">
                <FormLabel class="font-normal">{{
                  t('label.topic_schema')
                }}</FormLabel>
                <FormControl>
                  <Textarea
                    v-bind="componentField"
                    :placeholder="t('placeholder.topic_schema')"
                  />
                </FormControl>
              </FormItem>
              <FormMessage />
            </FormField>
          </div>
        </div>
        <div v-show="step == 3 && form.values.type == 'file'">
          <Table class="table-review">
            <TableBody>
              <TableRow class="tr">
                <TableCell class="th"> {{ t('label.type') }}</TableCell>
                <TableCell class="td"> {{ form.values.type }} </TableCell>
              </TableRow>
              <TableRow class="tr">
                <TableCell class="th"> {{ t('label.name') }}</TableCell>
                <TableCell class="td">
                  {{ form.values.metadata?.name }}
                </TableCell>
              </TableRow>
              <TableRow class="tr">
                <TableCell class="th"> {{ t('label.description') }}</TableCell>
                <TableCell class="td">
                  {{ form.values.metadata?.description }}
                </TableCell>
              </TableRow>
              <TableRow class="tr">
                <TableCell class="th"> {{ t('label.data_source') }}</TableCell>
                <TableCell class="td">
                  {{ form.values.source_settings?.dataset_file?.name }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div v-show="step == 3 && form.values.type == 'table'">
          <Table class="table-review">
            <TableBody>
              <TableRow class="tr">
                <TableCell class="th"> {{ t('label.type') }}</TableCell>
                <TableCell class="td"> {{ form.values.type }} </TableCell>
              </TableRow>
              <TableRow class="tr">
                <TableCell class="th"> {{ t('label.name') }}</TableCell>
                <TableCell class="td">
                  {{ form.values.metadata?.name }}
                </TableCell>
              </TableRow>
              <TableRow class="tr">
                <TableCell class="th"> {{ t('label.description') }}</TableCell>
                <TableCell class="td">
                  {{ form.values.metadata?.description }}
                </TableCell>
              </TableRow>
              <TableRow class="tr">
                <TableCell class="th"> {{ t('label.db_url') }}</TableCell>
                <TableCell class="td">
                  {{ form.values.source_settings?.database_url }}
                </TableCell>
              </TableRow>
              <TableRow class="tr">
                <TableCell class="th"> {{ t('label.table_name') }}</TableCell>
                <TableCell class="td">
                  {{ form.values.source_settings?.table_name }}
                </TableCell>
              </TableRow>
              <TableRow class="tr">
                <TableCell class="th"> {{ t('label.fields') }}</TableCell>
                <TableCell class="td">
                  {{ form.values.source_settings?.selected_fields }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div v-show="step == 3 && form.values.type == 'data_stream'">
          <Table class="table-review">
            <TableBody>
              <TableRow class="tr">
                <TableCell class="th"> {{ t('label.type') }}</TableCell>
                <TableCell class="td"> {{ form.values.type }} </TableCell>
              </TableRow>
              <TableRow class="tr">
                <TableCell class="th"> {{ t('label.name') }}</TableCell>
                <TableCell class="td">
                  {{ form.values.metadata?.name }}
                </TableCell>
              </TableRow>
              <TableRow class="tr">
                <TableCell class="th"> {{ t('label.description') }}</TableCell>
                <TableCell class="td">
                  {{ form.values.metadata?.description }}
                </TableCell>
              </TableRow>
              <TableRow class="tr">
                <TableCell class="th"> {{ t('label.broker_name') }}</TableCell>
                <TableCell class="td">
                  {{ form.values.source_settings?.broker_name }}
                </TableCell>
              </TableRow>
              <TableRow class="tr">
                <TableCell class="th">
                  {{ t('label.broker_ip_address') }}</TableCell
                >
                <TableCell class="td">
                  {{ form.values.source_settings?.broker_ip_address }}
                </TableCell>
              </TableRow>
              <TableRow class="tr">
                <TableCell class="th"> {{ t('label.broker_port') }}</TableCell>
                <TableCell class="td">
                  {{ form.values.source_settings?.broker_name }}
                </TableCell>
              </TableRow>
              <TableRow class="tr">
                <TableCell class="th"> {{ t('label.topic_name') }}</TableCell>
                <TableCell class="td">
                  {{ form.values.source_settings?.topic_name }}
                </TableCell>
              </TableRow>
              <TableRow class="tr">
                <TableCell class="th"> {{ t('label.topic_schema') }}</TableCell>
                <TableCell class="td td-overflow">
                  <div class="schema">
                    {{ form.values.source_settings?.topic_schema }}
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </form>
    </div>
  </AppDialog>
</template>

<script lang="ts" setup>
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
const actions = ref(['close', 'next']);

const step = ref(0);
watch(
  () => props.open,
  (value) => {
    open.value = value;
  },
);

watch(
  () => step.value,
  (value) => {
    step.value = value;
    if (step.value == 0) {
      actions.value = ['close', 'next'];
    } else if (step.value == 3) {
      actions.value = ['back', 'confirm_add'];
    } else {
      actions.value = ['back', 'next'];
    }
  },
);

const emit = defineEmits<{
  (e: 'on-close'): void;
}>();

const navigation = ref(['type', 'metadata', 'source_settings', 'review']);

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

const handleFileChange = (event: Event) => {
  const file = (event.target as HTMLInputElement)?.files?.[0];
  if (file) {
    // Instead of trying to set the value directly (which causes the error),
    // we store the file object in the form values
    form.setFieldValue('source_settings.dataset_file', file);
  }
};

const onSubmit = form.handleSubmit((values) => {
  console.log('Form submitted!', values);
});
</script>

<style>
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
