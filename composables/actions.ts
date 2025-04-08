/**
 * Function to use actions
 * @param type
 * @returns
 */
export const useActions = (type: string) => {
  // const api = useApi()
  return {
    /**
     *
     * @param id
     * @returns
     */
    view: async (id: number) => {
      console.log('view', id, type);
      return true;
      // await api.viewDataset
    },
    /**
     *
     * @param data
     * @returns
     */
    create: async (data: unknown) => {
      console.log('create', data, type);
      return true;
      // await api.createDataset
    },
    /**
     *
     * @param id
     * @returns
     */
    edit: async (id: number) => {
      console.log('edit', id, type);
      return true;
      // await api.editDataset(id)
    },
    /**
     *
     * @param id
     * @returns
     */
    delete: async (id: number) => {
      console.log('delete', id, type);
      return true;
      // await api.deleteDataset(id)
    },
  };
};
