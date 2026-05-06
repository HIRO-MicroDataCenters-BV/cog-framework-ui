import { computed, type ComputedRef, type Ref } from 'vue';

interface Options<T> {
  /** Fields on `T` whose lowercased string value should match the search query. */
  searchFields: Array<keyof T>;
  /** Field on `T` to sort by — must be a string parseable by `new Date()` or numeric. */
  sortField: keyof T;
}

interface Result<T> {
  /** `items` after search + sort applied. Total count for pagination. */
  filteredAndSorted: ComputedRef<T[]>;
  /** Slice of `filteredAndSorted` for the current page. */
  paginated: ComputedRef<T[]>;
  /** Length of `filteredAndSorted` — what pagination should display as the total. */
  totalItems: ComputedRef<number>;
}

/**
 * Client-side search + sort + pagination over a reactive list. Drop-in
 * replacement for the inline computed properties used on the model-serving
 * page (and any future page that needs the same trio).
 *
 * - Search matches case-insensitively against any of the named string fields.
 *   Empty / whitespace-only search returns the full list.
 * - Sort is by the named field, treated as a date if `new Date()` parses it,
 *   otherwise compared with `<`/`>`. Stable for equal values.
 * - Pagination slices using `(currentPage - 1) * pageSize`.
 */
export function useFilteredSortedPagination<T>(
  items: Ref<T[]>,
  searchQuery: Ref<string>,
  sortOrder: Ref<'asc' | 'desc'>,
  currentPage: Ref<number>,
  pageSize: Ref<number>,
  options: Options<T>,
): Result<T> {
  const filteredAndSorted = computed(() => {
    let result = [...items.value];

    const q = searchQuery.value?.trim().toLowerCase();
    if (q) {
      result = result.filter((item) =>
        options.searchFields.some((field) => {
          const value = item[field];
          return typeof value === 'string'
            ? value.toLowerCase().includes(q)
            : false;
        }),
      );
    }

    const order = sortOrder.value;
    result.sort((a, b) => {
      const av = a[options.sortField] as unknown;
      const bv = b[options.sortField] as unknown;

      // Try date parsing first; fall back to numeric/string compare.
      const ad = typeof av === 'string' ? Date.parse(av) : NaN;
      const bd = typeof bv === 'string' ? Date.parse(bv) : NaN;
      if (!Number.isNaN(ad) && !Number.isNaN(bd)) {
        return order === 'desc' ? bd - ad : ad - bd;
      }

      if (av == null && bv == null) return 0;
      if (av == null) return order === 'desc' ? 1 : -1;
      if (bv == null) return order === 'desc' ? -1 : 1;
      if (av < bv) return order === 'desc' ? 1 : -1;
      if (av > bv) return order === 'desc' ? -1 : 1;
      return 0;
    });

    return result;
  });

  const totalItems = computed(() => filteredAndSorted.value.length);

  const paginated = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    return filteredAndSorted.value.slice(start, start + pageSize.value);
  });

  return { filteredAndSorted, paginated, totalItems };
}
