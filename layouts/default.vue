<template>
  <SidebarProvider class="sidebar-wrapper">
    <AppSidebar />
    <SidebarInset class="overflow-hidden flex flex-col">
      <AppHeader
        v-if="page.title !== '' || page.section === 'pipelines_builder'"
        :page="page"
        class="flex-shrink-0"
      />
      <AppContent class="flex-1 overflow-hidden">
        <div class="flex flex-col h-full">
          <div class="h-full flex flex-col">
            <div class="px-4 flex-shrink-0">
              <h1 v-if="page.title != ''" class="text-lg font-semibold mb-4">
                <template v-if="page.title == ''">{{
                  t(`subtitle.${page.section}`)
                }}</template>
                <!-- <template v-else>{{ page.title }}</template> -->
              </h1>
            </div>
            <div class="flex-1 overflow-hidden">
              <slot />
            </div>
          </div>
        </div>
      </AppContent>
    </SidebarInset>

    <!-- Global Loading Progress Bar -->
    <AppLoadingBar :is-loading="page.isLoading" />
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
