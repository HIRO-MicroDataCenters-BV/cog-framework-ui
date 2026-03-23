interface ActionItem {
  key: string;
  label: string;
  action: () => void | Promise<void>;
  hasConfirmation?: boolean;
  icon?: string;
}

export const usePipelineActions = () => {
  const api = useApi();
  const toaster = useToaster();

  const handleArchiveRun = async (runId: string, onSuccess?: () => void) => {
    try {
      await api.archivePipelineRun(runId);
      toaster.show('success', 'operation_completed');
      onSuccess?.();
    } catch (err) {
      console.error('archivePipelineRun failed:', err);
      toaster.show('error', 'operation_failed');
    }
  };

  const getPipelineActions = (
    runId: string,
    runName: string,
    onSuccess?: () => void,
    options?: { showArchive?: boolean },
  ): ActionItem[] => {
    if (options?.showArchive === false) {
      return [];
    }

    return [
      {
        key: 'archive_run',
        label: 'archive_run',
        icon: 'lucide:archive',
        hasConfirmation: true,
        action: () => handleArchiveRun(runId, onSuccess),
      },
    ];
  };

  return {
    getPipelineActions,
    handleArchiveRun,
  };
};
