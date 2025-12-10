import type { Page } from '~/types/app.types';

export const useApp = () => {
  const page = useState<Page>('page', () => {
    return {
      section: '',
      title: '',
      subtitle: '',
      description: '',
      isLoading: false,
      data: {
        builder: {
          name: '',
          nodes: [],
          edges: [],
        },
      },
    };
  });
  const setPage = (value: Page) => {
    page.value = {
      section: value.section || '',
      title: value.title || '',
      subtitle: value.subtitle || '',
      description: value.description || '',
      isLoading: value.isLoading || false,
      data: {
        builder: {
          name: value.data?.builder?.name || '',
          nodes: value.data?.builder?.nodes || [],
          edges: value.data?.builder?.edges || [],
        },
        // Preserve orderId for federated pipeline from dataspace
        orderId: value.data?.orderId,
      },
    };
  };
  return {
    page,
    setPage,
  };
};
