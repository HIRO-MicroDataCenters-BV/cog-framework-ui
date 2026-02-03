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
                    <span
                      class="w-3 h-3 rounded-full border border-black/20 shadow-sm"
                      :style="{
                        backgroundColor: getCategoryColor(category.name),
                      }"
                    ></span>
                    <span class="capitalize font-semibold text-foreground/80">{{
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
              <div class="grid grid-cols-2 gap-2 px-2 py-1">
                <div
                  v-for="component in category.components"
                  :key="component.id"
                  class="cursor-grab relative group active:cursor-grabbing"
                  draggable="true"
                  @dragstart="onDragStart($event, component)"
                >
                  <!-- Inventory Card -->
                  <div
                    class="p-2 rounded-md border-2 bg-card flex flex-col items-center justify-center gap-2 text-center h-24 mb-1 transition-all duration-100"
                    :style="getPanelStyle(getCategoryColor(category.name))"
                    @mouseover="
                      (e) =>
                        ((e.currentTarget as HTMLElement).style.transform =
                          'translateY(-2px)')
                    "
                    @mouseleave="
                      (e) =>
                        ((e.currentTarget as HTMLElement).style.transform =
                          'translateY(0)')
                    "
                    @mousedown="
                      (e) =>
                        ((e.currentTarget as HTMLElement).style.transform =
                          'translateY(2px)')
                    "
                    @mouseup="
                      (e) =>
                        ((e.currentTarget as HTMLElement).style.transform =
                          'translateY(-2px)')
                    "
                  >
                    <!-- Icon (using generic one since we don't have per-component icon yet) -->
                    <div
                      class="w-8 h-8 rounded bg-background/50 flex items-center justify-center text-foreground/70"
                    >
                      <Icon name="lucide:box" class="w-5 h-5" />
                    </div>
                    <span
                      class="text-[10px] font-bold leading-tight line-clamp-2 px-1"
                      >{{ component.name }}</span
                    >
                  </div>
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
import { useKenneyTheme } from '~/composables/useKenneyTheme';

const api = useApi();
const { getCategoryColor } = useBuilderColors();
const { getPanelStyle } = useKenneyTheme();

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
    console.log('[LibrarySidebar] API response:', res);
    if (res && 'data' in res) {
      components.value = res.data as unknown as Component[];
      console.log(
        '[LibrarySidebar] Loaded',
        components.value.length,
        'components',
      );

      // Debug: Show first component's input_path to verify defaults
      if (components.value.length > 0) {
        const firstComp = components.value[0];
        console.log('[LibrarySidebar] First component:', firstComp.name);
        console.log(
          '[LibrarySidebar] First component input_path:',
          firstComp.input_path,
        );
      }

      categories.value = getCategories(components.value);
      console.log(
        '[LibrarySidebar] Created',
        categories.value.length,
        'categories',
      );
    }
  } catch (error) {
    console.error('[LibrarySidebar] Error fetching components:', error);
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
