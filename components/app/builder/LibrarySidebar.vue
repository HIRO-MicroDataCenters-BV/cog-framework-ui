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
              <SidebarMenuButton class="mb-2">
                <div class="flex items-center justify-between w-full">
                  <div class="flex items-center">
                    <span class="text-lg mr-2">
                      <Icon name="lucide:folder" />
                    </span>
                    <span class="capitalize">{{
                      category.name || $t('label.no_category')
                    }}</span>
                  </div>
                  <span
                    class="icon-chevron transition-transform duration-200 ease-out"
                    :class="open ? 'rotate-90' : ''"
                  >
                    <Icon name="lucide:chevron-right" />
                  </span>
                </div>
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub class="p-0 m-0 border-l-0">
                <SidebarMenuSubItem
                  v-for="component in category.components"
                  :key="component.id"
                >
                  <SidebarMenuSubButton
                    as-child
                    class="cursor-grab p-2 py-4 bg-gray-50 mx-2"
                    draggable="true"
                    @dragstart="onDragStart($event, component)"
                  >
                    <div class="flex items-center gap-2">
                      <Icon name="lucide:grip-vertical" class="w-4 h-4" />
                      <span>{{ component.name }}</span>
                    </div>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      </template>
    </SidebarMenu>
  </SidebarGroup>
</template>

<script setup lang="ts">
import type { Component, Category } from '~/types/builder.types';

const api = useApi();

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
  console.log('fetchComponents');
  const res = await api.getTrainingBuilderComponents();
  console.log('res', res);
  if (res && 'data' in res) {
    components.value = res.data as unknown as Component[];
    console.log('components', components.value);
    categories.value = getCategories(components.value);
    console.log('categories', categories.value);
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
