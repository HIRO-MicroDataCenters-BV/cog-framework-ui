<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { useSidebar } from '../ui/sidebar';
import NavUser from './NavUser.vue';

const { t } = useI18n();
const config = useRuntimeConfig();
const menu = uselistMenus();
const appVersion = config.public.appVersion;
const baseUrl = config.app.baseURL;
// const urlOrigin = window.location.origin;

const route = useRoute();
const query = computed(() => route.query);

const isActive = (url: string) => {
  return route.path.startsWith(`/${url}`);
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
</script>

<template>
  <Sidebar collapsible="icon" class="bg-white">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <SidebarMenuButton
                class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                size="lg"
              >
                <div
                  class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
                >
                  <img src="/images/logo.svg" class="size-10" alt="cog-logo" />
                </div>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-semibold">{{
                    t('general.main_project_name')
                  }}</span>
                  <span class="truncate text-xs text-muted-foreground"
                    >V {{ appVersion }}</span
                  >
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
                :is-active="isActive(item.url)"
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
              :default-open="isActive(item.url)"
              class="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger as-child>
                  <SidebarMenuButton
                    :tooltip="item.title"
                    :is-active="isActive(item.url)"
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
                      <SidebarMenuSubButton as-child>
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
      </SidebarMenu>
      <NavUser />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>

<style scoped>
.icon-chevron {
  transition: transform 0.3s;
}
</style>
