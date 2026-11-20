<script setup lang="ts">
/**
 * Admin page: every platform user with their namespace, resource quota and
 * current usage, and the actions to set or clear a quota.
 *
 * Rows come from two independent lists: Dex users (`GET /users`) and
 * Kubeflow Profiles with their quota (`GET /quotas`), merged on email. A
 * Profile without a Dex account (an external identity) still gets a row; a
 * Dex user without a Profile gets one too, but cannot be given a quota
 * because there is no namespace to cap.
 */
import { h } from 'vue';
import type { TableRowType } from '@/types/row.types';
import { useApi } from '@/composables/api';
import QuotaBar from '~/components/app/QuotaBar.vue';
import QuotaEditDialog from '~/components/app/dialog/QuotaEditDialog.vue';
import { Button } from '~/components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import type {
  QuotaListData,
  QuotaResourceName,
  QuotaStatus,
} from '~/types/api.types';
import {
  filterRows,
  mergeUsersAndQuotas,
  usersFromPayload,
  type UserRow,
} from '~/utils/users';

definePageMeta({ middleware: 'admin' });

const { t } = useI18n();
const { getUsers, getQuotas, deleteQuota } = useApi();
const { setPage } = useApp();

setPage({
  section: 'users',
  description: t('description.users'),
});

/** Nuxt's auto-registered icon component, for use inside cell renderers. */
const Icon = resolveComponent('Icon');

const tableRef = ref();
const editOpen = ref(false);
const editRow = ref<UserRow | null>(null);
const clearRow = ref<UserRow | null>(null);
const clearing = ref(false);

/** Table parameters that are not a search term. */
const CONTROL_PARAMS = new Set([
  'page',
  'limit',
  'sort_by',
  'sort_order',
  'silent',
]);

const listRows = async (params: Record<string, unknown> = {}) => {
  const [usersResponse, quotasResponse] = await Promise.all([
    getUsers(),
    getQuotas(),
  ]);
  // request() answers null on failure. Half a picture would mislabel every
  // row (no Profile / no account), so a failed read is reported as such and
  // AppTable keeps the rows it already shows.
  if (!usersResponse || !quotasResponse) return null;
  const users = usersFromPayload(usersResponse.data);
  const quotas = ((quotasResponse.data as QuotaListData | undefined)?.items ??
    []) as QuotaStatus[];
  const search = String(
    Object.entries(params).find(
      ([key, value]) => !CONTROL_PARAMS.has(key) && typeof value === 'string',
    )?.[1] ?? '',
  )
    .trim()
    .toLowerCase();
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.max(1, Number(params.limit) || 15);
  const rows = filterRows(mergeUsersAndQuotas(users, quotas), search);
  return {
    data: rows.slice((page - 1) * limit, page * limit),
    pagination: { total_items: rows.length, page, limit },
  };
};

const refresh = () => {
  void tableRef.value?.fetchData({ silent: true });
};

const openEdit = (row: UserRow) => {
  editRow.value = row;
  editOpen.value = true;
};

/**
 * The confirm button is a plain Button, not AlertDialogAction: the latter
 * closes the dialog from its own click handler, which would clear
 * ``clearRow`` before this runs (see components/app/menu/Actions.vue). The
 * dialog is closed here once the request has settled.
 */
const confirmClear = async () => {
  const row = clearRow.value;
  if (!row || clearing.value) return;
  clearing.value = true;
  try {
    const response = await deleteQuota(row.email);
    if (response) refresh();
  } finally {
    clearing.value = false;
    clearRow.value = null;
  }
};

const RESOURCE_ICONS: Record<QuotaResourceName, string> = {
  cpu: 'lucide:cpu',
  memory: 'lucide:memory-stick',
  gpu: 'lucide:zap',
};

const resourceCell = (resource: QuotaResourceName) => {
  return ({ row }: { row: TableRowType }) => {
    const item = row.original as UserRow;
    const icon = h(Icon, {
      name: RESOURCE_ICONS[resource],
      class: 'size-4 shrink-0 text-muted-foreground mt-0.5',
      'aria-hidden': 'true',
    });
    if (!item.quota) {
      return h('div', { class: 'flex items-center gap-2' }, [
        icon,
        h(
          'span',
          { class: 'text-xs text-muted-foreground' },
          item.hasProfile ? t('status.no_quota') : '–',
        ),
      ]);
    }
    const usage = item.quota.resources.find((r) => r.resource === resource);
    if (!usage) return '–';
    return h('div', { class: 'flex items-start gap-2' }, [
      icon,
      h(QuotaBar, { row: usage, compact: true, class: 'min-w-[120px] flex-1' }),
    ]);
  };
};

/** A small icon-only button with an accessible name and a native tooltip. */
const iconButton = (
  opts: {
    icon: string;
    label: string;
    testid: string;
    disabled?: boolean;
    title?: string;
    variant?: 'ghost' | 'outline' | 'destructive';
  },
  onClick: () => void,
) =>
  h(
    Button,
    {
      variant: opts.variant ?? 'ghost',
      size: 'icon',
      class: 'size-8',
      disabled: opts.disabled,
      title: opts.title ?? opts.label,
      'aria-label': opts.label,
      'data-testid': opts.testid,
      onClick,
    },
    () => h(Icon, { name: opts.icon, class: 'size-4' }),
  );

const columns = [
  {
    id: 'email',
    size: 280,
    cell: ({ row }: { row: TableRowType }) => {
      const item = row.original as UserRow;
      const sub = !item.hasAccount
        ? t('hint.quota_profile_only')
        : !item.hasProfile
          ? t('hint.quota_no_profile')
          : item.department || '';
      const avatar = h(
        'span',
        {
          class:
            'flex size-8 shrink-0 items-center justify-center rounded-full ' +
            (item.hasProfile
              ? 'bg-primary/10 text-primary'
              : 'bg-muted text-muted-foreground'),
          'aria-hidden': 'true',
        },
        [
          h(Icon, {
            name: item.hasProfile ? 'lucide:user-round' : 'lucide:user-round-x',
            class: 'size-4',
          }),
        ],
      );
      return h('div', { class: 'flex items-center gap-3 min-w-0' }, [
        avatar,
        h('div', { class: 'flex flex-col min-w-0' }, [
          h(
            'span',
            { class: 'truncate font-medium', title: item.email },
            item.email,
          ),
          sub
            ? h(
                'span',
                { class: 'text-xs text-muted-foreground truncate' },
                sub,
              )
            : null,
        ]),
      ]);
    },
  },
  {
    id: 'namespace',
    size: 160,
    cell: ({ row }: { row: TableRowType }) => {
      const item = row.original as UserRow;
      return h('div', { class: 'flex items-center gap-2 min-w-0' }, [
        h(Icon, {
          name: item.namespace ? 'lucide:folder-tree' : 'lucide:folder-x',
          class: 'size-4 shrink-0 text-muted-foreground',
          'aria-hidden': 'true',
        }),
        item.namespace
          ? h('span', { class: 'font-mono text-xs truncate' }, item.namespace)
          : h('span', { class: 'text-muted-foreground' }, '–'),
      ]);
    },
  },
  { id: 'quota_cpu', size: 180, cell: resourceCell('cpu') },
  { id: 'quota_memory', size: 200, cell: resourceCell('memory') },
  { id: 'quota_gpu', size: 150, cell: resourceCell('gpu') },
  {
    // Quota actions sit directly in the row: setting a quota is the
    // page's main job, so it is one click, not a menu away.
    id: 'quota_actions',
    size: 240,
    cell: ({ row }: { row: TableRowType }) => {
      const item = row.original as UserRow;
      const setButton = h(
        Button,
        {
          // Filled when it is the row's natural next step (a workspace
          // without a quota); outline when changing an existing one or when
          // nothing can be done yet.
          variant:
            item.hasProfile && !item.quota?.enabled ? 'default' : 'outline',
          size: 'sm',
          class: 'h-8',
          disabled: !item.hasProfile,
          title: item.hasProfile
            ? t('action.edit_quota')
            : t('hint.quota_no_profile'),
          'data-testid': 'set-quota',
          onClick: () => openEdit(item),
        },
        () => [
          h(Icon, { name: 'lucide:gauge', class: 'size-4 mr-1.5' }),
          item.quota?.enabled
            ? t('action.change_quota')
            : t('action.edit_quota'),
        ],
      );
      const children = [setButton];
      if (item.quota?.enabled) {
        children.push(
          iconButton(
            {
              icon: 'lucide:eraser',
              label: t('action.clear_quota'),
              testid: 'clear-quota',
            },
            () => {
              clearRow.value = item;
            },
          ),
        );
      }
      return h('div', { class: 'flex items-center gap-1' }, children);
    },
  },
];
</script>

<template>
  <div class="flex flex-col h-full">
    <AppTable
      ref="tableRef"
      :columns="columns"
      :data-source="listRows"
      :has-stats="false"
      :has-filters="false"
      :selectable="false"
    />

    <QuotaEditDialog
      v-if="editRow"
      v-model:open="editOpen"
      :user-id="editRow.email"
      :namespace="editRow.namespace ?? ''"
      :current="editRow.quota"
      @saved="refresh"
    />

    <AlertDialog
      :open="clearRow !== null"
      @update:open="
        (value: boolean) => !value && !clearing && (clearRow = null)
      "
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('title.clear_quota') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ t('description.clear_quota', { name: clearRow?.email ?? '' }) }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="clearing">
            {{ t('action.cancel') }}
          </AlertDialogCancel>
          <Button
            :disabled="clearing"
            data-testid="confirm-clear-quota"
            @click="confirmClear"
          >
            {{ t('action.clear_quota') }}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
