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
import DropdownAction from '@/components/app/menu/Actions.vue';
import { useApi } from '@/composables/api';
import QuotaBar from '~/components/app/QuotaBar.vue';
import QuotaEditDialog from '~/components/app/dialog/QuotaEditDialog.vue';
import {
  AlertDialog,
  AlertDialogAction,
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

const tableRef = ref();
const editOpen = ref(false);
const editRow = ref<UserRow | null>(null);
const clearRow = ref<UserRow | null>(null);
const clearing = ref(false);

const listRows = async () => {
  const [usersResponse, quotasResponse] = await Promise.all([
    getUsers(),
    getQuotas(),
  ]);
  const users = usersFromPayload(usersResponse?.data);
  const quotas = ((quotasResponse?.data as QuotaListData | undefined)?.items ??
    []) as QuotaStatus[];
  const rows = mergeUsersAndQuotas(users, quotas);
  return {
    data: rows,
    pagination: { total_items: rows.length, page: 1, limit: rows.length || 1 },
  };
};

const refresh = () => {
  void tableRef.value?.fetchData({ silent: true });
};

const openEdit = (row: UserRow) => {
  editRow.value = row;
  editOpen.value = true;
};

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

const resourceCell = (resource: QuotaResourceName) => {
  return ({ row }: { row: TableRowType }) => {
    const item = row.original as UserRow;
    if (!item.quota) {
      return h(
        'span',
        { class: 'text-xs text-muted-foreground' },
        item.hasProfile ? t('status.no_quota') : '–',
      );
    }
    const usage = item.quota.resources.find((r) => r.resource === resource);
    if (!usage) return '–';
    return h(QuotaBar, { row: usage, compact: true, class: 'min-w-[120px]' });
  };
};

const columns = [
  {
    id: 'email',
    size: 260,
    cell: ({ row }: { row: TableRowType }) => {
      const item = row.original as UserRow;
      const sub = !item.hasAccount
        ? t('hint.quota_profile_only')
        : !item.hasProfile
          ? t('hint.quota_no_profile')
          : item.department || '';
      return h('div', { class: 'flex flex-col min-w-0' }, [
        h(
          'span',
          { class: 'truncate font-medium', title: item.email },
          item.email,
        ),
        sub
          ? h('span', { class: 'text-xs text-muted-foreground truncate' }, sub)
          : null,
      ]);
    },
  },
  {
    id: 'namespace',
    size: 150,
    cell: ({ row }: { row: TableRowType }) => {
      const item = row.original as UserRow;
      return item.namespace
        ? h('span', { class: 'font-mono text-xs' }, item.namespace)
        : h('span', { class: 'text-muted-foreground' }, '–');
    },
  },
  { id: 'quota_cpu', size: 170, cell: resourceCell('cpu') },
  { id: 'quota_memory', size: 190, cell: resourceCell('memory') },
  { id: 'quota_gpu', size: 140, cell: resourceCell('gpu') },
  {
    id: 'actions',
    size: 70,
    cell: ({ row }: { row: TableRowType }) => {
      const item = row.original as UserRow;
      const items = [
        {
          key: 'edit_quota',
          label: t('action.edit_quota'),
          icon: 'lucide:gauge',
          disabled: !item.hasProfile,
          action: () => openEdit(item),
        },
      ];
      if (item.quota?.enabled) {
        items.push({
          key: 'clear_quota',
          label: t('action.clear_quota'),
          icon: 'lucide:eraser',
          disabled: false,
          action: () => {
            clearRow.value = item;
          },
        });
      }
      return h(DropdownAction, {
        items,
        id: item.email,
        title: item.email,
        menuTitle: t('column.actions'),
      });
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
      @update:open="(value: boolean) => !value && (clearRow = null)"
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
          <AlertDialogAction
            :disabled="clearing"
            data-testid="confirm-clear-quota"
            @click.prevent="confirmClear"
          >
            {{ t('action.clear_quota') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
