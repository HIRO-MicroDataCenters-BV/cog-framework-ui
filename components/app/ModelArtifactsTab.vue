<template>
  <!-- Loading State -->
  <div v-if="loading" class="h-full flex items-center justify-center">
    <div class="text-center">
      <Icon
        name="lucide:loader-2"
        class="w-8 h-8 mx-auto mb-2 animate-spin text-primary"
      />
      <p class="text-sm text-muted-foreground">Loading artifacts...</p>
    </div>
  </div>

  <div v-else class="h-full flex gap-4 overflow-hidden">
    <!-- Left Panel: File Tree -->
    <Card class="w-80 flex-shrink-0 flex flex-col transition-all duration-200">
      <CardHeader class="py-3 px-4 flex-shrink-0">
        <CardTitle class="flex items-center gap-2 text-sm">
          <div class="p-1 rounded bg-green-100 dark:bg-green-900/50">
            <Icon
              name="lucide:folder-tree"
              class="w-3.5 h-3.5 text-green-600 dark:text-green-400"
            />
          </div>
          Files
          <Badge
            v-if="artifacts?.model_files?.length"
            variant="secondary"
            class="ml-auto text-xs"
          >
            {{ artifacts.model_files.length }}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent class="flex-1 overflow-y-auto px-2 pb-4 pt-0">
        <div v-if="fileTree.length" class="space-y-0.5">
          <TreeRoot
            v-model:expanded="expandedFolders"
            :items="fileTree"
            :get-key="(item) => item.id"
            :get-children="(item) => item.children"
            class="w-full"
          >
            <template #default="{ flattenItems }">
              <TreeItem
                v-for="item in flattenItems"
                :key="item._id"
                v-slot="{ isExpanded, handleToggle }"
                :style="{ paddingLeft: `${item.level * 12}px` }"
                :value="item.value"
                :level="item.level"
                class="flex items-center gap-1.5 py-1.5 px-2 rounded-md cursor-pointer transition-colors text-sm select-none"
                :class="[
                  selectedFile?.id === item.value.id
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted/50',
                ]"
                @click="
                  () => {
                    if (item.value.isFolder) {
                      handleToggle();
                    } else {
                      selectFile(item.value);
                    }
                  }
                "
              >
                <!-- Folder toggle -->
                <button
                  v-if="item.value.isFolder"
                  class="p-0.5 hover:bg-muted rounded transition-colors"
                  @click.stop="handleToggle"
                >
                  <Icon
                    :name="
                      isExpanded
                        ? 'lucide:chevron-down'
                        : 'lucide:chevron-right'
                    "
                    class="w-3.5 h-3.5 text-muted-foreground"
                  />
                </button>
                <span v-else class="w-4" />

                <!-- Icon -->
                <Icon
                  :name="
                    item.value.isFolder
                      ? isExpanded
                        ? 'lucide:folder-open'
                        : 'lucide:folder'
                      : getFileIcon(item.value.name)
                  "
                  :class="[
                    'w-4 h-4 flex-shrink-0',
                    item.value.isFolder
                      ? 'text-amber-500'
                      : getFileIconColor(item.value.name),
                  ]"
                />

                <!-- Name -->
                <span class="truncate flex-1" :title="item.value.name">
                  {{ item.value.name }}
                </span>

                <!-- File type text -->
                <span
                  v-if="
                    !item.value.isFolder && getFileExtension(item.value.name)
                  "
                  class="text-[10px] text-muted-foreground uppercase"
                >
                  {{ getFileExtension(item.value.name) }}
                </span>
              </TreeItem>
            </template>
          </TreeRoot>
        </div>

        <!-- Empty state -->
        <div v-else class="text-muted-foreground text-center py-8">
          <Icon
            name="lucide:folder-x"
            class="w-10 h-10 mx-auto mb-2 opacity-50"
          />
          <p class="text-sm">No files available</p>
        </div>
      </CardContent>

      <!-- Base URI Footer -->
      <div
        v-if="artifacts?.artifact_uri"
        class="border-t px-3 py-2 flex-shrink-0"
      >
        <div class="flex items-center justify-between mb-1">
          <p class="text-[10px] text-muted-foreground">Path</p>
          <Button
            variant="ghost"
            size="sm"
            class="h-5 w-5 p-0"
            @click="copyPath"
          >
            <Icon
              :name="pathCopied ? 'lucide:check' : 'lucide:copy'"
              class="w-3 h-3"
              :class="pathCopied ? 'text-green-500' : 'text-muted-foreground'"
            />
          </Button>
        </div>
        <code
          class="text-[10px] text-muted-foreground break-all line-clamp-2"
          :title="artifacts.artifact_uri"
        >
          {{ artifacts.artifact_uri }}
        </code>
      </div>
    </Card>

    <!-- Right Panel: Preview -->
    <Card class="flex-1 min-w-0 flex flex-col transition-all duration-200 overflow-hidden">
      <CardHeader class="py-3 px-4 flex-shrink-0 border-b">
        <div class="flex items-center justify-between">
          <CardTitle class="flex items-center gap-2 text-sm">
            <div class="p-1 rounded bg-blue-100 dark:bg-blue-900/50">
              <Icon
                :name="
                  selectedFile ? getFileIcon(selectedFile.name) : 'lucide:eye'
                "
                class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400"
              />
            </div>
            {{ selectedFile ? selectedFile.name : 'Preview' }}
          </CardTitle>
          <div v-if="selectedFile" class="flex items-center gap-2">
            <Button
              size="sm"
              variant="default"
              class="h-7 text-xs"
              @click="downloadFile"
            >
              <Icon name="lucide:download" class="w-3 h-3 mr-1" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent class="flex-1 overflow-hidden p-0">
        <!-- No file selected -->
        <div
          v-if="!selectedFile"
          class="h-full flex items-center justify-center text-muted-foreground"
        >
          <div class="text-center">
            <Icon
              name="lucide:file-search"
              class="w-16 h-16 mx-auto mb-3 opacity-30"
            />
            <p class="text-sm">Select a file to preview</p>
            <p class="text-xs mt-1 opacity-70">Click on any file in the tree</p>
          </div>
        </div>

        <!-- Loading state -->
        <div
          v-else-if="isLoading"
          class="h-full flex items-center justify-center"
        >
          <div class="text-center">
            <Icon
              name="lucide:loader-2"
              class="w-8 h-8 mx-auto mb-2 animate-spin text-primary"
            />
            <p class="text-sm text-muted-foreground">Loading preview...</p>
          </div>
        </div>

        <!-- Not previewable -->
        <div
          v-else-if="!isPreviewable(selectedFile.name)"
          class="h-full flex items-center justify-center text-muted-foreground"
        >
          <div class="text-center">
            <Icon
              :name="getFileIcon(selectedFile.name)"
              class="w-16 h-16 mx-auto mb-3 opacity-30"
            />
            <p class="text-sm font-medium">{{ selectedFile.name }}</p>
            <p class="text-xs mt-1 opacity-70">
              Preview not available for this file type
            </p>
            <Button
              size="sm"
              variant="outline"
              class="mt-4"
              @click="downloadFile"
            >
              <Icon name="lucide:download" class="w-3 h-3 mr-1" />
              Download File
            </Button>
          </div>
        </div>

        <!-- CSV Preview -->
        <div
          v-else-if="getFileExtension(selectedFile.name) === 'csv'"
          class="h-full overflow-auto p-4"
        >
          <div
            v-if="previewData?.rows"
            class="rounded-md border overflow-hidden"
          >
            <table class="w-full text-xs">
              <thead class="bg-muted/50">
                <tr>
                  <th
                    v-for="(header, idx) in previewData.headers"
                    :key="idx"
                    class="px-3 py-2 text-left font-medium text-muted-foreground border-b"
                  >
                    {{ header }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, rowIdx) in previewData.rows"
                  :key="rowIdx"
                  class="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td
                    v-for="(cell, cellIdx) in row"
                    :key="cellIdx"
                    class="px-3 py-2 text-foreground"
                  >
                    {{ cell }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Image Preview -->
        <div
          v-else-if="isImageFile(selectedFile.name)"
          class="h-full flex items-center justify-center p-4 bg-muted/20"
        >
          <img
            v-if="previewData?.url"
            :src="previewData.url"
            :alt="selectedFile.name"
            class="max-w-full max-h-full object-contain rounded-md shadow-lg"
          />
        </div>

        <!-- Code/Text Preview (JSON, YAML, TXT) -->
        <div v-else class="h-full overflow-auto p-4">
          <div
            class="rounded-lg border bg-zinc-950 dark:bg-zinc-900 h-full overflow-auto"
          >
            <pre
              class="p-4 text-xs font-mono text-zinc-100 whitespace-pre"
              >{{ previewData?.content }}</pre
            >
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script lang="ts" setup>
import { TreeRoot, TreeItem } from 'reka-ui';
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card';
import type { ModelArtifactFile, ModelArtifacts } from '~/types/model.types';

interface FileItem {
  id: string;
  name: string;
  path: string;
  isFolder: boolean;
  children?: FileItem[];
}

interface PreviewData {
  content?: string;
  url?: string;
  headers?: string[];
  rows?: string[][];
}

const props = defineProps<{
  artifacts: ModelArtifacts | null;
  loading?: boolean;
}>();

const { getArtifactPreview } = useApi();

const expandedFolders = ref<string[]>([]);
const selectedFile = ref<FileItem | null>(null);
const previewData = ref<PreviewData | null>(null);
const isLoading = ref(false);
const pathCopied = ref(false);

// Helper to collect all folder IDs recursively
const collectAllFolderIds = (items: FileItem[]): string[] => {
  const ids: string[] = [];
  const traverse = (nodes: FileItem[]) => {
    for (const node of nodes) {
      if (node.isFolder) {
        ids.push(node.id);
        if (node.children) {
          traverse(node.children);
        }
      }
    }
  };
  traverse(items);
  return ids;
};

// Sort function: folders first, then files, alphabetically
const sortItems = (items: FileItem[]): FileItem[] => {
  return items
    .sort((a, b) => {
      // Folders come first
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      // Then sort alphabetically
      return a.name.localeCompare(b.name);
    })
    .map((item) => {
      // Recursively sort children
      if (item.children && item.children.length > 0) {
        return { ...item, children: sortItems(item.children) };
      }
      return item;
    });
};

// Build tree structure from flat file list
const fileTree = computed<FileItem[]>(() => {
  const files = props.artifacts?.model_files || [];
  if (!files.length) return [];

  const result: FileItem[] = [];

  files.forEach((file: ModelArtifactFile) => {
    const pathParts = file.artifact_path.split('/');
    let currentLevel = result;
    let currentPath = '';

    pathParts.forEach((part: string, index: number) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = index === pathParts.length - 1;

      let existing = currentLevel.find((item) => item.name === part);

      if (!existing) {
        const newItem: FileItem = {
          id: currentPath,
          name: part,
          path: file.artifact_path,
          isFolder: !isFile,
          children: isFile ? undefined : [],
        };
        currentLevel.push(newItem);
        existing = newItem;
      }

      if (!isFile && existing.children) {
        currentLevel = existing.children;
      }
    });
  });

  // Sort: folders first, then files
  return sortItems(result);
});

// Get file extension
const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
};

// Get icon based on file extension
const getFileIcon = (filename: string): string => {
  const ext = getFileExtension(filename);
  switch (ext) {
    case 'json':
      return 'lucide:file-json';
    case 'csv':
      return 'lucide:file-spreadsheet';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
      return 'lucide:image';
    case 'yaml':
    case 'yml':
      return 'lucide:file-cog';
    case 'txt':
      return 'lucide:file-text';
    case 'pkl':
    case 'pth':
      return 'lucide:box';
    case 'py':
      return 'lucide:file-code';
    default:
      return 'lucide:file';
  }
};

// Get icon color based on file extension
const getFileIconColor = (filename: string): string => {
  const ext = getFileExtension(filename);
  switch (ext) {
    case 'json':
      return 'text-yellow-500';
    case 'csv':
      return 'text-green-500';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
      return 'text-purple-500';
    case 'yaml':
    case 'yml':
      return 'text-blue-500';
    case 'txt':
      return 'text-gray-500';
    case 'pkl':
    case 'pth':
      return 'text-orange-500';
    case 'py':
      return 'text-sky-500';
    default:
      return 'text-muted-foreground';
  }
};

// Get badge class based on file extension
const getFileBadgeClass = (filename: string): string => {
  const ext = getFileExtension(filename);
  switch (ext) {
    case 'json':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
    case 'csv':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800';
    case 'yaml':
    case 'yml':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    case 'txt':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-700';
    case 'pkl':
    case 'pth':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800';
    case 'py':
      return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border-sky-200 dark:border-sky-800';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

// Check if file is previewable
const isPreviewable = (filename: string): boolean => {
  const ext = getFileExtension(filename);
  return [
    'csv',
    'json',
    'yaml',
    'yml',
    'txt',
    'png',
    'jpg',
    'jpeg',
    'gif',
  ].includes(ext);
};

// Check if file is an image
const isImageFile = (filename: string): boolean => {
  const ext = getFileExtension(filename);
  return ['png', 'jpg', 'jpeg', 'gif'].includes(ext);
};

// Select a file for preview
const selectFile = async (file: FileItem) => {
  if (file.isFolder) return;
  selectedFile.value = file;
  previewData.value = null;

  if (isPreviewable(file.name)) {
    await loadPreview();
  }
};

// Load file preview
const loadPreview = async () => {
  if (!selectedFile.value || !props.artifacts?.artifact_uri) return;

  isLoading.value = true;
  previewData.value = null;

  try {
    // Construct full artifact URL: artifact_uri + artifact_path
    const artifactUrl = `${props.artifacts.artifact_uri}/${selectedFile.value.path}`;
    const res = await getArtifactPreview(artifactUrl);

    if (res && 'data' in res && res.data) {
      const { type, content, headers, rows, url } = res.data as {
        type?: 'csv' | 'image' | string;
        content?: string;
        headers?: string[];
        rows?: string[][];
        url?: string;
      };

      if (type === 'csv') {
        previewData.value = { headers, rows };
      } else if (type === 'image') {
        previewData.value = { url };
      } else {
        previewData.value = { content };
      }
    }
  } catch (error) {
    console.error('Failed to load preview:', error);
  } finally {
    isLoading.value = false;
  }
};

// Download file
const downloadFile = async () => {
  if (!selectedFile.value || !props.artifacts?.artifact_uri) return;

  const config = useRuntimeConfig();
  const artifactUrl = `${props.artifacts.artifact_uri}/${selectedFile.value.path}`;
  const downloadUrl = `${config.public.apiBase}/models/artifact/download?url=${encodeURIComponent(artifactUrl)}`;

  try {
    const response = await fetch(downloadUrl);
    if (!response.ok) throw new Error('Download failed');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile.value.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download file:', error);
  }
};

// Copy artifact path to clipboard
const copyPath = async () => {
  if (!props.artifacts?.artifact_uri) return;

  try {
    await navigator.clipboard.writeText(props.artifacts.artifact_uri);
    pathCopied.value = true;
    setTimeout(() => {
      pathCopied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

// Auto-expand all folders when tree is first loaded
watch(
  fileTree,
  (newTree) => {
    if (newTree.length > 0 && expandedFolders.value.length === 0) {
      expandedFolders.value = collectAllFolderIds(newTree);
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
