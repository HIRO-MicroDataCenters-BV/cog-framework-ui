<template>
  <header
    class="border-b flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12"
  >
    <div class="flex items-center gap-2 px-4 justify-between w-full">
      <div class="flex items-center gap-2">
        <SidebarTrigger class="-ml-1" />
        <Separator orientation="vertical" class="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem class="hidden md:block">
              <BreadcrumbLink href="../">
                {{ $t(`menu.${page.section}`) }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <template v-if="page.title != ''">
              <BreadcrumbSeparator />
              <BreadcrumbItem class="hidden md:block">{{
                page.title
              }}</BreadcrumbItem>
            </template>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div class="flex items-center gap-2 ml-auto">
        <div v-if="page.section == 'pipelines_builder'">
          <Button @click="runPipeline"
            ><Icon name="lucide:play" class="w-4 h-4" /><span>{{
              $t('action.run')
            }}</span></Button
          >
        </div>
        <!-- <AppColorModeSwitch /> -->
      </div>
    </div>
  </header>
</template>

<script lang="ts" setup>
const { page } = useApp();

const runPipeline = () => {
  console.log('runPipeline');
  const id = 1;
  navigateTo(`/pipelines/${id}`);
};
</script>

<style></style>
