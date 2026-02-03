export const useBuilderIcons = () => {
  const typeIcons = {
    String: 'lucide:text',
    Integer: 'lucide:hash',
    Float: 'lucide:binary',
    Model: 'lucide:brain',
    Dataset: 'lucide:database',
    Artifact: 'lucide:package',
    Array: 'lucide:list',
    Object: 'lucide:braces',
    Boolean: 'lucide:toggle-left',
    Any: 'lucide:circle-help',
  };

  /**
   * Get icon name for a specific type, defaulting to 'Any' if not found
   */
  const getTypeIcon = (type: string): string => {
    return typeIcons[type as keyof typeof typeIcons] || typeIcons['Any'];
  };

  return { typeIcons, getTypeIcon };
};
