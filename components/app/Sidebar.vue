<script setup lang="ts">
const config = useRuntimeConfig();
const menu = uselistMenus();
const version = config.public.appVersion;
</script>

<template>
  <Sidebar collapsible="icon">
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
                    $t('general.project_name')
                  }}</span>
                  <span class="truncate text-xs">{{ version }}</span>
                </div>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>{{ $t('title.platform') }}</SidebarGroupLabel>
        <SidebarMenu>
          <Collapsible
            v-for="item in menu.main"
            :key="item.title"
            as-child
            :default-open="item.isActive"
            class="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger as-child>
                <SidebarMenuButton :tooltip="item.title">
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
                      <a :href="subItem.url">
                        <span>{{ subItem.title }}</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
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
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>

<style scoped>
.icon-chevron {
  transition: transform 0.3s;
}

[data-state='open'] .icon-chevron {
  @apply rotate-90;
}
</style>
