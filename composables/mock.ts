export const useMock = () => {
  const { t } = useI18n();

  return useState('mock', () => {
    return {
      stat: {
        total: {
          key: 'total',
          value: 236,
          icon: 'lucide:table-2',
          label: t('stat.total'),
          color: 'primary',
        },
        files: {
          key: 'files',
          value: 221,
          icon: 'lucide:table',
          label: t('stat.files'),
          color: 'text-blue-500',
        },
        tables: {
          key: 'tables',
          value: 13,
          icon: 'lucide:database',
          label: t('stat.tables'),
          color: 'text-violet-500',
        },
        streams: {
          key: 'streams',
          value: 2,
          icon: 'lucide:circle-dot',
          label: t('stat.streams'),
          color: 'text-green-500',
        },
      },
      data: [
        {
          id: 1,
          name: 'Alice',
          description: 'Alice is a software engineer',
          status: 'active',
          type: 'stream',
          last_update: '2021-09-01',
        },
        {
          id: 2,
          name: 'Bob',
          description: 'Bob is a data scientist',
          status: 'inactive',
          type: 'file',
          last_update: '2021-09-02',
        },
        {
          id: 3,
          name: 'Charlie',
          description: 'Charlie is a machine learning engineer',
          status: 'active',
          type: 'database',
          last_update: '2021-09-03',
        },
        {
          id: 4,
          name: 'David',
          description: 'David is a data engineer',
          status: 'inactive',
          type: 'stream',
          last_update: '2021-09-04',
        },
        {
          id: 5,
          name: 'Eve',
          description: 'Eve is a data analyst',
          status: 'active',
          type: 'file',
          last_update: '2021-09-05',
        },
      ],
    };
  });
};
