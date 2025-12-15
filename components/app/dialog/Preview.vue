<script setup lang="ts">
const props = defineProps<{
  open: boolean;
  title: string;
  data: any;
  type: 'file' | 'table' | 'prometheus';
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
}>();

const formattedData = computed(() => {
  if (!props.data) return '';
  
  if (typeof props.data === 'string') {
    return props.data;
  }
  
  return JSON.stringify(props.data, null, 2);
});

const isTableData = computed(() => {
  return props.type === 'table' && Array.isArray(props.data);
});

const tableColumns = computed(() => {
  if (!isTableData.value || !props.data || props.data.length === 0) return [];
  return Object.keys(props.data[0]);
});
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-4xl max-h-[80vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
      </DialogHeader>
      
      <div class="flex-1 overflow-auto">
        <!-- Table Preview -->
        <template v-if="isTableData && data && data.length > 0">
          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead v-for="column in tableColumns" :key="column">
                    {{ column }}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="(row, index) in data" :key="index">
                  <TableCell v-for="column in tableColumns" :key="column">
                    {{ row[column] }}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </template>

        <!-- JSON/Text Preview -->
        <template v-else>
          <pre class="bg-muted p-4 rounded-md overflow-auto text-sm">{{ formattedData }}</pre>
        </template>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="emit('update:open', false)">
          {{ $t('action.close') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
