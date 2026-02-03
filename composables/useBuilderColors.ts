export const useBuilderColors = () => {
  const typeColors = {
    String: 'hsl(12 76% 61%)', // Warm orange
    Integer: 'hsl(173 58% 39%)', // Teal
    Float: 'hsl(197 37% 24%)', // Deep blue
    Model: 'hsl(43 74% 66%)', // Yellow
    Dataset: 'hsl(27 87% 67%)', // Coral
    Artifact: 'hsl(240 5.9% 10%)', // Primary dark
    Array: 'hsl(142 76% 36%)', // Green
    Object: 'hsl(262 83% 58%)', // Purple
    Boolean: 'hsl(330 81% 60%)', // Pink
    Any: 'hsl(240 3.8% 46.1%)', // Muted gray
  };

  const categoryColors = {
    data: 'hsl(173 58% 39%)', // Teal
    preprocessing: 'hsl(27 87% 67%)', // Coral
    training: 'hsl(12 76% 61%)', // Orange
    evaluation: 'hsl(43 74% 66%)', // Yellow
    deployment: 'hsl(197 37% 24%)', // Blue
    general: 'hsl(240 5.9% 90%)', // Border color (approx)
  };

  const statusConfig = {
    succeeded: {
      color: 'hsl(142 76% 36%)',
      icon: 'lucide:check-circle',
      class: 'text-green-600',
    },
    failed: {
      color: 'hsl(0 84% 60%)',
      icon: 'lucide:x-circle',
      class: 'text-red-600',
    },
    running: {
      color: 'hsl(240 5.9% 10%)',
      icon: 'lucide:loader-2',
      class: 'text-primary animate-spin',
    },
    pending: {
      color: 'hsl(48 96% 53%)',
      icon: 'lucide:clock',
      class: 'text-yellow-600',
    },
    idle: {
      color: 'hsl(240 3.8% 46.1%)',
      icon: 'lucide:circle',
      class: 'text-muted-foreground',
    },
  };

  /**
   * Get color for a specific type, defaulting to 'Any' if not found
   */
  const getTypeColor = (type: string): string => {
    return typeColors[type as keyof typeof typeColors] || typeColors['Any'];
  };

  const getCategoryColor = (category: string): string => {
    return (
      categoryColors[category.toLowerCase() as keyof typeof categoryColors] ||
      categoryColors['general']
    );
  };

  const getStatusConfig = (status: string) => {
    return (
      statusConfig[status.toLowerCase() as keyof typeof statusConfig] ||
      statusConfig['idle']
    );
  };

  return {
    typeColors,
    categoryColors,
    statusConfig,
    getTypeColor,
    getCategoryColor,
    getStatusConfig,
  };
};
