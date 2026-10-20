<template>
  <SidebarGroup class="p-0">
    <SidebarMenu class="p-0 m-0">
      <template v-for="category in categories" :key="category.id">
        <Collapsible
          v-slot="{ open }"
          as-child
          :default-open="category.isOpen"
          class="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger as-child>
              <SidebarMenuButton class="mb-2 w-full">
                <div class="flex items-center justify-between w-full">
                  <div class="flex items-center gap-2">
                    <Icon
                      name="lucide:folder"
                      class="w-4 h-4 text-muted-foreground"
                    />
                    <span class="text-sm">{{
                      category.name || $t('label.no_category')
                    }}</span>
                  </div>
                  <span
                    class="icon-chevron transition-transform duration-200 ease-out text-muted-foreground"
                    :class="open ? 'rotate-90' : ''"
                  >
                    <Icon name="lucide:chevron-right" class="w-4 h-4" />
                  </span>
                </div>
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div class="space-y-0.5 px-2 py-1">
                <div
                  v-for="component in category.components"
                  :key="component.id"
                  class="group cursor-all-scroll flex items-center gap-2 px-2 py-1.5 rounded-md transition-all duration-200 hover:bg-muted hover:shadow-sm hover:scale-[1.02] active:scale-100 border border-transparent hover:border-border"
                  draggable="true"
                  @dragstart="onDragStart($event, component)"
                >
                  <Icon
                    name="lucide:grip-vertical"
                    class="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 -ml-1"
                  />
                  <Icon
                    name="lucide:box"
                    class="w-4 h-4 text-muted-foreground"
                  />
                  <span
                    class="text-sm flex-1"
                    :title="component.description || undefined"
                    >{{ component.name }}</span
                  >
                  <span
                    v-if="isPlatformComponent(component)"
                    class="text-[10px] uppercase tracking-wide text-muted-foreground"
                    :title="$t('label.platform_component')"
                    >{{ component.creator }}</span
                  >
                  <Icon
                    name="lucide:arrow-right"
                    class="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-50 transition-opacity duration-200"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      </template>
    </SidebarMenu>
  </SidebarGroup>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { Component, Category } from '~/types/canvas.types';
import {
  fetchAllComponents,
  getCategories,
  isPlatformComponent,
  type ComponentsPage,
} from '~/utils/builderLibrary';

const api = useApi();

const components = ref<Component[]>([]);
const categories = ref<Category[]>([]);

const emit = defineEmits<{
  dragStart: [component: Component];
}>();

const onDragStart = (event: DragEvent, component: Component) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/json', JSON.stringify(component));
    event.dataTransfer.effectAllowed = 'copy';
  }
  emit('dragStart', component);
};

onMounted(() => {
  fetchComponents();
});

/**
 * Load the whole catalog. The API pages the list (10 rows by default), so a
 * single request would hide every component past the first page.
 */
const fetchComponents = async () => {
  try {
    components.value = await fetchAllComponents(
      // The endpoint returns the generic API envelope (or null on failure);
      // this is the one place that reads it as a component catalog page.
      async (page, limit) =>
        (await api.getTrainingBuilderComponents({
          page,
          limit,
        })) as ComponentsPage | null,
    );
  } catch {
    // Toast is shown by the API layer; show an empty library.
    components.value = [];
  }
  categories.value = getCategories(components.value);
};

defineExpose({
  fetchComponents,
});
</script>

<style scoped>
.icon-chevron {
  transition: transform 0.3s;
}
</style>
