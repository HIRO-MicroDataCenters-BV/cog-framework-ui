/**
 * Page tests for the admin Users page: Dex users and Kubeflow Profiles are
 * merged into one row per email, users without a Profile cannot be given a
 * quota, the edit dialog opens from the row actions, and clearing goes
 * through the API then refreshes.
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';

import UsersPage from '~/pages/users/index.vue';

const GIB = 1024 ** 3;

const USERS = {
  data: {
    passwords: [
      { email: 'alice@example.com', username: 'alice', department: 'R&D' },
      { email: 'bob@example.com', username: 'bob', department: null },
    ],
    total_count: 2,
  },
};

const QUOTAS = {
  data: {
    items: [
      {
        user_id: 'alice@example.com',
        namespace: 'alice',
        enabled: true,
        synced: true,
        resources: [
          {
            resource: 'cpu',
            hard: '4',
            used: '1',
            hard_value: 4,
            used_value: 1,
            ratio: 0.25,
          },
          {
            resource: 'memory',
            hard: '8Gi',
            used: '2Gi',
            hard_value: 8 * GIB,
            used_value: 2 * GIB,
            ratio: 0.25,
          },
          {
            resource: 'gpu',
            hard: null,
            used: null,
            hard_value: null,
            used_value: null,
            ratio: null,
          },
        ],
        limit_range: null,
        quota_name: 'kf-resource-quota',
      },
      {
        user_id: 'carol@external.org',
        namespace: 'carol',
        enabled: false,
        synced: false,
        resources: [
          {
            resource: 'cpu',
            hard: null,
            used: null,
            hard_value: null,
            used_value: null,
            ratio: null,
          },
          {
            resource: 'memory',
            hard: null,
            used: null,
            hard_value: null,
            used_value: null,
            ratio: null,
          },
          {
            resource: 'gpu',
            hard: null,
            used: null,
            hard_value: null,
            used_value: null,
            ratio: null,
          },
        ],
        limit_range: null,
        quota_name: 'kf-resource-quota',
      },
    ],
    total_count: 2,
  },
};

const apiMocks = vi.hoisted(() => ({
  getUsers: vi.fn(),
  getQuotas: vi.fn(),
  deleteQuota: vi.fn(),
  putQuota: vi.fn(),
}));
vi.mock('@/composables/api', () => ({ useApi: () => apiMocks }));

// A table that calls the data source once and renders every column's cell.
// Like the real AppTable it keeps its rows when the source answers null.
const lastDataSourceResult: { value: unknown } = { value: undefined };
const dataSourceParams: { value: Record<string, unknown> } = { value: {} };
const AppTableStub = defineComponent({
  name: 'AppTable',
  props: {
    columns: { type: Array, default: () => [] },
    dataSource: { type: Function, required: true },
  },
  setup(props, { expose }) {
    const rows = ref<unknown[]>([]);
    const fetchData = async () => {
      const result = await props.dataSource({
        page: 1,
        limit: 15,
        ...dataSourceParams.value,
      });
      lastDataSourceResult.value = result;
      if (result?.data) rows.value = result.data;
    };
    expose({ fetchData });
    void fetchData();
    return () =>
      h(
        'table',
        rows.value.map((original, index) =>
          h(
            'tr',
            { 'data-row': index },
            (
              props.columns as Array<{
                id: string;
                cell: (ctx: { row: { original: unknown } }) => unknown;
              }>
            ).map((col) =>
              h('td', { 'data-col': col.id }, [
                col.cell({ row: { original } }),
              ]),
            ),
          ),
        ),
      );
  },
});

const QuotaEditDialogStub = defineComponent({
  name: 'QuotaEditDialog',
  props: {
    open: Boolean,
    userId: String,
    namespace: String,
    current: { type: Object, default: null },
  },
  emits: ['update:open', 'saved'],
  render() {
    return h('div', {
      'data-testid': 'quota-edit-dialog',
      'data-open': this.open ? '1' : '0',
      'data-user': this.userId,
      'data-namespace': this.namespace,
    });
  },
});

const passthrough = (name: string) =>
  defineComponent({
    name,
    inheritAttrs: false,
    setup:
      (_p, { slots, attrs }) =>
      () =>
        h('div', attrs, slots.default?.()),
  });

beforeAll(() => {
  vi.stubGlobal('definePageMeta', () => undefined);
  // Icons are a Nuxt auto-registered component resolved at runtime.
  vi.stubGlobal('resolveComponent', (name: string) =>
    defineComponent({
      name,
      props: { name: { type: String, default: '' } },
      setup(props) {
        return () => h('i', { 'data-icon': props.name });
      },
    }),
  );
  vi.stubGlobal('useApp', () => ({
    setPage: vi.fn(),
    page: ref({ isLoading: false }),
  }));
});

beforeEach(() => {
  apiMocks.getUsers.mockReset().mockResolvedValue(USERS);
  apiMocks.getQuotas.mockReset().mockResolvedValue(QUOTAS);
  apiMocks.deleteQuota.mockReset().mockResolvedValue({ data: {} });
  dataSourceParams.value = {};
  lastDataSourceResult.value = undefined;
});

const mountPage = () =>
  mount(UsersPage, {
    global: {
      stubs: {
        AppTable: AppTableStub,
        QuotaEditDialog: QuotaEditDialogStub,
        AlertDialog: passthrough('AlertDialog'),
        AlertDialogContent: passthrough('AlertDialogContent'),
        AlertDialogHeader: passthrough('AlertDialogHeader'),
        AlertDialogTitle: passthrough('AlertDialogTitle'),
        AlertDialogDescription: passthrough('AlertDialogDescription'),
        AlertDialogFooter: passthrough('AlertDialogFooter'),
        AlertDialogCancel: passthrough('AlertDialogCancel'),
        AlertDialogAction: defineComponent({
          name: 'AlertDialogAction',
          inheritAttrs: false,
          setup:
            (_p, { slots, attrs }) =>
            () =>
              h('button', { ...attrs, type: 'button' }, slots.default?.()),
        }),
      },
    },
  });

describe('Users page', () => {
  it('merges Dex users and Profiles into one row per email', async () => {
    const wrapper = mountPage();
    await flushPromises();
    const rows = wrapper.findAll('tr');
    expect(rows).toHaveLength(3);
    const emails = rows.map((r) => r.find('[data-col="email"]').text());
    expect(emails[0]).toContain('alice@example.com');
    expect(emails[0]).toContain('R&D');
    expect(emails[1]).toContain('bob@example.com');
    expect(emails[1]).toContain('status.no_workspace');
    // The explanation is a native tooltip on a wrapper (Badge drops attrs).
    expect(
      rows[1].find('[data-testid="workspace-status"]').attributes('title'),
    ).toBe('hint.quota_no_profile');
    expect(emails[2]).toContain('carol@external.org');
    expect(emails[2]).toContain('status.external_identity');

    expect(rows[0].find('[data-col="namespace"]').text()).toBe('alice');
    expect(rows[0].find('[data-col="quota_cpu"]').text()).toContain('1 / 4');
    expect(rows[0].find('[data-col="quota_gpu"]').text()).toBe(
      'status.no_quota',
    );
    // A Profile without a quota says so; no Profile at all shows a dash.
    expect(rows[2].find('[data-col="quota_cpu"]').text()).toBe(
      'status.no_quota',
    );
    expect(rows[1].find('[data-col="quota_cpu"]').text()).toBe('–');
  });

  it('only users with a Profile can be given a quota', async () => {
    const wrapper = mountPage();
    await flushPromises();
    const rows = wrapper.findAll('tr');
    // The quota action is a direct button in the row, not a menu entry.
    const edit = (i: number) => rows[i].find('[data-testid="set-quota"]');
    // No workspace: a hoverable explanation instead of a disabled button.
    expect(edit(1).exists()).toBe(false);
    expect(
      rows[1].find('[data-testid="quota-unavailable"]').attributes('title'),
    ).toBe('hint.quota_no_profile');
    expect((edit(0).element as HTMLButtonElement).disabled).toBe(false);
    expect(edit(0).text()).toContain('action.change_quota');
    expect(edit(2).text()).toContain('action.edit_quota');
    // Clear is only offered when a quota is set.
    expect(rows[0].find('[data-testid="clear-quota"]').exists()).toBe(true);
    expect(rows[2].find('[data-testid="clear-quota"]').exists()).toBe(false);
    // Resource cells and the user cell carry icons.
    expect(
      rows[0].find('[data-col="quota_cpu"] [data-icon="lucide:cpu"]').exists(),
    ).toBe(true);
    expect(
      rows[1]
        .find('[data-col="email"] [data-icon="lucide:user-round-x"]')
        .exists(),
    ).toBe(true);

    await edit(0).trigger('click');
    await flushPromises();
    const dialog = wrapper.find('[data-testid="quota-edit-dialog"]');
    expect(dialog.attributes('data-open')).toBe('1');
    expect(dialog.attributes('data-user')).toBe('alice@example.com');
    expect(dialog.attributes('data-namespace')).toBe('alice');
  });

  it('reports a failed read instead of mislabelling rows', async () => {
    apiMocks.getQuotas.mockResolvedValue(null);
    const wrapper = mountPage();
    await flushPromises();
    expect(lastDataSourceResult.value).toBeNull();
    expect(wrapper.findAll('tr')).toHaveLength(0);
  });

  it('pages and searches the merged rows', async () => {
    dataSourceParams.value = { limit: 2, page: 2 };
    const wrapper = mountPage();
    await flushPromises();
    const result = lastDataSourceResult.value as {
      data: unknown[];
      pagination: { total_items: number; page: number; limit: number };
    };
    expect(result.pagination).toEqual({ total_items: 3, page: 2, limit: 2 });
    expect(result.data).toHaveLength(1);
    expect(wrapper.find('[data-col="email"]').text()).toContain(
      'carol@external.org',
    );

    dataSourceParams.value = { page: 1, email: 'bob' };
    const searched = mountPage();
    await flushPromises();
    expect(searched.findAll('tr')).toHaveLength(1);
    expect(searched.find('[data-col="email"]').text()).toContain(
      'bob@example.com',
    );
  });

  it('clears a quota after confirmation and refreshes', async () => {
    const wrapper = mountPage();
    await flushPromises();
    await wrapper
      .findAll('tr')[0]
      .find('[data-testid="clear-quota"]')
      .trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('title.clear_quota');
    await wrapper.find('[data-testid="confirm-clear-quota"]').trigger('click');
    await flushPromises();
    expect(apiMocks.deleteQuota).toHaveBeenCalledWith('alice@example.com');
    // The list is re-read: users and quotas fetched twice overall.
    expect(apiMocks.getQuotas).toHaveBeenCalledTimes(2);
  });
});
