/**
 * Composable for handling builder-related events across components
 * Used for communication between Header and builder pages
 */
export const useBuilderEvents = () => {
  // Trigger for opening manage parameters sheet
  const triggerManageParameters = useState<number>(
    'builder-trigger-manage-parameters',
    () => 0,
  );

  /**
   * Trigger the manage parameters action
   * Increments a counter to trigger watchers in builder pages
   */
  const openManageParameters = () => {
    triggerManageParameters.value++;
  };

  return {
    triggerManageParameters,
    openManageParameters,
  };
};
