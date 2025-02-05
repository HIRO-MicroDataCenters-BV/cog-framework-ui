export const useListActions = (type: string, id: number) => {
  const { t } = useI18n()
  const actions = useActions(type)
  return useState('listActions', () => {
    return {
      default: [
        {
          key: 'edit',
          title: t('action.edit'),
          action: () => actions.edit(id),
        },
        {
          key: 'delete',
          title: t('action.delete'),
          action: () => actions.delete(id),
        },
      ],
    }
  })
}
