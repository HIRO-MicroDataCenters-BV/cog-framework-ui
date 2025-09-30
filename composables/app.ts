interface Page {
  section?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  data?: { builder: { components: never[] } };
}

export const useApp = () => {
  const page = useState('page', () => {
    return {
      section: '',
      title: '',
      subtitle: '',
      description: '',
      data: {
        builder: {
          components: [],
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
      data: value.data || {
        builder: {
          components: [],
        },
      },
    };
  };
  return {
    page,
    setPage,
  };
};
