interface Page {
  section?: string;
  title?: string;
  subtitle?: string;
  description?: string;
}

export const useApp = () => {
  const page = useState('page', () => {
    return {
      section: '',
      title: '',
      subtitle: '',
      description: '',
    };
  });
  const setPage = (value: Page) => {
    page.value = {
      section: value.section || '',
      title: value.title || '',
      subtitle: value.subtitle || '',
      description: value.description || '',
    };
  };
  return {
    page,
    setPage,
  };
};
