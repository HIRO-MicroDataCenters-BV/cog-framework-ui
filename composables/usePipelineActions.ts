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
  const { t } = useI18n();

  /**
   * Extract error message from API error response
   */
  const getErrorMessage = (err: unknown): string => {
    if (typeof err === 'string') return err;

    const error = err as Record<string, unknown>;

    // If error.message exists, try to parse it as JSON
    if (error?.message && typeof error.message === 'string') {
      try {
        // Try to parse the message as JSON (API returns JSON string in Error.message)
        const parsed = JSON.parse(error.message);
        if (parsed?.message && typeof parsed.message === 'string') {
          return parsed.message;
        }
      } catch {
        // If parsing fails, return the message as-is
        return error.message;
      }
    }

    // Fallback to generic error message
    return t('message.error.operation_failed');
  };

  const handleArchiveRun = async (runId: string, onSuccess?: () => void) => {
    try {
      await api.archivePipelineRun(runId);
      toaster.show('success', 'operation_completed');
      onSuccess?.();
    } catch (err) {
      console.error('archivePipelineRun failed:', err);
      const { toast } = await import('vue-sonner');
      toast.error(getErrorMessage(err), { duration: 5000 });
    }
  };

  const handleRestoreRun = async (runId: string, onSuccess?: () => void) => {
    try {
      await api.unarchivePipelineRun(runId);
      toaster.show('success', 'operation_completed');
      onSuccess?.();
    } catch (err) {
      console.error('unarchivePipelineRun failed:', err);
      const { toast } = await import('vue-sonner');
      toast.error(getErrorMessage(err), { duration: 5000 });
    }
  };

  const handleDeleteRun = async (runId: string, onSuccess?: () => void) => {
    try {
      await api.deletePipelineRun(runId);
      toaster.show('success', 'operation_completed');
      onSuccess?.();
    } catch (err) {
      console.error('deletePipelineRun failed:', err);
      const { toast } = await import('vue-sonner');
      toast.error(getErrorMessage(err), { duration: 5000 });
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
