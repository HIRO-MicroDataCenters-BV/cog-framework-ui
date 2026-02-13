/**
 * Dataset Actions Composable
 *
 * Handles all dataset type-specific actions (delete, preview, download)
 * based on data_source_type according to DATA_TYPE_MAPPING
 */

// Preview configuration
const PREVIEW_CONFIG = {
  MAX_LINES: 100,
  INCREMENT: 10,
} as const;

interface ActionItem {
  key: string;
  label: string;
  action: () => void | Promise<void>;
  hasConfirmation?: boolean;
}

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

interface PreviewState {
  open: boolean;
  title: string;
  data: unknown | FilePreviewData;
  type: 'file' | 'table' | 'prometheus';
  datasetId?: string;
  loading?: boolean;
  maxLimitReached?: boolean;
}

export const useDatasetActions = () => {
  const api = useApi();

  // Preview dialog state
  const previewState = useState<PreviewState>('dataset-preview', () => ({
    open: false,
    title: '',
    data: null,
    type: 'file',
  }));

  const showPreview = (
    title: string,
    data: unknown,
    type: PreviewState['type'],
    datasetId?: string,
    maxLimitReached?: boolean,
  ) => {
    previewState.value = {
      open: true,
      title,
      data,
      type,
      datasetId,
      loading: false,
      maxLimitReached,
    };
  };

  const closePreview = () => {
    previewState.value.open = false;
  };

  /**
   * Load more preview data for file datasets
   */
  const loadMorePreview = async () => {
    const currentData = previewState.value.data as FilePreviewData | null;
    const datasetId = previewState.value.datasetId;

    if (!currentData || !datasetId) return;

    // Calculate new limit (current + INCREMENT more rows, max MAX_LINES)
    const currentLines = currentData.preview_lines;
    const totalLines = currentData.total_lines;
    const newLimit = Math.min(
      currentLines + PREVIEW_CONFIG.INCREMENT,
      totalLines,
      PREVIEW_CONFIG.MAX_LINES,
    );

    // Set loading state
    previewState.value.loading = true;

    try {
      const response = await api.previewDatasetFile(datasetId, newLimit);

      if (response && 'data' in response && response.data) {
        const fileData = response.data as FilePreviewData;
        previewState.value.data = fileData;
        // Show warning if max limit reached and there's more data
        previewState.value.maxLimitReached =
          fileData.preview_lines >= PREVIEW_CONFIG.MAX_LINES && fileData.total_lines > PREVIEW_CONFIG.MAX_LINES;
      }
    } finally {
      previewState.value.loading = false;
    }
  };

  /**
   * Handle file download - fetches file and triggers download
   */
  const handleFileDownload = async (datasetId: string) => {
    const config = useRuntimeConfig();
    const downloadUrl = `${config.public.apiBase}/datasets/${datasetId}/file/download`;

    try {
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error('Download failed');
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `dataset_${datasetId}.zip`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename=["']?([^"';\n]+)["']?/);
        if (match) {
          filename = match[1];
        }
      }

      // Convert response to blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  /**
   * Handle file preview with S3 URL support
   */
  const handleFilePreview = async (datasetId: string) => {
    const response = await api.previewDatasetFile(datasetId);

    if (response && typeof response === 'object') {
      // If response contains a URL (pre-signed S3 URL)
      if ('url' in response || 'preview_url' in response) {
        const previewUrl =
          (response as Record<string, unknown>).url ||
          (response as Record<string, unknown>).preview_url;
        window.open(String(previewUrl), '_blank');
      } else if ('data' in response && response.data) {
        // Show preview data in dialog with file metadata
        const fileData = response.data as FilePreviewData;
        const maxLimitReached =
          fileData.preview_lines >= PREVIEW_CONFIG.MAX_LINES && fileData.total_lines > PREVIEW_CONFIG.MAX_LINES;
        showPreview(
          fileData.dataset_name || 'File Preview',
          fileData,
          'file',
          datasetId,
          maxLimitReached,
        );
      } else {
        // Fallback for raw response
        showPreview('File Preview', response, 'file', datasetId);
      }
    }
  };

  /**
   * Handle file deletion
   */
  const handleFileDelete = async (
    datasetId: string,
    onSuccess?: () => void,
  ) => {
    await api.deleteDatasetFile(datasetId);
    onSuccess?.();
  };

  /**
   * Handle stream dataset deletion (message only)
   * Note: Topic and broker are not deleted as they can be reused by other datasets
   */
  const handleStreamDelete = async (
    datasetId: string,
    onSuccess?: () => void,
  ) => {
    await api.deleteDatasetMessage(datasetId);
    onSuccess?.();
  };

  /**
   * Handle table dataset preview
   */
  const handleTablePreview = async (datasetId: string) => {
    const response = await api.getDatasetTableRecords(datasetId, 100);

    if (response && 'data' in response) {
      const data = (response as Record<string, unknown>).data as {
        table_name: string;
        records: Array<Record<string, unknown>>;
      };
      showPreview(
        data.table_name || 'Table Preview',
        data,
        'table',
        datasetId,
      );
    }
  };

  /**
   * Handle table dataset deletion
   */
  const handleTableDelete = async (
    datasetId: string,
    onSuccess?: () => void,
  ) => {
    await api.deleteDatasetTable(datasetId);
    onSuccess?.();
  };

  /**
   * Handle Prometheus dataset preview
   */
  const handlePrometheusPreview = async (datasetId: string) => {
    const response = await api.getDatasetPrometheus(datasetId);

    if (response && 'data' in response) {
      showPreview(
        'Prometheus Metrics',
        (response as Record<string, unknown>).data,
        'prometheus',
      );
    }
  };

  /**
   * Get actions for a specific dataset based on its type
   */
  const getDatasetActions = (
    datasetId: string,
    datasetName: string,
    dataSourceType: number,
    onSuccess?: () => void,
  ): ActionItem[] => {
    const items: ActionItem[] = [];

    // Stream datasets (Kafka: 10, NATS: 11)
    if (dataSourceType === 10 || dataSourceType === 11) {
      items.push({
        key: 'delete_message',
        label: 'delete_message',
        hasConfirmation: true,
        action: () => handleStreamDelete(datasetId, onSuccess),
      });
    }
    // Database/Table datasets
    else if (dataSourceType === 1) {
      items.push(
        {
          key: 'preview_table',
          label: 'preview_table',
          action: () => handleTablePreview(datasetId),
        },
        {
          key: 'delete_table',
          label: 'delete_table',
          hasConfirmation: true,
          action: () => handleTableDelete(datasetId, onSuccess),
        },
      );
    }
    // Time Series/Prometheus datasets
    else if (dataSourceType === 20) {
      items.push(
        {
          key: 'preview_prometheus',
          label: 'preview_prometheus',
          action: () => handlePrometheusPreview(datasetId),
        },
        {
          key: 'delete_message',
          label: 'delete_message',
          hasConfirmation: true,
          action: () => handleStreamDelete(datasetId, onSuccess),
        },
      );
    }
    // File datasets
    else {
      items.push(
        {
          key: 'download_file',
          label: 'download_file',
          action: () => handleFileDownload(datasetId),
        },
        {
          key: 'preview_file',
          label: 'preview_file',
          action: () => handleFilePreview(datasetId),
        },
        {
          key: 'delete_file',
          label: 'delete_file',
          hasConfirmation: true,
          action: () => handleFileDelete(datasetId, onSuccess),
        },
      );
    }

    return items;
  };

  return {
    getDatasetActions,
    handleFileDownload,
    handleFilePreview,
    handleFileDelete,
    handleStreamDelete,
    handleTablePreview,
    handleTableDelete,
    handlePrometheusPreview,
    previewState,
    closePreview,
    loadMorePreview,
  };
};
