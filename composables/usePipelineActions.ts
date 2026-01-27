interface ActionItem {
    key: string;
    label: string;
    action: () => void | Promise<void>;
    hasConfirmation?: boolean;
}

export const usePipelineActions = () => {
    const api = useApi();

    const handlePipelineDelete = async (
        pipelineId: string,
        onSuccess?: () => void,
    ) => {
        await api.deleteTrainingBuilderPipeline(pipelineId);
        onSuccess?.();
    };

    const getPipelineActions = (
        pipelineId: string,
        pipelineName: string,
        onSuccess?: () => void,
    ): ActionItem[] => {
        const items: ActionItem[] = [
            {
                key: 'delete_pipeline',
                label: 'delete_pipeline',
                hasConfirmation: true,
                action: () => handlePipelineDelete(pipelineId, onSuccess),
            },
        ];

        return items;
    };

    return {
        getPipelineActions,
        handlePipelineDelete,
    };
};
