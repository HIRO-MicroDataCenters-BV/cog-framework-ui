<template>
  <Dialog :open="open" @update:open="onOpenChange">
    <DialogContent class="sm:max-w-[560px] gap-0 p-0 overflow-hidden">
      <!-- Header -->
      <div class="px-6 pt-6 pb-4">
        <DialogHeader>
          <DialogTitle class="text-lg font-semibold flex items-center gap-2">
            <Icon name="lucide:share-2" class="h-5 w-5" />
            {{ t('share.title') }}
          </DialogTitle>
          <DialogDescription class="text-sm text-muted-foreground">
            {{ t('share.description', { name: datasetName }) }}
          </DialogDescription>
        </DialogHeader>

        <!-- Dataset Info -->
        <div class="mt-4 p-3 rounded-lg bg-muted/50 border">
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"
            >
              <Icon name="lucide:database" class="h-5 w-5 text-primary" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate">{{ datasetName }}</p>
              <p class="text-xs text-muted-foreground font-mono truncate">
                {{ datasetId }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <!-- Content -->
      <div class="px-6 py-5 space-y-5">
        <!-- Add People Section -->
        <div class="space-y-3">
          <label class="text-sm font-medium">{{ t('share.add_people') }}</label>
          <div class="flex gap-2">
            <!-- User Dropdown -->
            <div ref="dropdownRef" class="relative flex-1">
              <button
                type="button"
                class="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                @click="isDropdownOpen = !isDropdownOpen"
              >
                <span class="text-muted-foreground">
                  {{ t('share.select_user') }}
                </span>
                <Icon
                  name="lucide:chevron-down"
                  class="h-4 w-4 opacity-50 transition-transform"
                  :class="{ 'rotate-180': isDropdownOpen }"
                />
              </button>

              <!-- Dropdown Content -->
              <div
                v-if="isDropdownOpen"
                class="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg"
              >
                <!-- Search Input -->
                <div class="p-2 border-b">
                  <div class="relative">
                    <Icon
                      name="lucide:search"
                      class="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                    />
                    <Input
                      v-model="searchQuery"
                      type="text"
                      :placeholder="t('share.search_placeholder')"
                      class="pl-8 h-8"
                      @click.stop
                    />
                  </div>
                </div>

                <!-- User List -->
                <div class="max-h-[200px] overflow-y-auto p-1">
                  <button
                    v-for="user in filteredUsers"
                    :key="user.email"
                    type="button"
                    class="w-full flex items-center gap-3 px-2 py-2 rounded-sm hover:bg-accent transition-colors text-left"
                    @click="addUser(user)"
                  >
                    <Avatar class="h-8 w-8">
                      <AvatarFallback class="text-xs">
                        {{ getInitials(user.name) }}
                      </AvatarFallback>
                    </Avatar>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium truncate">
                        {{ user.name }}
                      </p>
                      <p class="text-xs text-muted-foreground truncate">
                        {{ user.email }}
                      </p>
                    </div>
                  </button>

                  <!-- No Results -->
                  <div
                    v-if="filteredUsers.length === 0"
                    class="text-sm text-muted-foreground text-center py-4"
                  >
                    {{ t('share.no_users_found') }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Permission Select -->
            <Select v-model="selectedPermission">
              <SelectTrigger class="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">
                  <div class="flex items-center gap-2">
                    <Icon name="lucide:eye" class="h-4 w-4" />
                    {{ t('share.permission_view') }}
                  </div>
                </SelectItem>
                <SelectItem value="edit" disabled>
                  <div class="flex items-center gap-2">
                    <Icon name="lucide:pencil" class="h-4 w-4" />
                    {{ t('share.permission_edit') }}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- Shared With Section -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium">
              {{ t('share.shared_with') }}
            </label>
            <span class="text-xs text-muted-foreground">
              {{ sharedUsers.length }} {{ t('share.people') }}
            </span>
          </div>

          <div
            v-if="sharedUsers.length > 0"
            class="border rounded-lg divide-y max-h-[200px] overflow-y-auto"
          >
            <div
              v-for="user in sharedUsers"
              :key="user.email"
              class="flex items-center gap-3 px-3 py-2.5"
            >
              <Avatar class="h-8 w-8">
                <AvatarFallback class="text-xs">
                  {{ getInitials(user.name) }}
                </AvatarFallback>
              </Avatar>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ user.name }}</p>
                <p class="text-xs text-muted-foreground truncate">
                  {{ user.email }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <Select
                  :model-value="user.permission"
                  @update:model-value="
                    (val) => updatePermission(user.email, val)
                  "
                >
                  <SelectTrigger class="h-8 w-[100px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">
                      {{ t('share.permission_view') }}
                    </SelectItem>
                    <SelectItem value="edit" disabled>
                      {{ t('share.permission_edit') }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 text-muted-foreground hover:text-destructive"
                  @click="removeUser(user.email)"
                >
                  <Icon name="lucide:x" class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="border rounded-lg p-6 text-center border-dashed">
            <Icon
              name="lucide:users"
              class="h-8 w-8 mx-auto text-muted-foreground/50 mb-2"
            />
            <p class="text-sm text-muted-foreground">
              {{ t('share.no_shared_users') }}
            </p>
          </div>
        </div>
      </div>

      <Separator />

      <!-- Footer -->
      <div class="flex items-center justify-end gap-2 px-6 py-4">
        <Button variant="ghost" size="sm" @click="handleClose">
          {{ t('action.cancel') }}
        </Button>
        <Button size="sm" :disabled="isSaving" @click="handleSave">
          <Icon
            v-if="isSaving"
            name="lucide:loader-2"
            class="h-4 w-4 mr-1.5 animate-spin"
          />
          {{ t('action.share') }}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
import { onClickOutside } from '@vueuse/core';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface User {
  email: string;
  name: string;
}

interface SharedUser extends User {
  permission: 'view' | 'edit';
}

const { t } = useI18n();
const toaster = useToaster();
const { postAccessGrant, getUsers } = useApi();
const { user: currentUser } = useCurrentUser();

const props = defineProps<{
  open: boolean;
  datasetId: string;
  datasetName: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

// State
const searchQuery = ref('');
const selectedPermission = ref<'view' | 'edit'>('view');
const dropdownRef = ref<HTMLElement | null>(null);
const isDropdownOpen = ref(false);
const isSaving = ref(false);

onClickOutside(dropdownRef, () => {
  isDropdownOpen.value = false;
});
const sharedUsers = ref<SharedUser[]>([]);
const availableUsers = ref<User[]>([]);
const isLoadingUsers = ref(false);

// Computed
const filteredUsers = computed(() => {
  const sharedEmails = new Set(sharedUsers.value.map((u) => u.email));

  // Filter out already shared users
  const availableList = availableUsers.value.filter(
    (user) => !sharedEmails.has(user.email),
  );

  // If no search query, return all available users
  if (!searchQuery.value) return availableList;

  // Filter by search query
  const query = searchQuery.value.toLowerCase();
  return availableList.filter(
    (user) =>
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query),
  );
});

// Methods
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const addUser = (user: User) => {
  sharedUsers.value.push({
    ...user,
    permission: selectedPermission.value,
  });
  searchQuery.value = '';
  isDropdownOpen.value = false;
};

const removeUser = (email: string) => {
  sharedUsers.value = sharedUsers.value.filter((u) => u.email !== email);
};

const updatePermission = (email: string, permission: string) => {
  const user = sharedUsers.value.find((u) => u.email === email);
  if (user) {
    user.permission = permission as 'view' | 'edit';
  }
};

const handleClose = () => {
  searchQuery.value = '';
  isDropdownOpen.value = false;
  emit('close');
};

const handleSave = async () => {
  if (sharedUsers.value.length === 0) {
    toaster.show('error', 'no_user_selected');
    return;
  }

  isSaving.value = true;

  try {
    const sharedUserIds = sharedUsers.value.map((user) => user.email);
    await postAccessGrant({
      owner_id: currentUser.value?.email || '',
      entity_id: props.datasetId,
      entity_type: 'dataset',
      shared_user_ids: sharedUserIds,
    });

    handleClose();
  } catch (error) {
    console.error('Failed to save sharing settings:', error);
    toaster.show('error', 'share_failed');
  } finally {
    isSaving.value = false;
  }
};

const onOpenChange = (open: boolean) => {
  if (!open) {
    handleClose();
  }
};

// Fetch users when dialog opens
watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      isLoadingUsers.value = true;
      try {
        const response = await getUsers();
        if (response?.data?.passwords) {
          // Transform API response to User interface
          availableUsers.value = response.data.passwords
            .filter(
              (u: { email: string }) => u.email !== currentUser.value?.email,
            )
            .map((u: { email: string; username: string }) => ({
              email: u.email,
              name: u.username || u.email.split('@')[0],
            }));
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
        availableUsers.value = [];
      } finally {
        isLoadingUsers.value = false;
      }

      // Reset shared users when dialog opens
      sharedUsers.value = [];
    }
  },
);
</script>
