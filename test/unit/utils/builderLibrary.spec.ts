import { describe, it, expect, vi } from 'vitest';
import type { Component } from '~/types/canvas.types';
import {
  fetchAllComponents,
  getCategories,
  isPlatformComponent,
} from '~/utils/builderLibrary';

const component = (
  id: string,
  name: string,
  category: string | null,
  creator = 'user@example.com',
): Component => ({
  id,
  name,
  input_path: [],
  output_path: [],
  component_file: null,
  category,
  creator,
});

describe('builderLibrary.getCategories', () => {
  it('groups by exact category and orders platform categories first', () => {
    const categories = getCategories([
      component('1', 'Zeta tool', 'zeta'),
      component('2', 'Classifier evaluator', 'evaluation', 'HIRO'),
      component('3', 'Orphan', null),
      component('4', 'Image dataset reader', 'data', 'HIRO'),
      component('5', 'My reader', 'data'),
      component('6', 'Add ten', 'test'),
      component('7', 'ntk_fine_tune', 'fine_tune', 'HIRO'),
    ]);

    expect(categories.map((c) => c.id)).toEqual([
      'data',
      'evaluation',
      'fine_tune',
      'test',
      'zeta',
      'category-empty',
    ]);
    // platform components lead inside a category
    expect(categories[0].components.map((c) => c.name)).toEqual([
      'Image dataset reader',
      'My reader',
    ]);
    // only the uncategorised group starts open
    expect(categories.map((c) => c.isOpen)).toEqual([
      false,
      false,
      false,
      false,
      false,
      true,
    ]);
  });

  it('keeps the exact category string as the group name', () => {
    const [group] = getCategories([component('1', 'A', 'federated server')]);
    expect(group.name).toBe('federated server');
    expect(group.components).toHaveLength(1);
  });
});

describe('builderLibrary.isPlatformComponent', () => {
  it('recognises the HIRO creator only', () => {
    expect(isPlatformComponent(component('1', 'A', 'data', 'HIRO'))).toBe(true);
    expect(isPlatformComponent(component('1', 'A', 'data'))).toBe(false);
    expect(
      isPlatformComponent({ ...component('1', 'A', 'data'), creator: null }),
    ).toBe(false);
  });
});

describe('builderLibrary.fetchAllComponents', () => {
  it('walks every page until total_items is reached', async () => {
    const pages = [
      {
        data: [component('1', 'A', 'data'), component('2', 'B', 'data')],
        pagination: { page: 1, limit: 2, total_items: 5 },
      },
      {
        data: [component('3', 'C', 'data'), component('4', 'D', 'data')],
        pagination: { page: 2, limit: 2, total_items: 5 },
      },
      {
        data: [component('5', 'E', 'data')],
        pagination: { page: 3, limit: 2, total_items: 5 },
      },
    ];
    const fetchPage = vi.fn(async (page: number) => pages[page - 1]);

    const all = await fetchAllComponents(fetchPage, 2);

    expect(all.map((c) => c.id)).toEqual(['1', '2', '3', '4', '5']);
    expect(fetchPage).toHaveBeenCalledTimes(3);
    expect(fetchPage).toHaveBeenNthCalledWith(2, 2, 2);
  });

  it('stops after a single page when the response carries no pagination', async () => {
    const fetchPage = vi.fn(async () => ({
      data: [component('1', 'A', 'data')],
    }));
    expect(await fetchAllComponents(fetchPage)).toHaveLength(1);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('drops rows repeated across pages and tolerates an empty page', async () => {
    const fetchPage = vi.fn(async (page: number) =>
      page === 1
        ? {
            data: [component('1', 'A', 'data'), component('2', 'B', 'data')],
            pagination: { page: 1, limit: 2, total_items: 4 },
          }
        : page === 2
          ? {
              data: [component('2', 'B', 'data'), component('3', 'C', 'data')],
              pagination: { page: 2, limit: 2, total_items: 4 },
            }
          : { data: [], pagination: { page: 3, limit: 2, total_items: 4 } },
    );
    const all = await fetchAllComponents(fetchPage, 2);
    expect(all.map((c) => c.id)).toEqual(['1', '2', '3']);
    expect(fetchPage).toHaveBeenCalledTimes(3);
  });
});
