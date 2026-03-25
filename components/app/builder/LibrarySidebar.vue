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
                  <span class="text-sm flex-1">{{ component.name }}</span>
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
import type { Component, Category } from '~/types/builder.types';
import { useBuilderColors } from '~/composables/useBuilderColors';

const api = useApi();
const { getCategoryColor } = useBuilderColors();

const components = ref<Component[]>([]);

const getCategories = (items: Component[]) => {
  const list = items.map((item, index) => {
    return {
      id: item.category ?? `category-empty`,
      name: item.category,
      isOpen: item.category ? false : true,
      components: components.value.filter(
        (component: Component) => component.category == item.category,
      ),
    };
  });
  return list.reduce((items: Category[], current) => {
    if (items.findIndex((object) => object.id === current.id) === -1) {
      items.push(current as Category);
    }
    return items;
  }, [] as Category[]);
};
const categories = ref(getCategories(components.value));

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
  console.log('onMounted');
  fetchComponents();
});

const fetchComponents = async () => {
  console.log('[LibrarySidebar] Fetching components...');
  try {
    const res = await api.getTrainingBuilderComponents();
    if (res && 'data' in res) {
      components.value = res.data as unknown as Component[];

      // Debug: Show first component's input_path to verify defaults
      if (components.value.length > 0) {
        const firstComp = components.value[0];
      }

      categories.value = getCategories(components.value);
    }
  } catch (error) {
    // Toast is shown by API layer, just set empty arrays
    components.value = [];
    categories.value = [];
  }
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
