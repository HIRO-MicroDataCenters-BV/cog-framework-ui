<script setup lang="ts">
interface Item {
  key: string;
  label: string;
  action: () => void | Promise<void>;
  hasConfirmation?: boolean;
  icon?: string;
  disabled?: boolean;
}

// Default icons for common actions
const actionIcons: Record<string, string> = {
  share: 'lucide:share-2',
  download: 'lucide:download',
  preview: 'lucide:eye',
  delete: 'lucide:trash-2',
  archive: 'lucide:archive',
  restore: 'lucide:rotate-ccw',
  edit: 'lucide:pencil',
  copy: 'lucide:copy',
  view: 'lucide:eye',
  serve: 'lucide:server',
};

const getIcon = (item: Item) => {
  // Return custom icon if provided
  if (item.icon) return item.icon;

  // Check exact match first
  if (actionIcons[item.key]) return actionIcons[item.key];

  // Check partial match (e.g., 'delete_model' matches 'delete')
  for (const [action, icon] of Object.entries(actionIcons)) {
    if (item.key.includes(action)) return icon;
  }

  return '';
};

const { t } = useI18n();
const props = defineProps<{
  items: Item[];
  id: string | number;
  title: string;
  menuTitle?: string;
}>();

defineEmits<{
  (e: 'expand'): void;
}>();

const isOpenConfirm = ref(false);
/** UI copy (title, key); cleared when dialog closes — do not use for invoking the action. */
const pendingAction = ref<Item | null>(null);
/**
 * Callback captured when opening the dialog. Reka/Radix closes the dialog before or after click
 * and @update:open clears pendingAction — this ref must stay set until confirm runs.
 */
const pendingConfirmFn = ref<(() => void | Promise<void>) | null>(null);
const confirmInFlight = ref(false);

/** Runs only after user confirms; awaits archive/delete so POST completes before dialog closes. */
async function onConfirmDialogAction() {
  const fn = pendingConfirmFn.value;
  if (!fn || confirmInFlight.value) return;
  confirmInFlight.value = true;
  try {
    await Promise.resolve(fn());
  } finally {
    confirmInFlight.value = false;
    pendingConfirmFn.value = null;
    pendingAction.value = null;
    isOpenConfirm.value = false;
  }
}

function onCancelConfirmDialog() {
  pendingConfirmFn.value = null;
  pendingAction.value = null;
}

function onActionMenuItemClick(item: Item) {
  if (item.disabled) return;
  pendingAction.value = item;
  if (item.hasConfirmation) {
    pendingConfirmFn.value = item.action;
    isOpenConfirm.value = true;
  } else {
    void item.action();
  }
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" class="h-8 w-8 p-0 cursor-pointer">
        <span class="sr-only">{{ $t('hint.open_menu') }}</span>
        <div class="h-4 w-4">
          <Icon name="lucide:ellipsis" />
        </div>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="min-w-[160px]">
      <div
        class="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
      >
        {{ props.menuTitle || $t('title.actions') }}
      </div>
      <DropdownMenuSeparator />

      <template v-for="item in props.items" :key="item.key">
        <DropdownMenuItem
          :disabled="item.disabled"
          :class="[
            'gap-2',
            item.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
            item.key.includes('delete') && !item.disabled
              ? 'text-destructive focus:text-destructive'
              : '',
          ]"
          @click="() => onActionMenuItemClick(item)"
        >
          <Icon v-if="getIcon(item)" :name="getIcon(item)" class="h-4 w-4" />
          {{ t(`action.${item.key}`) }}
        </DropdownMenuItem>
      </template>
    </DropdownMenuContent>
  </DropdownMenu>

  <AlertDialog :open="isOpenConfirm" @update:open="(v) => (isOpenConfirm = v)">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          <template v-if="pendingAction?.key === 'archive_run'">{{
            $t('title.archive_run')
          }}</template>
          <template v-else-if="pendingAction?.key === 'restore_run'">{{
            $t('title.restore_run')
          }}</template>
          <template v-else>{{ $t('title.are_you_sure') }}</template>
        </AlertDialogTitle>
        <AlertDialogDescription
          v-if="pendingAction?.key === 'archive_run'"
          class="space-y-3"
        >
          <p class="m-0">{{ t('alert.archive_run_p1') }}</p>
          <p
            class="m-0 rounded-md border border-border/60 bg-muted/40 px-3 py-2.5 text-sm"
          >
            <span class="font-semibold text-foreground">
              {{ t('alert.archive_run_note_label') }}:
            </span>
            {{ t('alert.archive_run_p2') }}
          </p>
        </AlertDialogDescription>
        <AlertDialogDescription
          v-else-if="pendingAction?.key === 'restore_run'"
          class="m-0"
        >
          {{ t('alert.restore_run', { name: props.title }) }}
        </AlertDialogDescription>
        <AlertDialogDescription
          v-else-if="pendingAction?.key === 'delete_run'"
          class="m-0"
        >
          {{ t('alert.delete_pipeline_run', { name: props.title }) }}
        </AlertDialogDescription>
        <AlertDialogDescription v-else class="m-0">
          {{ t('alert.delete_dataset', { name: props.title }) }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel
          class="cursor-pointer"
          @click="onCancelConfirmDialog"
          >{{ $t('action.cancel') }}</AlertDialogCancel
        >
        <AlertDialogAction
          :variant="
            pendingAction?.key === 'archive_run' ||
            pendingAction?.key === 'restore_run'
              ? 'default'
              : 'destructive'
          "
          class="cursor-pointer"
          :disabled="confirmInFlight"
          @click.prevent="onConfirmDialogAction"
        >
          <template v-if="pendingAction?.key === 'archive_run'">{{
            $t('action.archive')
          }}</template>
          <template v-else-if="pendingAction?.key === 'restore_run'">{{
            $t('action.restore_run')
          }}</template>
          <template v-else>{{ $t('action.delete') }}</template>
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
