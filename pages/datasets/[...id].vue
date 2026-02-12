<template>
  <div v-if="content" class="w-[840px] mx-auto max-w-full px-4 pb-12">
    <!-- Header Section -->
    <div class="mb-6">
      <h1 v-if="page.title != ''" class="text-2xl font-semibold mb-3">
        {{ page.title }}
      </h1>
      <div class="flex items-center gap-3 flex-wrap text-xs">
        <span class="inline-flex items-center gap-1.5 bg-muted px-2 py-1 rounded text-muted-foreground">
          <span class="font-medium text-foreground/70">Dataset Type:</span>
          <Badge :value="content.data_source_type" type="type" />
        </span>
        <span class="inline-flex items-center gap-1.5 bg-muted px-2 py-1 rounded text-muted-foreground">
          <span class="font-medium text-foreground/70">Data Usage:</span>
          <Badge value="id" type="type">{{
            $t(
              `label.${trainAndInferenceType[content.train_and_inference_type as keyof typeof trainAndInferenceType]}`,
            )
          }}</Badge>
        </span>
        <span class="inline-flex items-center gap-1.5 bg-muted px-2 py-1 rounded text-muted-foreground">
          <span class="font-medium text-foreground/70">Dataset ID:</span>
          <CopyPaste :has-copy="true" :copy-text="content.id">
            <span class="font-mono">{{ content.id }}</span>
          </CopyPaste>
        </span>
      </div>
    </div>

    <!-- Details Error -->
    <div v-if="detailsError" class="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
      <Icon name="lucide:alert-circle" class="size-5 text-destructive shrink-0 mt-0.5" />
      <div>
        <p class="text-sm font-medium text-destructive">
          {{ type ? $t(`label.${type}`) : '' }} Details Unavailable
        </p>
        <p class="text-xs text-muted-foreground mt-1">{{ detailsError }}</p>
      </div>
    </div>

    <!-- Details Cards -->
    <div v-if="additional" class="space-y-5">
      <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        {{ type ? $t(`label.${type}`) : '' }} Details
      </h2>
      <template
        v-for="group in additionalSchema[type as keyof typeof additionalSchema]"
        :key="group.key"
      >
        <div class="rounded-lg border border-border overflow-hidden">
          <!-- Card Header -->
          <div v-if="group.label" class="px-4 py-2.5 bg-muted/40 border-b border-border">
            <h3 class="text-sm font-semibold">
              {{ $t(`label.${group.key}`) }}
            </h3>
          </div>

          <!-- Card Body -->
          <div class="divide-y divide-border">
            <template v-for="item in group.items" :key="item.key">
              <div class="flex items-start px-4 py-3 gap-4">
                <!-- Label -->
                <div class="flex items-center gap-2 text-muted-foreground min-w-[160px] shrink-0 pt-0.5">
                  <Icon :name="item.icon" class="size-4" />
                  <span class="text-sm">{{ $t(`label.${item.key}`) }}</span>
                </div>

                <!-- Value -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <CopyPaste :has-copy="item.hasCopy">
                      <template v-if="item.type === 'text'">
                        <span class="text-sm font-medium break-all">{{
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
                        <span class="text-sm font-medium">{{
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
                        <div class="flex items-center gap-1.5 flex-wrap">
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
                      class="text-xs text-muted-foreground"
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
              </div>
            </template>
          </div>
        </div>
      </template>

      <!-- Topic Schema -->
      <div v-if="additional?.topic_details?.topic_schema" class="rounded-lg border border-border overflow-hidden">
        <div class="px-4 py-2.5 bg-muted/40 border-b border-border">
          <h3 class="text-sm font-semibold">
            {{ $t('label.topic_schema') }}
          </h3>
        </div>
        <Textarea
          readonly
          class="bg-background border-none rounded-none text-sm font-mono"
          :default-value="
            JSON.stringify(additional?.topic_details?.topic_schema, null, 2)
          "
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { getDataTypeFromValue, DATA_TYPE_MAPPING } from '~/utils';
import CopyPaste from '~/components/app/CopyPaste.vue';

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
const id = computed(() => route.params.id[0]);
const content = ref();
const additional = ref();
const type = ref();
const detailsError = ref<string | null>(null);

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
        section: 'datasets',
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
        } else {
          detailsError.value = `Could not load ${type.value} details for this dataset.`;
        }
      }
    }
  }
});
</script>

<style></style>
