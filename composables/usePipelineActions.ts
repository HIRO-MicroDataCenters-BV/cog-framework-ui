interface ActionItem {
  key: string;
  label: string;
  action: () => void | Promise<void>;
  hasConfirmation?: boolean;
  icon?: string;
}

export type PipelineRunsTab = 'active' | 'archived';

export interface GetPipelineActionsOptions {
  tab: PipelineRunsTab;
  onArchiveSuccess?: () => void;
  onRestoreSuccess?: () => void;
  onDeleteSuccess?: () => void;
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

  const handleRestoreRun = async (runId: string, onSuccess?: () => void) => {
    try {
      await api.unarchivePipelineRun(runId);
      toaster.show('success', 'operation_completed');
      onSuccess?.();
    } catch (err) {
      console.error('unarchivePipelineRun failed:', err);
      toaster.show('error', 'operation_failed');
    }
  };

  const handleDeleteRun = async (runId: string, onSuccess?: () => void) => {
    try {
      await api.deletePipelineRun(runId);
      toaster.show('success', 'operation_completed');
      onSuccess?.();
    } catch (err) {
      console.error('deletePipelineRun failed:', err);
      toaster.show('error', 'operation_failed');
    }
  };

  const getPipelineActions = (
    runId: string,
    runName: string,
    options: GetPipelineActionsOptions,
  ): ActionItem[] => {
    const { tab, onArchiveSuccess, onRestoreSuccess, onDeleteSuccess } =
      options;

    if (tab === 'active') {
      return [
        {
          key: 'archive_run',
          label: 'archive_run',
          icon: 'lucide:archive',
          hasConfirmation: true,
          action: () => handleArchiveRun(runId, onArchiveSuccess),
        },
      ];
    }

    return [
      {
        key: 'restore_run',
        label: 'restore_run',
        icon: 'lucide:rotate-ccw',
        hasConfirmation: true,
        action: () => handleRestoreRun(runId, onRestoreSuccess),
      },
      {
        key: 'delete_run',
        label: 'delete_run',
        icon: 'lucide:trash-2',
        hasConfirmation: true,
        action: () => handleDeleteRun(runId, onDeleteSuccess),
      },
    ];
  };

  return {
    getPipelineActions,
    handleArchiveRun,
    handleRestoreRun,
    handleDeleteRun,
  };
};
