import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import { useFilteredSortedPagination } from '~/composables/useFilteredSortedPagination';

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
  }> = {},
) => {
  const items = ref<Item[]>(overrides.items ?? sample);
  const search = ref(overrides.search ?? '');
  const order = ref<'asc' | 'desc'>(overrides.order ?? 'desc');
  const page = ref(overrides.page ?? 1);
  const pageSize = ref(overrides.pageSize ?? 8);
  const result = useFilteredSortedPagination(
    items,
    search,
    order,
    page,
    pageSize,
    {
      searchFields: ['isvc_name', 'model_name', 'status'],
      sortField: 'creation_timestamp',
    },
  );
  return { items, search, order, page, pageSize, ...result };
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
});
