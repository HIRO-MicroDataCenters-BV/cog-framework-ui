<template>
  <div v-if="content" class="w-full">
    <SimpleTabs v-model="activeTab" :tabs="tabs" class="mb-8" />

    <div class="px-4">
      <div v-if="activeTab === 'overview'">
        <template v-for="group in schema" :key="group.key">
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
                      additional?.[(group as { prefix: string }).prefix]?.[
                        item.key
                      ]
                        ? additional[(group as { prefix: string }).prefix]?.[
                            item.key
                          ]
                        : additional?.[item.key]
                          ? additional[item.key]
                          : content?.[item.key] || '-'
                    }}</span>
                  </template>
                  <template v-if="item.type === 'date'">
                    <span>{{
                      (() => {
                        const dateValue =
                          (group as { prefix?: string | null }).prefix &&
                          additional?.[(group as { prefix: string }).prefix]?.[
                            item.key
                          ]
                            ? additional[
                                (group as { prefix: string }).prefix
                              ]?.[item.key]
                            : additional?.[item.key]
                              ? additional[item.key]
                              : content?.[item.key];
                        return dateValue
                          ? dayjs(dateValue).format('YYYY MMM DD, HH:mm')
                          : '-';
                      })()
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
                    {{ content?.register_user_id || '-' }}
                  </template>
                  <template v-if="item.key == 'last_modified_time'">
                    {{ content?.last_modified_user_id || '-' }}
                  </template>
                </span>
              </div>
            </div>
          </template>
        </div>
      </template>
      </div>

      <div v-if="activeTab === 'artifacts'">
        <div class="text-gray-500 dark:text-gray-400">
          No artifacts available.
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import CopyPaste from '~/components/app/CopyPaste.vue';
import SimpleTabs from '~/components/app/SimpleTabs.vue';

const { t } = useI18n();
const dayjs = useDayjs();
const route = useRoute();
const { getModelById, getModelAssociationsById } = useApi();
const { setPage, page } = useApp();
const id = computed(() => route.params.id[0] as string);
const content = ref();
const additional = ref();

const activeTab = ref('overview');
const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'artifacts', label: 'Artifacts' },
];

const schema = [
  {
    key: 'default',
    label: null,
    prefix: null,
    items: [
      {
        key: 'id',
        type: 'text',
        icon: 'lucide:hash',
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
];

onMounted(async () => {
  try {
    const res = await getModelById(id.value);
    console.log('getModelById response:', res);

    if (res && 'data' in res && res.data) {
      const data = res.data;
      console.log('Model data:', data);
      content.value = data;

      if (content.value) {
        setPage({
          section: 'models',
          title: content.value.name as string,
          subtitle: content.value.description as string,
        });
      }
    } else {
      console.error('Invalid response format or no data:', res);
    }

    // Load additional associations data if needed
    try {
      const resAssociations = await getModelAssociationsById(id.value);
      if (
        resAssociations &&
        'data' in resAssociations &&
        resAssociations.data &&
        Array.isArray(resAssociations.data) &&
        resAssociations.data.length > 0
      ) {
        additional.value = resAssociations.data[0];
        console.log('Associations data:', additional.value);
      }
    } catch (err) {
      console.warn('Failed to load associations:', err);
    }
  } catch (error) {
    console.error('Error loading model:', error);
  }
});
</script>

<style></style>
