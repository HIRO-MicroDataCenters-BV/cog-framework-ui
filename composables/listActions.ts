export const useListActions = () => {
  const { t } = useI18n()
  return useState('listActions', () => {
    return {
      dataset_management: [
        {
          key: 'edit',
          value: 'edit',
          title: t('action.edit'),
          url: '/edit/:id',
        },
        {
          key: 'delete',
          value: 'delete',
          title: t('action.delete'),
          url: '/delete/:id',
        },
      ],
    }
  })
}
