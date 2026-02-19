<script setup lang="ts">
interface Item {
  key: string;
  label: string;
  action: () => void;
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
  edit: 'lucide:pencil',
  copy: 'lucide:copy',
  view: 'lucide:eye',
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

const isOpenDelete = ref(false);

const action = ref();
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
          @click="
            () => {
              if (item.disabled) return;
              action = item.action;
              if (item.hasConfirmation) {
                if (item.key.includes('delete')) {
                  isOpenDelete = true;
                }
              } else {
                action();
              }
            }
          "
        >
          <Icon v-if="getIcon(item)" :name="getIcon(item)" class="h-4 w-4" />
          {{ t(`action.${item.key}`) }}
        </DropdownMenuItem>
      </template>
    </DropdownMenuContent>
  </DropdownMenu>

  <AlertDialog :open="isOpenDelete" @update:open="isOpenDelete = $event">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ $t('title.are_you_sure') }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ t('alert.delete_dataset', { name: props.title }) }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel class="cursor-pointer">{{
          $t('action.cancel')
        }}</AlertDialogCancel>
        <AlertDialogAction
          variant="destructive"
          class="cursor-pointer"
          @click="
            () => {
              action();
            }
          "
          >{{ $t('action.delete') }}</AlertDialogAction
        >
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
