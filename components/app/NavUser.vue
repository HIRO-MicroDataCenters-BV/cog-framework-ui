<script setup lang="ts">
const mock = useMock();
const menu = uselistMenus();
const { t } = useI18n();
const { user: currentUser, fetchCurrentUser } = useCurrentUser();

// Track avatar image load failure so we show initials fallback instead of broken icon
const avatarError = ref(false);
watch(
  () => currentUser.value?.avatarUrl ?? mock.value.user?.avatar_url,
  () => {
    avatarError.value = false;
  },
);

const onAvatarStatus = (status: 'idle' | 'loading' | 'loaded' | 'error') => {
  if (status === 'error') avatarError.value = true;
};

// Fetch user on mount
onMounted(() => {
  fetchCurrentUser();
});

// Get initials from user name
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Use real user data if available, fallback to mock
const user = computed(() => {
  if (currentUser.value) {
    return {
      full_name: currentUser.value.name,
      email: currentUser.value.email,
      avatar_url: currentUser.value.avatarUrl || '',
      job_title: '',
    };
  }
  return mock.value.user;
});
const userInitials = computed(() => getInitials(user.value.full_name));
const userMenuItems = computed(() => menu.value.user);

// Only show avatar image when we have a URL and it hasn't failed to load
const showAvatarImage = computed(() =>
  Boolean(user.value.avatar_url && !avatarError.value),
);
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <Avatar class="h-8 w-8 rounded-lg">
              <AvatarImage
                v-if="showAvatarImage"
                :src="user.avatar_url"
                :alt="user.full_name"
                @loading-status-change="onAvatarStatus"
              />
              <AvatarFallback
                class="rounded-lg bg-primary text-primary-foreground"
              >
                {{ userInitials }}
              </AvatarFallback>
            </Avatar>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-semibold">{{ user.full_name }}</span>
              <span class="truncate text-xs text-muted-foreground">{{
                user.job_title
              }}</span>
            </div>
            <Icon name="lucide:chevrons-up-down" class="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-[--reka-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          side="right"
          align="end"
          :side-offset="4"
        >
          <DropdownMenuLabel class="p-0 font-normal">
            <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar class="h-8 w-8 rounded-lg">
                <AvatarImage
                  v-if="showAvatarImage"
                  :src="user.avatar_url"
                  :alt="user.full_name"
                  @loading-status-change="onAvatarStatus"
                />
                <AvatarFallback
                  class="rounded-lg bg-primary text-primary-foreground"
                >
                  {{ userInitials }}
                </AvatarFallback>
              </Avatar>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">{{ user.full_name }}</span>
                <span class="truncate text-xs text-muted-foreground">{{
                  user.email
                }}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              v-for="item in userMenuItems.slice(0, 3)"
              :key="item.key"
            >
              <Icon :name="item.icon" class="mr-2 h-4 w-4" />
              {{ item.title }}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              v-for="item in userMenuItems.slice(3, 5)"
              :key="item.key"
            >
              <Icon :name="item.icon" class="mr-2 h-4 w-4" />
              {{ item.title }}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="text-destructive focus:text-destructive">
            <Icon :name="userMenuItems[5].icon" class="mr-2 h-4 w-4" />
            {{ userMenuItems[5].title }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
