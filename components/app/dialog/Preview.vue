<script setup lang="ts">
import { FileText, Hash, FileType, Rows3, AlertCircle } from 'lucide-vue-next';

interface FilePreviewData {
  dataset_id: string;
  dataset_name: string;
  file_name: string;
  file_size: number;
  content_type: string;
  total_lines: number;
  preview_lines: number;
  preview: string[];
  truncated: boolean;
}

const props = defineProps<{
  open: boolean;
  title: string;
  data: unknown;
  type: 'file' | 'table' | 'prometheus';
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
}>();

const { t } = useI18n();

// Check if data is file preview format
const isFilePreview = computed(() => {
  return (
    props.type === 'file' &&
    props.data &&
    typeof props.data === 'object' &&
    'preview' in (props.data as object) &&
    Array.isArray((props.data as FilePreviewData).preview)
  );
});

// Get file preview data
const filePreviewData = computed(() => {
  if (isFilePreview.value) {
    return props.data as FilePreviewData;
  }
  return null;
});

// Parse CSV preview into table format
const csvTableData = computed(() => {
  if (!filePreviewData.value?.preview?.length) return { headers: [], rows: [] };

  const lines = filePreviewData.value.preview;
  if (lines.length === 0) return { headers: [], rows: [] };

  // First line is headers
  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = lines
    .slice(1)
    .map((line) => line.split(',').map((c) => c.trim()));

  return { headers, rows };
});

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

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

const tableData = computed(() => {
  if (Array.isArray(props.data)) {
    return props.data as Array<Record<string, unknown>>;
  }
  return [];
});

const tableColumns = computed(() => {
  if (!isTableData.value || tableData.value.length === 0) return [];
  const firstRow = tableData.value[0];
  if (typeof firstRow === 'object' && firstRow !== null) {
    return Object.keys(firstRow);
  }
  return [];
});
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="!max-w-[1000px] w-[90vw] max-h-[80vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
      </DialogHeader>

      <div class="flex-1 overflow-auto">
        <!-- File Preview with Metadata -->
        <template v-if="isFilePreview && filePreviewData">
          <!-- File Metadata Header -->
          <div class="mb-4 p-4 bg-muted/50 rounded-lg border">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <!-- File Name -->
              <div class="flex items-start gap-2">
                <FileText class="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div class="min-w-0">
                  <p class="text-xs text-muted-foreground">
                    {{ t('label.file_name') }}
                  </p>
                  <p
                    class="text-sm font-medium truncate"
                    :title="filePreviewData.file_name"
                  >
                    {{ filePreviewData.file_name }}
                  </p>
                </div>
              </div>

              <!-- File Size -->
              <div class="flex items-start gap-2">
                <Hash class="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p class="text-xs text-muted-foreground">
                    {{ t('label.file_size') }}
                  </p>
                  <p class="text-sm font-medium">
                    {{ formatFileSize(filePreviewData.file_size) }}
                  </p>
                </div>
              </div>

              <!-- Content Type -->
              <div class="flex items-start gap-2">
                <FileType class="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p class="text-xs text-muted-foreground">
                    {{ t('label.content_type') }}
                  </p>
                  <p class="text-sm font-medium capitalize">
                    {{ filePreviewData.content_type }}
                  </p>
                </div>
              </div>

              <!-- Lines -->
              <div class="flex items-start gap-2">
                <Rows3 class="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p class="text-xs text-muted-foreground">
                    {{ t('label.lines') }}
                  </p>
                  <p class="text-sm font-medium">
                    {{ filePreviewData.preview_lines }}
                    <span class="text-muted-foreground font-normal">
                      / {{ filePreviewData.total_lines }}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Truncation Warning -->
          <div
            v-if="filePreviewData.truncated"
            class="mb-4 flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400 text-sm"
          >
            <AlertCircle class="w-4 h-4 flex-shrink-0" />
            <span>{{ t('hint.preview_truncated') }}</span>
          </div>

          <!-- CSV Table Preview -->
          <div
            v-if="csvTableData.headers.length > 0"
            class="rounded-md border overflow-hidden"
          >
            <div class="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow class="bg-muted/50">
                    <TableHead
                      v-for="(header, index) in csvTableData.headers"
                      :key="index"
                      class="font-semibold"
                    >
                      {{ header }}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow
                    v-for="(row, rowIndex) in csvTableData.rows"
                    :key="rowIndex"
                  >
                    <TableCell
                      v-for="(cell, cellIndex) in row"
                      :key="cellIndex"
                    >
                      {{ cell }}
                    </TableCell>
                  </TableRow>
                  <TableRow v-if="csvTableData.rows.length === 0">
                    <TableCell
                      :colspan="csvTableData.headers.length"
                      class="text-center text-muted-foreground py-8"
                    >
                      {{ t('hint.no_data') }}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          <!-- Raw Preview Fallback -->
          <div v-else class="rounded-md border overflow-hidden">
            <pre class="bg-muted/30 p-4 overflow-auto text-sm font-mono">{{
              filePreviewData.preview.join('\n')
            }}</pre>
          </div>
        </template>

        <!-- Database Table Preview -->
        <template v-else-if="isTableData && tableData.length > 0">
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
                <TableRow v-for="(row, index) in tableData" :key="index">
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
          <pre class="bg-muted p-4 rounded-md overflow-auto text-sm">{{
            formattedData
          }}</pre>
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
