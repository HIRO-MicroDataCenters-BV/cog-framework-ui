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

// Infra Dashboard lives at the bare origin (e.g. https://dashboard.cog.hiro-develop.nl/).
// Our UI is mounted under a context path (/uidev or /cogui), so strip the path
// by using only the origin from the current request URL.
const infraDashboardUrl = computed(() => useRequestURL().origin);

const route = useRoute();
const query = computed(() => route.query);

const isParentActive = (url: string, items: { url: string }[]) =>
  route.path.startsWith(`/${url}`) ||
  items.some((item) => route.path.startsWith(`/${item.url}`));

const isMainActive = (url: string, hasChildren: boolean) => {
  // For menus with children (like Pipelines), don't highlight the parent,
  // only the sub-items should show an active state.
  if (hasChildren) return false;
  return route.path.startsWith(`/${url}`);
};

const isSubActive = (subUrl: string) => {
  const fullPath = route.path;

  // Special handling for Pipelines "Runs" vs "Builder" / "Experiments":
  // run detail pages (e.g. /pipelines/<run-id>) don't match any sub-url
  // explicitly, so treat bare `/pipelines/...` (that is not builder or
  // experiments) as "Runs".
  if (subUrl === 'pipelines/run') {
    return (
      fullPath.startsWith('/pipelines/run') ||
      (fullPath.startsWith('/pipelines') &&
        !fullPath.startsWith('/pipelines/builder') &&
        !fullPath.startsWith('/pipelines/experiments') &&
        !fullPath.startsWith('/pipelines/run'))
    );
  }

  return fullPath.startsWith(`/${subUrl}`);
};

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
                :is-active="isMainActive(item.url, false)"
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
                    :is-active="isMainActive(item.url, item.items.length > 0)"
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
                          <Icon
                            v-if="subItem.icon"
                            :name="subItem.icon"
                            class="w-4 h-4 mr-2"
                          />
                          <span>{{ subItem.title }}</span>
                        </NuxtLink>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </template>

          <SidebarMenuItem>
            <SidebarMenuButton as-child :tooltip="t('menu.infra_dashboard')">
              <a
                :href="infraDashboardUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span class="text-lg">
                  <Icon name="lucide:layout-dashboard" />
                </span>
                <span>{{ t('menu.infra_dashboard') }}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
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
