interface Page {
  section: string;
}

export const useApp = () => {
  const page = useState('page', () => {
    return {
      section: '',
    };
  });
  const setPage = (value: Page) => {
    page.value = value;
  };
  return {
    page,
    setPage,
  };
};
