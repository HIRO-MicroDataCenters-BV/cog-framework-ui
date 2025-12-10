<template>
  <SidebarProvider class="sidebar-wrapper">
    <AppSidebar />
    <SidebarInset class="overflow-hidden overflow-y-auto">
      <AppHeader v-if="page.title !== '' || page.section === 'pipelines_builder'" :page="page" />
      <AppContent>
        <div class="flex flex-1 flex-col gap-4 h-full">
          <div class="h-full flex flex-col flex-grow">
            <div class="px-4">
              <h1 v-if="page.title != ''" class="text-lg font-semibold mb-4">
                <template v-if="page.title == ''">{{
                  t(`subtitle.${page.section}`)
                }}</template>
                <!-- <template v-else>{{ page.title }}</template> -->
              </h1>
            </div>
            <slot />
          </div>
        </div>
      </AppContent>
    </SidebarInset>

    <!-- Global loading spinner -->
    <div
      v-if="page.isLoading"
      class="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg"
    >
      <Spinner class="size-4" />
      <span class="text-sm text-gray-600 dark:text-gray-300">{{
        t('hint.loading')
      }}</span>
    </div>
  </SidebarProvider>
</template>

<script lang="ts" setup>
import { Spinner } from '@/components/ui/spinner';

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
