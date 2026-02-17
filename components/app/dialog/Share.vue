<template>
  <Dialog :open="open" @update:open="onOpenChange">
    <DialogContent class="sm:max-w-[480px] gap-0 p-0 overflow-hidden">
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
      </div>

      <Separator />

      <!-- Content -->
      <div class="px-6 py-5 space-y-5">
        <!-- Add People Section -->
        <div class="space-y-3">
          <label class="text-sm font-medium">{{ t('share.add_people') }}</label>
          <div class="flex gap-2">
            <div class="relative flex-1">
              <Icon
                name="lucide:search"
                class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              />
              <Input
                v-model="searchQuery"
                type="text"
                :placeholder="t('share.search_placeholder')"
                class="pl-9"
                @input="handleSearch"
              />
            </div>
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
                <SelectItem value="edit">
                  <div class="flex items-center gap-2">
                    <Icon name="lucide:pencil" class="h-4 w-4" />
                    {{ t('share.permission_edit') }}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Search Results Dropdown -->
          <div
            v-if="showSearchResults && filteredUsers.length > 0"
            class="border rounded-lg bg-background shadow-lg max-h-[180px] overflow-y-auto"
          >
            <button
              v-for="user in filteredUsers"
              :key="user.email"
              type="button"
              class="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors text-left"
              @click="addUser(user)"
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
            </button>
          </div>

          <!-- No Results -->
          <div
            v-if="
              showSearchResults && searchQuery && filteredUsers.length === 0
            "
            class="text-sm text-muted-foreground text-center py-3"
          >
            {{ t('share.no_users_found') }}
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
                    <SelectItem value="edit">
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

        <!-- Copy Link Section -->
        <div class="pt-2">
          <Button
            variant="outline"
            class="w-full justify-start gap-2"
            @click="copyLink"
          >
            <Icon name="lucide:link" class="h-4 w-4" />
            {{ t('share.copy_link') }}
          </Button>
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
          {{ t('share.save_changes') }}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
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
const api = useApi();

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
const showSearchResults = ref(false);
const isSaving = ref(false);
const sharedUsers = ref<SharedUser[]>([]);
const availableUsers = ref<User[]>([]);

// Mock users for demo - in production, fetch from API
const mockUsers: User[] = [
  { email: 'john.doe@company.com', name: 'John Doe' },
  { email: 'jane.smith@company.com', name: 'Jane Smith' },
  { email: 'bob.wilson@company.com', name: 'Bob Wilson' },
  { email: 'alice.johnson@company.com', name: 'Alice Johnson' },
  { email: 'charlie.brown@company.com', name: 'Charlie Brown' },
];

// Computed
const filteredUsers = computed(() => {
  if (!searchQuery.value) return [];

  const query = searchQuery.value.toLowerCase();
  const sharedEmails = new Set(sharedUsers.value.map((u) => u.email));

  return availableUsers.value.filter(
    (user) =>
      !sharedEmails.has(user.email) &&
      (user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)),
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

const handleSearch = () => {
  showSearchResults.value = searchQuery.value.length > 0;
};

const addUser = (user: User) => {
  sharedUsers.value.push({
    ...user,
    permission: selectedPermission.value,
  });
  searchQuery.value = '';
  showSearchResults.value = false;
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

const copyLink = async () => {
  const config = useRuntimeConfig();
  const baseUrl = window.location.origin;
  const link = `${baseUrl}${config.app.baseURL}datasets/${props.datasetId}`;

  try {
    await navigator.clipboard.writeText(link);
    toaster.show('success', 'copied_to_clipboard');
  } catch {
    toaster.show('error', 'failed_to_copy');
  }
};

const handleClose = () => {
  searchQuery.value = '';
  showSearchResults.value = false;
  emit('close');
};

const handleSave = async () => {
  isSaving.value = true;

  try {
    // In production, call API to save sharing settings
    // await api.shareDataset(props.datasetId, sharedUsers.value);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    toaster.show('success', 'share_updated');
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
      // In production, fetch from API:
      // const response = await api.getUsers();
      // availableUsers.value = response.data;
      availableUsers.value = mockUsers;

      // Also fetch existing shares for this dataset
      // const shares = await api.getDatasetShares(props.datasetId);
      // sharedUsers.value = shares.data;
      sharedUsers.value = [];
    }
  },
);
</script>
