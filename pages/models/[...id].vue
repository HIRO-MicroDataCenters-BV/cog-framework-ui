<template>
  <div v-if="content">
    <Table class="w-full table-fixed">
      <TableBody>
        <TableRow
          v-for="(item, index) in schema"
          :key="`content-item-${index}`"
        >
          <TableCell class="text-left pb-4 pr-8 border-none text-gray-400">{{
            t(`label.${item.key}`)
          }}</TableCell>
          <TableCell class="text-left pb-4 pr-8 border-none">
            <template v-if="item.type === 'text'">
              {{ content[item.key] }}
            </template>
            <template v-if="item.type === 'date'">
              {{ dayjs(content[item.key]).format('YYYY-MM-DD HH:mm:ss') }}
            </template>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n();
const dayjs = useDayjs();
const route = useRoute();
const { getModelById } = useApi();
const { setPage } = useApp();
const id = computed(() => route.params.id[0] as string);
const content = ref();
const schema = [
  {
    key: 'type',
    type: 'text',
  },
  {
    key: 'last_modified_time',
    type: 'date',
  },
  {
    key: 'register_date',
    type: 'date',
  },
  {
    key: 'version',
    type: 'text',
  },
  {
    key: 'register_user_id',
    type: 'text',
  },
];

onMounted(async () => {
  const res = await getModelById(id.value);
  if (res && 'data' in res && res.data) {
    const data = res.data;
    content.value = data;
    if (content.value) {
      setPage({
        section: 'models',
        title: content.value.name as string,
        subtitle: content.value.description as string,
      });
    }
  }
});
</script>

<style></style>
