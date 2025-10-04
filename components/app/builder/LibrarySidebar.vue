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

const components = ref<Component[]>([
  {
    id: 7,
    name: 'component_id1',
    input_path: [
      {
        name: 'file',
        type: 'CSV',
      },
    ],
    output_path: [
      {
        name: 'output',
        type: 'parquet',
      },
    ],
    component_file: '/component_id1.yaml',
    category: 'download',
    creator: 'Sai',
  },
  {
    id: 8,
    name: 'component_id2',
    input_path: [
      {
        name: 'file',
        type: 'parquet',
      },
    ],
    output_path: [
      {
        name: 'Output',
        type: 'string',
      },
    ],
    component_file: '/component_id2.yaml',
    category: 'pre-process',
    creator: '',
  },
  {
    id: 9,
    name: 'component_id3',
    input_path: [
      {
        name: 'input',
        type: 'string',
      },
    ],
    output_path: [
      {
        name: 'comp_output',
        type: 'string',
      },
    ],
    component_file: '/component_id3.yaml',
    category: 'training',
    creator: '',
  },
  {
    id: 10,
    name: 'component_id4',
    input_path: [
      {
        name: 'input',
        type: 'string',
      },
      {
        name: 'output',
        type: 'parquet',
      },
      {
        name: 'comp_uri',
        type: 'string',
      },
    ],
    output_path: [
      {
        name: 'comp_output',
        type: 'string',
      },
    ],
    component_file: '/component_id4.yaml',
    category: 'serving',
    creator: '',
  },
  {
    id: 11,
    name: 'adder',
    input_path: [
      {
        name: 'number1',
        type: 'int',
      },
      {
        name: 'number2',
        type: 'int',
      },
      {
        name: 'operation',
        type: 'string',
      },
    ],
    output_path: [
      {
        name: 'scale',
        type: 'string',
      },
      {
        name: 'outnum',
        type: 'long',
      },
    ],
    component_file: '/adder.yaml',
    category: 'operators',
    creator: 'ali',
  },
  {
    id: 12,
    name: 'A',
    input_path: [
      {
        name: 'number',
        type: 'int',
      },
    ],
    output_path: [
      {
        name: 'number',
        type: 'int',
      },
    ],
    component_file: '/a.yaml',
    category: 'variables',
    creator: '',
  },
  {
    id: 13,
    name: 'B',
    input_path: [
      {
        name: 'number',
        type: 'int',
      },
    ],
    output_path: [
      {
        name: 'number',
        type: 'int',
      },
    ],
    component_file: '/b.yaml',
    category: 'variables',
    creator: '',
  },
]);

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
  if (res) {
    components.value = res as unknown as Component[];
    categories.value = getCategories(components.value);
    console.log('components', components.value);
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
