import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import {
  useFilteredSortedPagination,
  filterSortPaginate,
} from '~/composables/useFilteredSortedPagination';

interface Item {
  isvc_name: string;
  model_name: string;
  status: string;
  creation_timestamp: string;
}

const sample: Item[] = [
  {
    isvc_name: 'apple-svc',
    model_name: 'fruit-classifier',
    status: 'ready',
    creation_timestamp: '2026-05-01T00:00:00Z',
  },
  {
    isvc_name: 'banana-svc',
    model_name: 'fruit-bert',
    status: 'pending',
    creation_timestamp: '2026-04-01T00:00:00Z',
  },
  {
    isvc_name: 'cherry-svc',
    model_name: 'lstm-model',
    status: 'failed',
    creation_timestamp: '2026-03-01T00:00:00Z',
  },
  {
    isvc_name: 'date-svc',
    model_name: 'tabular-rf',
    status: 'ready',
    creation_timestamp: '2026-02-01T00:00:00Z',
  },
  {
    isvc_name: 'elderberry-svc',
    model_name: 'tabular-rf',
    status: 'ready',
    creation_timestamp: '2026-01-01T00:00:00Z',
  },
  {
    isvc_name: 'fig-svc',
    model_name: 'tabular-rf',
    status: 'pending',
    creation_timestamp: '2025-12-01T00:00:00Z',
  },
  {
    isvc_name: 'grape-svc',
    model_name: 'tabular-rf',
    status: 'ready',
    creation_timestamp: '2025-11-01T00:00:00Z',
  },
  {
    isvc_name: 'honeydew-svc',
    model_name: 'tabular-rf',
    status: 'ready',
    creation_timestamp: '2025-10-01T00:00:00Z',
  },
  {
    isvc_name: 'kiwi-svc',
    model_name: 'tabular-rf',
    status: 'ready',
    creation_timestamp: '2025-09-01T00:00:00Z',
  },
  {
    isvc_name: 'lemon-svc',
    model_name: 'tabular-rf',
    status: 'ready',
    creation_timestamp: '2025-08-01T00:00:00Z',
  },
];

const setup = (
  overrides: Partial<{
    items: Item[];
    search: string;
    order: 'asc' | 'desc';
    page: number;
    pageSize: number;
    statusFilter: string;
  }> = {},
) => {
  const items = ref<Item[]>(overrides.items ?? sample);
  const search = ref(overrides.search ?? '');
  const order = ref<'asc' | 'desc'>(overrides.order ?? 'desc');
  const page = ref(overrides.page ?? 1);
  const pageSize = ref(overrides.pageSize ?? 8);
  const statusFilter = ref(overrides.statusFilter ?? 'all');
  const result = useFilteredSortedPagination(
    items,
    search,
    order,
    page,
    pageSize,
    {
      searchFields: ['isvc_name', 'model_name', 'status'],
      sortField: 'creation_timestamp',
      exactFilters: [{ field: 'status', value: statusFilter, allValue: 'all' }],
    },
  );
  return { items, search, order, page, pageSize, statusFilter, ...result };
};

const names = (rows: Item[]) => rows.map((r) => r.isvc_name);

describe('useFilteredSortedPagination', () => {
  describe('search', () => {
    it('returns the full list when the query is empty or whitespace', () => {
      const { totalItems, search } = setup();
      expect(totalItems.value).toBe(10);
      search.value = '   ';
      expect(totalItems.value).toBe(10);
    });

    it('matches against each named search field (case-insensitive)', () => {
      const { filteredAndSorted, search } = setup();

      // by isvc_name
      search.value = 'apple';
      expect(names(filteredAndSorted.value)).toEqual(['apple-svc']);

      // by model_name
      search.value = 'fruit';
      expect(names(filteredAndSorted.value)).toEqual([
        'apple-svc',
        'banana-svc',
      ]);

      // by status
      search.value = 'failed';
      expect(names(filteredAndSorted.value)).toEqual(['cherry-svc']);

      // case-insensitive
      search.value = 'APPLE';
      expect(names(filteredAndSorted.value)).toEqual(['apple-svc']);
    });

    it('returns an empty list when nothing matches', () => {
      const { filteredAndSorted, search } = setup();
      search.value = 'no-such-name';
      expect(filteredAndSorted.value).toEqual([]);
    });
  });

  describe('sort', () => {
    it('sorts by creation_timestamp desc by default (newest first)', () => {
      const { filteredAndSorted } = setup();
      expect(names(filteredAndSorted.value)).toEqual([
        'apple-svc',
        'banana-svc',
        'cherry-svc',
        'date-svc',
        'elderberry-svc',
        'fig-svc',
        'grape-svc',
        'honeydew-svc',
        'kiwi-svc',
        'lemon-svc',
      ]);
    });

    it('reverses to oldest-first when order flips to asc', () => {
      const { filteredAndSorted, order } = setup();
      order.value = 'asc';
      expect(names(filteredAndSorted.value)).toEqual([
        'lemon-svc',
        'kiwi-svc',
        'honeydew-svc',
        'grape-svc',
        'fig-svc',
        'elderberry-svc',
        'date-svc',
        'cherry-svc',
        'banana-svc',
        'apple-svc',
      ]);
    });
  });

  describe('pagination', () => {
    it('paginates the filtered list with pageSize=8', () => {
      const { paginated, page } = setup();
      expect(names(paginated.value)).toEqual([
        'apple-svc',
        'banana-svc',
        'cherry-svc',
        'date-svc',
        'elderberry-svc',
        'fig-svc',
        'grape-svc',
        'honeydew-svc',
      ]);
      page.value = 2;
      expect(names(paginated.value)).toEqual(['kiwi-svc', 'lemon-svc']);
    });

    it('totalItems reflects the FILTERED list length, not the raw list', () => {
      const { totalItems, search } = setup();
      expect(totalItems.value).toBe(10);
      search.value = 'fruit';
      expect(totalItems.value).toBe(2);
    });

    it('respects pageSize changes', () => {
      const { paginated, pageSize } = setup({ pageSize: 3 });
      expect(paginated.value).toHaveLength(3);
      pageSize.value = 5;
      expect(paginated.value).toHaveLength(5);
    });

    it('returns an empty slice when current page is past the end', () => {
      const { paginated, page } = setup();
      page.value = 99;
      expect(paginated.value).toEqual([]);
    });
  });

  describe('reactivity', () => {
    it('updates downstream when the source items list changes', () => {
      const { filteredAndSorted, totalItems, items } = setup({ items: [] });
      expect(totalItems.value).toBe(0);

      items.value = [sample[0]];
      expect(totalItems.value).toBe(1);
      expect(names(filteredAndSorted.value)).toEqual(['apple-svc']);
    });
  });

  describe('exact-match filters (e.g. status dropdown)', () => {
    // Mix of statuses so we can exercise filter selection. Includes the
    // `not_ready` value the model-serving page added.
    const mixed: Item[] = [
      {
        isvc_name: 'a',
        model_name: 'm',
        status: 'ready',
        creation_timestamp: '2026-05-01T00:00:00Z',
      },
      {
        isvc_name: 'b',
        model_name: 'm',
        status: 'not_ready',
        creation_timestamp: '2026-04-01T00:00:00Z',
      },
      {
        isvc_name: 'c',
        model_name: 'm',
        status: 'pending',
        creation_timestamp: '2026-03-01T00:00:00Z',
      },
      {
        isvc_name: 'd',
        model_name: 'm',
        status: 'NOT_READY', // ensure case-insensitive match
        creation_timestamp: '2026-02-01T00:00:00Z',
      },
      {
        isvc_name: 'e',
        model_name: 'm',
        status: 'failed',
        creation_timestamp: '2026-01-01T00:00:00Z',
      },
    ];

    it('does not filter when the value equals the configured allValue', () => {
      const { totalItems, statusFilter } = setup({
        items: mixed,
        statusFilter: 'all',
      });
      expect(totalItems.value).toBe(5);

      // Empty string is also treated as "no filter".
      statusFilter.value = '';
      expect(totalItems.value).toBe(5);
    });

    it('filters down to exact-match rows for a specific status', () => {
      const { filteredAndSorted, statusFilter } = setup({ items: mixed });

      statusFilter.value = 'ready';
      expect(names(filteredAndSorted.value)).toEqual(['a']);

      statusFilter.value = 'pending';
      expect(names(filteredAndSorted.value)).toEqual(['c']);

      statusFilter.value = 'failed';
      expect(names(filteredAndSorted.value)).toEqual(['e']);
    });

    it('handles the not_ready status (the value the page added) case-insensitively', () => {
      const { filteredAndSorted, statusFilter } = setup({ items: mixed });

      statusFilter.value = 'not_ready';
      // Both lowercase and uppercase rows match.
      expect(names(filteredAndSorted.value).sort()).toEqual(['b', 'd']);
    });

    it('does not match on partial overlap (exact match only — "ready" must not catch "not_ready")', () => {
      const { filteredAndSorted, statusFilter } = setup({ items: mixed });

      statusFilter.value = 'ready';
      const namesOut = names(filteredAndSorted.value);
      expect(namesOut).toContain('a');
      expect(namesOut).not.toContain('b');
      expect(namesOut).not.toContain('d');
    });

    it('reactively re-computes when the filter ref changes', () => {
      const { totalItems, statusFilter } = setup({ items: mixed });
      expect(totalItems.value).toBe(5);

      statusFilter.value = 'ready';
      expect(totalItems.value).toBe(1);

      statusFilter.value = 'all';
      expect(totalItems.value).toBe(5);
    });

    it('combines with search — status narrows first, search narrows further', () => {
      const items: Item[] = [
        {
          isvc_name: 'apple-svc',
          model_name: 'm',
          status: 'ready',
          creation_timestamp: '2026-05-01T00:00:00Z',
        },
        {
          isvc_name: 'apple-pie',
          model_name: 'm',
          status: 'failed',
          creation_timestamp: '2026-04-01T00:00:00Z',
        },
        {
          isvc_name: 'banana-svc',
          model_name: 'm',
          status: 'ready',
          creation_timestamp: '2026-03-01T00:00:00Z',
        },
      ];
      const { filteredAndSorted, search, statusFilter } = setup({ items });

      search.value = 'apple';
      statusFilter.value = 'ready';
      expect(names(filteredAndSorted.value)).toEqual(['apple-svc']);
    });
  });
});

// `filterSortPaginate` is the pure (non-reactive) sibling that backs both the
// composable above AND AppTable's `dataSource` callback on the model-serving
// page (table view). Tests below exercise the pagination + total contract
// directly, since AppTable's contract is "give me {data, pagination}".
describe('filterSortPaginate (pure pipeline, used by AppTable dataSource)', () => {
  const baseOpts = {
    searchFields: ['isvc_name', 'model_name', 'status'] as Array<keyof Item>,
    sortField: 'creation_timestamp' as keyof Item,
  };

  it('returns the requested page slice and the total of FILTERED items', () => {
    const { data, total } = filterSortPaginate<Item>(sample, {
      ...baseOpts,
      sortOrder: 'desc',
      page: 1,
      pageSize: 3,
    });
    expect(total).toBe(10);
    expect(data.map((d) => d.isvc_name)).toEqual([
      'apple-svc',
      'banana-svc',
      'cherry-svc',
    ]);
  });

  it('paginates correctly past the first page', () => {
    const { data, total } = filterSortPaginate<Item>(sample, {
      ...baseOpts,
      sortOrder: 'desc',
      page: 2,
      pageSize: 4,
    });
    expect(total).toBe(10);
    expect(data.map((d) => d.isvc_name)).toEqual([
      'elderberry-svc',
      'fig-svc',
      'grape-svc',
      'honeydew-svc',
    ]);
  });

  it('returns empty data with the correct total when page is past the end', () => {
    const { data, total } = filterSortPaginate<Item>(sample, {
      ...baseOpts,
      sortOrder: 'desc',
      page: 99,
      pageSize: 8,
    });
    expect(data).toEqual([]);
    expect(total).toBe(10);
  });

  it('search reduces the total to the matched count (not the raw input length)', () => {
    const { data, total } = filterSortPaginate<Item>(sample, {
      ...baseOpts,
      sortOrder: 'desc',
      page: 1,
      pageSize: 8,
      search: 'fruit',
    });
    expect(total).toBe(2);
    expect(data.map((d) => d.isvc_name)).toEqual(['apple-svc', 'banana-svc']);
  });

  it('exact filter narrows by status — including the not_ready value', () => {
    const items: Item[] = [
      {
        isvc_name: 'a',
        model_name: 'm',
        status: 'ready',
        creation_timestamp: '2026-05-01T00:00:00Z',
      },
      {
        isvc_name: 'b',
        model_name: 'm',
        status: 'not_ready',
        creation_timestamp: '2026-04-01T00:00:00Z',
      },
      {
        isvc_name: 'c',
        model_name: 'm',
        status: 'failed',
        creation_timestamp: '2026-03-01T00:00:00Z',
      },
    ];

    const { data, total } = filterSortPaginate<Item>(items, {
      ...baseOpts,
      sortOrder: 'desc',
      page: 1,
      pageSize: 10,
      exactFilters: [{ field: 'status', value: 'not_ready', allValue: 'all' }],
    });
    expect(total).toBe(1);
    expect(data.map((d) => d.isvc_name)).toEqual(['b']);
  });

  it('treats `allValue` (default "all"), null and empty as "no filter"', () => {
    for (const value of ['all', '', null, undefined]) {
      const { total } = filterSortPaginate<Item>(sample, {
        ...baseOpts,
        sortOrder: 'desc',
        page: 1,
        pageSize: 8,
        exactFilters: [{ field: 'status', value, allValue: 'all' }],
      });
      expect(total).toBe(sample.length);
    }
  });

  it('asc sort returns oldest first', () => {
    const { data } = filterSortPaginate<Item>(sample, {
      ...baseOpts,
      sortOrder: 'asc',
      page: 1,
      pageSize: 3,
    });
    expect(data.map((d) => d.isvc_name)).toEqual([
      'lemon-svc',
      'kiwi-svc',
      'honeydew-svc',
    ]);
  });
});
