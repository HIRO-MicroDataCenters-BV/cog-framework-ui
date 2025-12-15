/**
 * Dataset Actions Composable
 * 
 * Handles all dataset type-specific actions (delete, preview, download)
 * based on data_source_type according to DATA_TYPE_MAPPING
 */

interface ActionItem {
    key: string;
    label: string;
    action: () => void | Promise<void>;
    hasConfirmation?: boolean;
}

interface PreviewState {
    open: boolean;
    title: string;
    data: any;
    type: 'file' | 'table' | 'prometheus';
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

    const showPreview = (title: string, data: any, type: PreviewState['type']) => {
        previewState.value = {
            open: true,
            title,
            data,
            type,
        };
    };

    const closePreview = () => {
        previewState.value.open = false;
    };

    /**
     * Handle file download with S3 URL support
     */
    const handleFileDownload = async (datasetId: string) => {
        console.log('DOWNLOAD FILE: dataset UUID:', datasetId);
        const response = await api.downloadDatasetFile(datasetId);

        if (response && typeof response === 'object') {
            // If response contains a URL (pre-signed S3 URL)
            if ('url' in response || 'download_url' in response) {
                const downloadUrl = (response as any).url || (response as any).download_url;
                window.open(downloadUrl, '_blank');
            } else {
                // If response is the file itself, trigger download
                const blob = new Blob([JSON.stringify(response)]);
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `dataset_${datasetId}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        }
    };

    /**
     * Handle file preview with S3 URL support
     */
    const handleFilePreview = async (datasetId: string) => {
        console.log('PREVIEW FILE: dataset UUID:', datasetId);
        const response = await api.previewDatasetFile(datasetId);

        if (response && typeof response === 'object') {
            // If response contains a URL (pre-signed S3 URL)
            if ('url' in response || 'preview_url' in response) {
                const previewUrl = (response as any).url || (response as any).preview_url;
                window.open(previewUrl, '_blank');
            } else {
                // Show preview data in dialog
                showPreview('File Preview', response, 'file');
            }
        }
    };

    /**
     * Handle file deletion
     */
    const handleFileDelete = async (datasetId: string, onSuccess?: () => void) => {
        await api.deleteDatasetFile(datasetId);
        onSuccess?.();
    };

    /**
     * Handle stream dataset deletion (topic + broker)
     */
    const handleStreamDelete = async (datasetId: string, onSuccess?: () => void) => {
        console.log('DELETE MESSAGE: Fetching dataset details for UUID:', datasetId);
        const detailsResponse = await api.getDatasetById(datasetId);

        console.log('Dataset details response:', detailsResponse);

        if (detailsResponse && 'data' in detailsResponse) {
            const details = (detailsResponse as any).data;

            if (details.topic_details?.id) {
                console.log('Deleting topic with ID:', details.topic_details.id);
                await api.deleteDatasetTopic(details.topic_details.id);
            }

            if (details.broker_details?.id) {
                console.log('Deleting broker with ID:', details.broker_details.id);
                await api.deleteDatasetBroker(details.broker_details.id);
            }

            onSuccess?.();
        }
    };

    /**
     * Handle table dataset preview
     */
    const handleTablePreview = async (datasetId: string) => {
        console.log('PREVIEW TABLE: dataset UUID:', datasetId);
        const response = await api.getDatasetTableRecords(datasetId, 100);

        if (response && 'data' in response) {
            showPreview('Table Preview', (response as any).data, 'table');
        }
    };

    /**
     * Handle Prometheus dataset preview
     */
    const handlePrometheusPreview = async (datasetId: string) => {
        console.log('PREVIEW PROMETHEUS: dataset UUID:', datasetId);
        const response = await api.getDatasetPrometheus(datasetId);

        if (response && 'data' in response) {
            showPreview('Prometheus Metrics', (response as any).data, 'prometheus');
        }
    };

    /**
     * Get actions for a specific dataset based on its type
     */
    const getDatasetActions = (
        datasetId: string,
        datasetName: string,
        dataSourceType: number,
        onSuccess?: () => void
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
            items.push({
                key: 'preview_table',
                label: 'preview_table',
                action: () => handleTablePreview(datasetId),
            });
        }
        // Time Series/Prometheus datasets
        else if (dataSourceType === 20) {
            items.push({
                key: 'preview_prometheus',
                label: 'preview_prometheus',
                action: () => handlePrometheusPreview(datasetId),
            });
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
                }
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
        handlePrometheusPreview,
        previewState,
        closePreview,
    };
};
