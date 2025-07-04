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
                <template v-if="page.title == ''">{{
                  t(`subtitle.${page.section}`)
                  }}</template>
                <template v-else>{{ page.title }}</template>
              </h1>
              <p v-if="page.subtitle != ''" class="text-sm text-gray-500 mb-4">
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
