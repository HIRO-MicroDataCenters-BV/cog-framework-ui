<template>
  <div v-if="content" class="w-[840px] mx-auto max-w-full px-4">
    <div class="mb-8">
      <header class="mb-8">
        <h1 v-if="page.title != ''" class="text-2xl font-medium">
          {{ page.title }}
        </h1>
      </header>
      <div class="flex gap-2">
        <Badge :value="content.data_source_type" type="type" />
        <Badge value="id" type="type">{{
          $t(
            `label.${trainAndInferenceType[content.train_and_inference_type as keyof typeof trainAndInferenceType]}`,
          )
        }}</Badge>
        <Badge value="id" type="type">#{{ content.id }}</Badge>
      </div>
    </div>
    <div v-if="additional">
      <template
        v-for="group in additionalSchema[type as keyof typeof additionalSchema]"
        :key="group.key"
      >
        <div v-if="group.label" class="mt-4 mb-2 first:mt-0">
          <h3 class="text-xl font-medium text-gray-700 dark:text-gray-300">
            {{ $t(`label.${group.key}`) }}
          </h3>
        </div>
        <div class="grid grid-cols-[auto_1fr] gap-x-2 gap-y-4 mb-8">
          <template v-for="item in group.items" :key="item.key">
            <div class="flex items-center gap-2 text-gray-500">
              <Icon :name="item.icon" />
              <span>{{ $t(`label.${item.key}`) }}</span>
            </div>
            <div>
              <div class="w-fit flex items-center gap-2">
                <CopyPaste :has-copy="item.hasCopy">
                  <template v-if="item.type === 'text'">
                    <span>{{
                      (group as { prefix?: string | null }).prefix &&
                      additional[(group as { prefix: string }).prefix]?.[
                        item.key
                      ]
                        ? additional[(group as { prefix: string }).prefix]?.[
                            item.key
                          ]
                        : additional[item.key]
                          ? additional[item.key]
                          : content[item.key]
                    }}</span>
                  </template>
                  <template v-if="item.type === 'date'">
                    <span>{{
                      dayjs(
                        (group as { prefix?: string | null }).prefix &&
                          additional[(group as { prefix: string }).prefix]?.[
                            item.key
                          ]
                          ? additional[(group as { prefix: string }).prefix]?.[
                              item.key
                            ]
                          : additional[item.key]
                            ? additional[item.key]
                            : content[item.key],
                      ).format('YYYY MMM DD, HH:mm')
                    }}</span>
                  </template>
                  <template v-if="item.type === 'list'">
                    <div class="flex items-center gap-2 flex-wrap">
                      <Badge
                        v-for="value in ((group as { prefix?: string | null })
                          .prefix
                          ? additional[(group as { prefix: string }).prefix]?.[
                              item.key
                            ]
                          : additional[item.key]
                        ).split(',')"
                        :key="value"
                        >{{ value }}</Badge
                      >
                    </div>
                  </template>
                </CopyPaste>
                <span
                  v-if="
                    item.key == 'register_date' ||
                    item.key == 'last_modified_time'
                  "
                  class="text-gray-500"
                >
                  {{ $t('hint.by') }}
                  <template v-if="item.key == 'register_date'">
                    {{ content.user_id }}
                  </template>
                  <template v-if="item.key == 'last_modified_time'">
                    {{ content.last_modified_user_id }}
                  </template>
                </span>
              </div>
            </div>
          </template>
        </div>
      </template>
      <div v-if="additional?.topic_details?.topic_schema" class="mt-4 mb-24">
        <div
          class="bg-gray-100 border border-gray-200 rounded-md overflow-hidden"
        >
          <Label class="px-2 py-2 border-b border-gray-200">{{
            $t('label.topic_schema')
          }}</Label>
          <Textarea
            readonly
            class="bg-white border-none rounded-none"
            :defaultValue="
              JSON.stringify(additional?.topic_details?.topic_schema, null, 2)
            "
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { getDataTypeFromValue, DATA_TYPE_MAPPING } from '~/utils';
import { CopyPaste } from '~/components/app/copy-paste';

const { t } = useI18n();
const dayjs = useDayjs();
const route = useRoute();
const {
  getDatasetById,
  getDatasetFileDetails,
  getDatasetTableDetails,
  getDatasetPrometheus,
  getDatasetMessageDetails,
} = useApi();
const { setPage, page } = useApp();
const id = computed(() => parseInt(route.params.id[0]));
const content = ref();
const additional = ref();
const type = ref();

console.log(DATA_TYPE_MAPPING);

const additionalSchema = {
  file: [
    {
      key: 'default',
      label: null,
      prefix: null,
      items: [
        {
          key: 'file_name',
          type: 'text',
          icon: 'lucide:text',
          hasCopy: true,
        },
        {
          key: 'file_path',
          type: 'text',
          icon: 'lucide:folder',
          hasCopy: true,
        },
        {
          key: 'register_date',
          type: 'date',
          icon: 'lucide:circle-plus',
          hasCopy: true,
        },
        {
          key: 'last_modified_time',
          type: 'date',
          icon: 'lucide:circle-fading-plus',
          hasCopy: true,
        },
      ],
    },
  ],
  database: [
    {
      key: 'default',
      label: null,
      prefix: null,
      items: [
        {
          key: 'db_url',
          type: 'text',
          icon: 'lucide:link',
          hasCopy: true,
        },
        {
          key: 'table_name',
          type: 'text',
          icon: 'lucide:table-2',
          hasCopy: true,
        },
        {
          key: 'fields_selected_list',
          type: 'list',
          icon: 'lucide:table-2',
          hasCopy: true,
        },
        {
          key: 'register_date',
          type: 'date',
          icon: 'lucide:circle-plus',
          hasCopy: true,
        },
        {
          key: 'last_modified_time',
          type: 'date',
          icon: 'lucide:circle-fading-plus',
          hasCopy: true,
        },
      ],
    },
  ],
  stream: [
    {
      key: 'default',
      label: null,
      prefix: null,
      items: [
        {
          key: 'register_date',
          type: 'date',
          icon: 'lucide:circle-plus',
          hasCopy: true,
        },
        {
          key: 'last_modified_time',
          type: 'date',
          icon: 'lucide:circle-fading-plus',
          hasCopy: true,
        },
      ],
    },
    {
      key: 'broker_details',
      label: 'broker_details',
      prefix: 'broker_details',
      items: [
        {
          key: 'broker_name',
          type: 'text',
          icon: 'lucide:text',
          hasCopy: true,
        },
        {
          key: 'broker_ip',
          type: 'text',
          icon: 'lucide:hash',
          hasCopy: true,
        },
        {
          key: 'broker_port',
          type: 'text',
          icon: 'lucide:text',
          hasCopy: true,
        },
        {
          key: 'creation_date',
          type: 'date',
          icon: 'lucide:circle-plus',
          hasCopy: true,
        },
      ],
    },
    {
      key: 'topic_details',
      label: 'topic_details',
      prefix: 'topic_details',
      items: [
        {
          key: 'topic_name',
          type: 'text',
          icon: 'lucide:text',
          hasCopy: true,
        },
        {
          key: 'broker_id',
          type: 'text',
          icon: 'lucide:hash',
          hasCopy: true,
        },
        {
          key: 'creation_date',
          type: 'date',
          icon: 'lucide:circle-plus',
          hasCopy: true,
        },
      ],
    },
  ],
  time_series: [
    {
      key: 'connection_type',
      label: 'connection_type',
      prefix: 'connection_type',
      items: [
        {
          key: 'prometheus_url',
          type: 'text',
          icon: 'lucide:link',
          hasCopy: true,
        },
        {
          key: 'frequency',
          type: 'text',
          icon: 'lucide:timer',
          hasCopy: true,
        },
        {
          key: 'timeout',
          type: 'text',
          icon: 'lucide:timer-off',
          hasCopy: true,
        },
        {
          key: 'data_source',
          type: 'text',
          icon: 'lucide:database',
          hasCopy: true,
        },
        {
          key: 'register_date',
          type: 'date',
          icon: 'lucide:circle-plus',
          hasCopy: true,
        },
        {
          key: 'last_modified_time',
          type: 'date',
          icon: 'lucide:circle-fading-plus',
          hasCopy: true,
        },
      ],
    },
    {
      key: 'metric_list',
      label: 'metric_list',
      prefix: 'metric_list',
      items: [
        {
          key: 'METRIC_FEATURES',
          type: 'list',
          icon: 'lucide:braces',
          hasCopy: true,
        },
        {
          key: 'TARGET_NAMESPACE',
          type: 'text',
          icon: 'lucide:braces',
          hasCopy: true,
        },
        {
          key: 'QUERY_DURATION',
          type: 'text',
          icon: 'lucide:braces',
          hasCopy: true,
        },
      ],
    },
    {
      key: 'feature_list',
      label: 'feature_list',
      prefix: 'feature_list',
      items: [
        {
          key: 'component',
          type: 'text',
          icon: 'lucide:braces',
          hasCopy: true,
        },
        {
          key: 'endpoint',
          type: 'text',
          icon: 'lucide:braces',
          hasCopy: true,
        },
        {
          key: 'group',
          type: 'text',
          icon: 'lucide:braces',
          hasCopy: true,
        },
        {
          key: 'instance',
          type: 'text',
          icon: 'lucide:braces',
          hasCopy: true,
        },
        {
          key: 'job',
          type: 'text',
          icon: 'lucide:braces',
          hasCopy: true,
        },
        {
          key: 'le',
          type: 'text',
          icon: 'lucide:braces',
          hasCopy: true,
        },
        {
          key: 'namespace',
          type: 'text',
          icon: 'lucide:braces',
          hasCopy: true,
        },
        {
          key: 'resource',
          type: 'text',
          icon: 'lucide:braces',
          hasCopy: true,
        },
        {
          key: 'scope',
          type: 'text',
          icon: 'lucide:braces',
          hasCopy: true,
        },
        {
          key: 'service',
          type: 'text',
          icon: 'lucide:braces',
          hasCopy: true,
        },
        {
          key: 'verb',
          type: 'text',
          icon: 'lucide:braces',
          hasCopy: true,
        },
        {
          key: 'version',
          type: 'text',
          icon: 'lucide:braces',
          hasCopy: true,
        },
      ],
    },
  ],
};

const additionalDataSource = {
  file: getDatasetFileDetails,
  database: getDatasetTableDetails,
  time_series: getDatasetPrometheus,
  stream: getDatasetMessageDetails,
};

const trainAndInferenceType = {
  0: 'train',
  1: 'inference',
  2: 'train_and_inference',
};

onMounted(async () => {
  const res = await getDatasetById(id.value);
  if (res && 'data' in res && res.data) {
    const data = res.data;
    content.value = data;
    if (content.value) {
      type.value = getDataTypeFromValue(
        content.value.data_source_type as number,
      );
      setPage({
        section: 'dataset_management',
        title: content.value.dataset_name as string,
        subtitle: '',
      });

      if (type.value) {
        const resAdditional = await additionalDataSource[
          type.value as keyof typeof additionalDataSource
        ](id.value);
        if (resAdditional && 'data' in resAdditional && resAdditional.data) {
          const data = resAdditional.data;
          additional.value = data;
          console.log(additional.value);
        }
      }
    }
  }
});
</script>

<style></style>
