import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Pagination from '~/components/app/table/Pagination.vue';

const mountPagination = (props: Record<string, unknown> = {}) =>
  mount(Pagination, {
    props: {
      currentPage: 2,
      pageSize: 10,
      totalItems: 100,
      canPreviousPage: true,
      canNextPage: true,
      ...props,
    },
    global: {
      stubs: {
        Select: {
          template:
            '<div><button data-test="page-size" @click="$emit(\'update:model-value\', \'20\')"><slot /></button></div>',
        },
        SelectTrigger: { template: '<div><slot /></div>' },
        SelectValue: { template: '<span />' },
        SelectContent: { template: '<div><slot /></div>' },
        SelectItem: { template: '<div><slot /></div>' },
        Icon: { template: '<i />' },
      },
    },
  });

describe('Pagination component', () => {
  it('emits previous and next page events', async () => {
    const wrapper = mountPagination();
    const buttons = wrapper.findAll('button');

    const prev = buttons.find((b) => b.text().includes('action.previous'));
    const next = buttons.find((b) => b.text().includes('action.next'));

    expect(prev).toBeTruthy();
    expect(next).toBeTruthy();

    await prev!.trigger('click');
    await next!.trigger('click');

    expect(wrapper.emitted('on-set-page')?.[0]).toEqual([1]);
    expect(wrapper.emitted('on-set-page')?.[1]).toEqual([3]);
  });

  it('emits page size changes from select', async () => {
    const wrapper = mountPagination();
    await wrapper.find('[data-test="page-size"]').trigger('click');

    expect(wrapper.emitted('on-set-page-size')?.[0]).toEqual([20]);
  });

  it('shows first/last buttons when showEdges is enabled and page is in middle', () => {
    const wrapper = mountPagination({
      currentPage: 6,
      showEdges: true,
      totalItems: 200,
      pageSize: 10,
    });

    expect(wrapper.text()).toContain('action.first');
    expect(wrapper.text()).toContain('action.last');
  });
});
