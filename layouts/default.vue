<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <AppContent>
        <AppHeader />
        <div class="flex flex-1 flex-col gap-4 h-full">
          <div class="h-full flex flex-col flex-grow">
            <div class="px-4">
              <h1 class="text-lg font-semibold mb-4">
                {{ t(`subtitle.${page.section}`) }}
              </h1>
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
