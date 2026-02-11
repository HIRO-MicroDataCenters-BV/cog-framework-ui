<script setup lang="ts">
import { FileText, Hash, FileType, Rows3, AlertCircle, Download } from 'lucide-vue-next';

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
  loading?: boolean;
  maxLimitReached?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'load-more'): void;
  (e: 'download'): void;
}>();

// Check if more data can be loaded (not at max limit and has more data)
const canLoadMore = computed(() => {
  if (!filePreviewData.value) return false;
  if (props.maxLimitReached) return false;
  return filePreviewData.value.preview_lines < filePreviewData.value.total_lines;
});

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
          <div class="mb-3 grid grid-cols-4 gap-2 sticky top-0 z-10 bg-background pb-2">
            <!-- File Name -->
            <div class="px-2 py-1.5 bg-muted/30 rounded-md border">
              <div class="flex items-center gap-1 mb-0.5">
                <FileText class="w-3 h-3 text-primary/70" />
                <span class="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                  {{ t('label.file_name') }}
                </span>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <p class="text-xs font-semibold truncate cursor-default">
                      {{ filePreviewData.file_name }}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{{ filePreviewData.file_name }}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <!-- File Size -->
            <div class="px-2 py-1.5 bg-muted/30 rounded-md border">
              <div class="flex items-center gap-1 mb-0.5">
                <Hash class="w-3 h-3 text-primary/70" />
                <span class="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                  {{ t('label.file_size') }}
                </span>
              </div>
              <p class="text-xs font-semibold">
                {{ formatFileSize(filePreviewData.file_size) }}
              </p>
            </div>

            <!-- Content Type -->
            <div class="px-2 py-1.5 bg-muted/30 rounded-md border">
              <div class="flex items-center gap-1 mb-0.5">
                <FileType class="w-3 h-3 text-primary/70" />
                <span class="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                  {{ t('label.content_type') }}
                </span>
              </div>
              <p class="text-xs font-semibold capitalize">
                {{ filePreviewData.content_type }}
              </p>
            </div>

            <!-- Lines -->
            <div class="px-2 py-1.5 bg-muted/30 rounded-md border">
              <div class="flex items-center gap-1 mb-0.5">
                <Rows3 class="w-3 h-3 text-primary/70" />
                <span class="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                  {{ t('label.lines') }}
                </span>
              </div>
              <p class="text-xs font-semibold">
                {{ filePreviewData.preview_lines }}
                <span class="text-muted-foreground font-normal">
                  / {{ filePreviewData.total_lines }}
                </span>
              </p>
            </div>
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

          <!-- Load More Button -->
          <div v-if="canLoadMore" class="mt-4 flex justify-center">
            <Button
              variant="outline"
              :disabled="props.loading"
              :class="props.loading ? 'cursor-wait' : 'cursor-pointer'"
              @click="emit('load-more')"
            >
              <Icon
                v-if="props.loading"
                name="lucide:loader-2"
                class="w-4 h-4 mr-2 animate-spin"
              />
              <Icon v-else name="lucide:chevrons-down" class="w-4 h-4 mr-2" />
              {{ t('action.load_more') }}
              <span class="text-muted-foreground ml-1">
                ({{ filePreviewData.total_lines - filePreviewData.preview_lines }}
                {{ t('label.rows_remaining') }})
              </span>
            </Button>
          </div>

          <!-- Max Limit Warning -->
          <div
            v-if="props.maxLimitReached"
            class="mt-4 flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400 text-sm"
          >
            <AlertCircle class="w-4 h-4 flex-shrink-0" />
            <span>{{ t('hint.preview_max_limit') }}</span>
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

      <DialogFooter class="gap-2">
        <Button
          v-if="isFilePreview"
          variant="default"
          class="cursor-pointer"
          @click="emit('download')"
        >
          <Download class="w-4 h-4 mr-2" />
          {{ $t('action.download_file') }}
        </Button>
        <Button variant="outline" class="cursor-pointer" @click="emit('update:open', false)">
          {{ $t('action.close') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
