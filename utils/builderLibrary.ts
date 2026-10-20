import type { Component, Category } from '~/types/canvas.types';

/** Platform-shipped components register under this creator. */
export const PLATFORM_CREATOR = 'HIRO';

/**
 * Library order: the platform categories first, in pipeline order, then any
 * user-defined category alphabetically, uncategorised components last.
 */
export const CATEGORY_ORDER = [
  'data',
  'preprocessing',
  'training',
  'evaluation',
  'deployment',
  'fine_tune',
];

/** Page size used when loading the catalog (the API default is 10). */
export const CATALOG_PAGE_SIZE = 100;

export const isPlatformComponent = (component: Component): boolean =>
  (component.creator ?? '') === PLATFORM_CREATOR;

const categoryRank = (name: string | null): number => {
  if (!name) return Number.MAX_SAFE_INTEGER;
  const index = CATEGORY_ORDER.indexOf(name.toLowerCase());
  return index === -1 ? CATEGORY_ORDER.length : index;
};

const compareCategories = (a: Category, b: Category): number => {
  const rank = categoryRank(a.name) - categoryRank(b.name);
  if (rank !== 0) return rank;
  return (a.name ?? '').localeCompare(b.name ?? '');
};

/** Platform components first inside a category, then by name. */
const compareComponents = (a: Component, b: Component): number => {
  const platform =
    Number(isPlatformComponent(b)) - Number(isPlatformComponent(a));
  if (platform !== 0) return platform;
  return (a.name ?? '').localeCompare(b.name ?? '');
};

/**
 * Group components by their exact `category` string (the API lowercases it)
 * and order the groups for the library sidebar.
 */
export const getCategories = (items: Component[]): Category[] => {
  const byCategory = new Map<string, Category>();
  for (const item of items) {
    const id = item.category ?? 'category-empty';
    let category = byCategory.get(id);
    if (!category) {
      category = {
        id,
        name: item.category as string,
        isOpen: !item.category,
        components: [],
      };
      byCategory.set(id, category);
    }
    category.components.push(item);
  }
  return [...byCategory.values()]
    .map((category) => ({
      ...category,
      components: [...category.components].sort(compareComponents),
    }))
    .sort(compareCategories);
};

export type ComponentsPage = {
  data?: Component[];
  pagination?: {
    page?: number;
    limit?: number;
    total_items?: number;
  } | null;
};

/**
 * Fetch every page of the component catalog. Stops when `total_items` is
 * reached, when a page comes back short, or when it is empty; rows seen
 * twice (a component created between two page requests shifts the pages)
 * are kept once. A page that fails (the API layer resolves `null` on HTTP
 * and network errors) rejects, so the caller never shows a partial catalog.
 */
export const fetchAllComponents = async (
  fetchPage: (page: number, limit: number) => Promise<ComponentsPage | null>,
  pageSize: number = CATALOG_PAGE_SIZE,
): Promise<Component[]> => {
  const all: Component[] = [];
  const seen = new Set<string>();
  let page = 1;
  for (;;) {
    const res = await fetchPage(page, pageSize);
    if (!res || !Array.isArray(res.data)) {
      throw new Error(`component catalog page ${page} failed to load`);
    }
    const rows = res.data;
    for (const row of rows) {
      const key = String(row.id);
      if (seen.has(key)) continue;
      seen.add(key);
      all.push(row);
    }
    const total = res?.pagination?.total_items;
    const limit = res?.pagination?.limit ?? pageSize;
    if (
      rows.length === 0 ||
      total === undefined ||
      total === null ||
      all.length >= total ||
      rows.length < limit
    ) {
      break;
    }
    page += 1;
  }
  return all;
};
