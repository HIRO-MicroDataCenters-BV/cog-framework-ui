<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { useSidebar } from '../ui/sidebar';
import NavUser from './NavUser.vue';
import ColorModeSwitch from './ColorModeSwitch.vue';

const { t } = useI18n();
const config = useRuntimeConfig();
const menu = uselistMenus();
const appVersion = config.public.appVersion;
const baseUrl = config.app.baseURL;
// const urlOrigin = window.location.origin;

const route = useRoute();
const query = computed(() => route.query);

const isMainActive = (url: string) => route.path === `/${url}`;
const isSubActive = (url: string) => route.path === `/${url}`;
const isParentActive = (url: string, items: { url: string }[]) =>
  route.path.startsWith(`/${url}`) ||
  items.some((item) => route.path.startsWith(`/${item.url}`));

const isIframe = useStorage(
  'is_iframe',
  query.value.is_iframe === '1',
  localStorage,
);

const { setOpen } = useSidebar();
watch(
  () => query.value.is_iframe,
  (newValue) => {
    isIframe.value = newValue === '1';
  },
  { immediate: true },
);

setOpen(!isIframe.value);

// Theme toggle
const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === 'dark');
const isAnimating = ref(false);

const toggleTheme = () => {
  isAnimating.value = true;
  const value = isDark.value ? 'light' : 'dark';
  colorMode.value = value;
  colorMode.preference = value;
  setTimeout(() => {
    isAnimating.value = false;
  }, 500);
};
</script>

<template>
  <Sidebar collapsible="icon" class="bg-sidebar">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <SidebarMenuButton
                class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground ring-0 outline-none focus-visible:ring-0 focus-visible:outline-none data-[state=open]:ring-0"
                size="lg"
              >
                <div
                  class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
                >
                  <img
                    src="/images/logo.svg"
                    class="size-10 dark:invert"
                    alt="cog-logo"
                  />
                </div>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-semibold">{{
                    t('general.main_project_name')
                  }}</span>
                  <span class="truncate text-xs text-muted-foreground">
                    V {{ appVersion.split('+')[0] }}
                  </span>
                </div>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
    <div class="mx-0 border-t border-border" />
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>{{ t('title.platform') }}</SidebarGroupLabel>
        <SidebarMenu>
          <template v-for="item in menu.main" :key="item.title">
            <SidebarMenuItem v-if="item.items.length === 0">
              <SidebarMenuButton
                as-child
                :is-active="isMainActive(item.url)"
                :tooltip="item.title"
              >
                <NuxtLink :to="`/${item.url}`">
                  <span class="text-lg">
                    <Icon :name="item.icon" />
                  </span>
                  <span>{{ item.title }}</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <Collapsible
              v-else
              as-child
              :default-open="isParentActive(item.url, item.items)"
              class="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger as-child>
                  <SidebarMenuButton
                    :tooltip="item.title"
                  >
                    <div class="flex items-center justify-between w-full">
                      <div class="flex items-center">
                        <span class="text-lg mr-2">
                          <Icon :name="item.icon" />
                        </span>
                        <span>{{ item.title }}</span>
                      </div>
                      <Icon class="icon-chevron" name="lucide:chevron-right" />
                    </div>
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem
                      v-for="subItem in item.items"
                      :key="subItem.title"
                    >
                      <SidebarMenuSubButton
                        as-child
                        :is-active="isSubActive(subItem.url)"
                      >
                        <NuxtLink :to="`/${subItem.url}`">
                          <span>{{ subItem.title }}</span>
                        </NuxtLink>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </template>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
    <div class="mx-0 border-t border-border" />
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem v-for="item in menu.footer" :key="item.key">
          <SidebarMenuButton :tooltip="item.title">
            <span class="text-lg">
              <Icon :name="item.icon" />
            </span>
            <span>{{ item.title }}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            :tooltip="isDark ? 'Light mode' : 'Dark mode'"
            @click="toggleTheme"
          >
            <span class="text-lg">
              <Icon
                :name="isDark ? 'lucide:sun' : 'lucide:moon'"
                :class="{ 'theme-icon-animate': isAnimating }"
              />
            </span>
            <span>{{ isDark ? 'Light Mode' : 'Dark Mode' }}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
    <div class="mx-0 border-t border-border" />
    <SidebarFooter>
      <NavUser />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>

<style scoped>
.icon-chevron {
  transition: transform 0.3s;
}

.group\/collapsible[data-state='open'] .icon-chevron {
  transform: rotate(90deg);
}

.theme-icon-animate {
  animation: theme-rotate 0.5s ease-in-out;
}

@keyframes theme-rotate {
  0% {
    transform: rotate(0deg) scale(1);
  }
  100% {
    transform: rotate(360deg) scale(1);
  }
}
</style>
