import { computed, type ComputedRef, type Ref } from 'vue';

interface ExactFilter<T> {
  /** Field on `T` to match against. */
  field: keyof T;
  /** Reactive value to match. Empty / null / `allValue` means "no filter". */
  value: Ref<string | null | undefined>;
  /** Sentinel meaning "show all" (skip this filter). Defaults to `'all'`. */
  allValue?: string;
}

interface Options<T> {
  /** Fields on `T` whose lowercased string value should match the search query. */
  searchFields: Array<keyof T>;
  /** Field on `T` to sort by — must be a string parseable by `new Date()` or numeric. */
  sortField: keyof T;
  /**
   * Optional exact-match (case-insensitive) pre-filters applied before search.
   * Useful for dropdown filters like a status selector.
   */
  exactFilters?: Array<ExactFilter<T>>;
}

/**
 * Pure (non-reactive) version of the same pipeline. Takes a plain array and
 * primitive options, returns the filtered+sorted+paginated slice plus the
 * total count of items after filter/search (i.e., the count pagination should
 * display, not the raw input length).
 *
 * Use this when you need the same client-side processing in a non-reactive
 * context (e.g. an `AppTable` `dataSource` callback that's called with params
 * by the table itself).
 */
export function filterSortPaginate<T>(
  items: T[],
  opts: {
    search?: string;
    searchFields: Array<keyof T>;
    sortField: keyof T;
    sortOrder: 'asc' | 'desc';
    page: number;
    pageSize: number;
    exactFilters?: Array<{
      field: keyof T;
      value: string | null | undefined;
      allValue?: string;
    }>;
  },
): { data: T[]; total: number } {
  let result = [...items];

  for (const f of opts.exactFilters ?? []) {
    const allValue = f.allValue ?? 'all';
    if (!f.value || f.value === allValue) continue;
    const target = String(f.value).toLowerCase();
    result = result.filter((item) => {
      const v = item[f.field];
      return typeof v === 'string' ? v.toLowerCase() === target : false;
    });
  }

  const q = opts.search?.trim().toLowerCase();
  if (q) {
    result = result.filter((item) =>
      opts.searchFields.some((field) => {
        const value = item[field];
        return typeof value === 'string'
          ? value.toLowerCase().includes(q)
          : false;
      }),
    );
  }

  result.sort((a, b) => {
    const av = a[opts.sortField] as unknown;
    const bv = b[opts.sortField] as unknown;
    const ad = typeof av === 'string' ? Date.parse(av) : NaN;
    const bd = typeof bv === 'string' ? Date.parse(bv) : NaN;
    if (!Number.isNaN(ad) && !Number.isNaN(bd)) {
      return opts.sortOrder === 'desc' ? bd - ad : ad - bd;
    }
    if (av == null && bv == null) return 0;
    if (av == null) return opts.sortOrder === 'desc' ? 1 : -1;
    if (bv == null) return opts.sortOrder === 'desc' ? -1 : 1;
    if (av < bv) return opts.sortOrder === 'desc' ? 1 : -1;
    if (av > bv) return opts.sortOrder === 'desc' ? -1 : 1;
    return 0;
  });

  const total = result.length;
  const start = (opts.page - 1) * opts.pageSize;
  return { data: result.slice(start, start + opts.pageSize), total };
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
  // Filter+sort step (without pagination) — a sufficiently large pageSize
  // returns everything so we can derive `totalItems` and re-slice for
  // `paginated` separately.
  const filteredAndSorted = computed(
    () =>
      filterSortPaginate(items.value, {
        search: searchQuery.value,
        searchFields: options.searchFields,
        sortField: options.sortField,
        sortOrder: sortOrder.value,
        page: 1,
        pageSize: Number.MAX_SAFE_INTEGER,
        exactFilters: (options.exactFilters ?? []).map((f) => ({
          field: f.field,
          value: f.value.value,
          allValue: f.allValue,
        })),
      }).data,
  );

  const totalItems = computed(() => filteredAndSorted.value.length);

  const paginated = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    return filteredAndSorted.value.slice(start, start + pageSize.value);
  });

  return { filteredAndSorted, paginated, totalItems };
}
