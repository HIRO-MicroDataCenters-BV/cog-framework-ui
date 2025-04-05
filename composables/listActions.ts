export const useListActions = (type: string) => {
  const { t } = useI18n()
  const actions = useActions(type)

  const items: { [key: string]: { key: string; title: string; action: (id: number) => Promise<boolean>; }[] } = {
    default: [
      {
        key: 'edit',
        title: t('action.edit'),
        action: (id: number) => actions.edit(id),
      },
      {
        key: 'delete',
        title: t('action.delete'),
        action: (id: number) => actions.delete(id),
      },
    ],
  }
  return useState('listActions', () => {
    return items[type] || items.default
  })
}
