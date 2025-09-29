<template>
  <SidebarProvider class="sidebar-wrapper">
    <AppSidebar />
    <SidebarInset class="overflow-hidden">
      <AppContent>
        <AppHeader />
        <div class="flex flex-1 flex-col gap-4 h-full">
          <div class="h-full flex flex-col flex-grow">
            <div class="px-4">
              <h1 v-if="page.title != ''" class="text-lg font-semibold mb-4">
                <template v-if="page.title == ''">{{
                  t(`subtitle.${page.section}`)
                }}</template>
                <template v-else>{{ page.title }}</template>
              </h1>
              <p v-if="page.subtitle != ''" class="text-sm text-gray-500">
                {{ page.subtitle }}
              </p>
            </div>
            <slot />
          </div>
        </div>
      </AppContent>
    </SidebarInset>
  </SidebarProvider>
</template>

<script lang="ts" setup>
const { t } = useI18n();
const { page } = useApp();
</script>

<style>
.sidebar-wrapper {
  overflow: hidden;
  width: 100%;
  height: 100svh;
}
</style>
