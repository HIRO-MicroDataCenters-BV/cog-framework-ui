import { describe, it, expect, vi, beforeAll } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import LibrarySidebar from '~/components/app/builder/LibrarySidebar.vue';

const getTrainingBuilderComponents = vi.fn();

vi.mock('@/composables/api', () => ({
  useApi: () => ({ getTrainingBuilderComponents }),
}));

const base = {
  input_path: [],
  output_path: [],
  component_file: null,
};

const passthrough = { template: '<div><slot :open="true" /></div>' };

const mountSidebar = () =>
  mount(LibrarySidebar, {
    global: {
      mocks: { $t: (key: string) => key },
      stubs: {
        Icon: true,
        SidebarGroup: passthrough,
        SidebarMenu: passthrough,
        SidebarMenuItem: passthrough,
        SidebarMenuButton: passthrough,
        Collapsible: passthrough,
        CollapsibleTrigger: passthrough,
        CollapsibleContent: passthrough,
      },
    },
  });

beforeAll(() => {
  vi.stubGlobal('useApi', () => ({ getTrainingBuilderComponents }));
});

describe('LibrarySidebar', () => {
  it('loads every page of the catalog and groups platform components first', async () => {
    getTrainingBuilderComponents.mockImplementation(
      async ({ page }: { page: number }) =>
        page === 1
          ? {
              data: [
                {
                  ...base,
                  id: 'u1',
                  name: 'Add ten',
                  category: 'test',
                  creator: 'me',
                },
                {
                  ...base,
                  id: 'h1',
                  name: 'Image dataset reader',
                  category: 'data',
                  creator: 'HIRO',
                  description: 'Load a zip of class folders',
                },
              ],
              pagination: { page: 1, limit: 2, total_items: 3 },
            }
          : {
              data: [
                {
                  ...base,
                  id: 'h2',
                  name: 'CNN image classifier',
                  category: 'training',
                  creator: 'HIRO',
                },
              ],
              pagination: { page: 2, limit: 2, total_items: 3 },
            },
    );

    const wrapper = mountSidebar();
    await flushPromises();

    expect(getTrainingBuilderComponents).toHaveBeenCalledTimes(2);
    expect(getTrainingBuilderComponents).toHaveBeenNthCalledWith(1, {
      page: 1,
      limit: 100,
    });
    const text = wrapper.text();
    expect(text.indexOf('data')).toBeLessThan(text.indexOf('training'));
    expect(text.indexOf('training')).toBeLessThan(text.indexOf('test'));
    expect(text).toContain('CNN image classifier');
    expect(wrapper.find('[title="Load a zip of class folders"]').exists()).toBe(
      true,
    );
    expect(wrapper.findAll('[title="label.platform_component"]')).toHaveLength(
      2,
    );
  });

  it('shows an empty library when the request fails', async () => {
    getTrainingBuilderComponents.mockRejectedValueOnce(new Error('boom'));
    const wrapper = mountSidebar();
    await flushPromises();
    expect(wrapper.findAll('[draggable="true"]')).toHaveLength(0);
  });
});
