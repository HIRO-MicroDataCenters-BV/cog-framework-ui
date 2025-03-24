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
    @on-next="
      async () => {
        step++;
        console.log('step', form.values);
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
        <Button type="submit">submit</Button>
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
        <div v-show="step == 2">
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
      broker_name: z.string(),
      broker_ip_address: z.string(),
      broker_port: z.string(),
      topic_name: z.string(),
      topic_schema: z.string(),
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
      broker_port: '',
      topic_name: '',
      topic_schema: '',
    },
  },
});

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
</style>
