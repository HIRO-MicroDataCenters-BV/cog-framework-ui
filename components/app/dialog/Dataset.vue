<template>
  <AppDialog
    :open="open"
    :navigation="navigation"
    :title="t('title.add_dataset')"
    :actions="actions"
    :step="step"
    @on-next="
      async () => {
        console.log(step);
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
  >
    <div class="mb-8">
      <form @submit="onSubmit">
        <template v-if="step == 0">
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
                      <RadioGroupItem value="file" />
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
                      <RadioGroupItem value="file" />
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
        </template>
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
  () => step,
  (value) => {
    console.log(step, value);
    //open.value = value;
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
      brokerName: z.string(),
      brokerIPAddress: z.string(),
      brokerPort: z.string(),
      topicName: z.string(),
      topicSchema: z.string(),
    }),
  }),
);

const form = useForm({
  validationSchema: formSchema,
});

const onSubmit = form.handleSubmit((values) => {
  console.log('Form submitted!', values);
  step.value++;
});
</script>

<style>
.label {
  @apply mb-2;
}
.label-subtitle {
  @apply text-sm text-gray-400;
}
.form-item {
  @apply flex space-y-0 gap-x-3;
}
</style>
