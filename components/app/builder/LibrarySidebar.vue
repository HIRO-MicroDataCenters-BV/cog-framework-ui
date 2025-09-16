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
                    <span class="capitalize">{{ category.name }}</span>
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
interface CompoentPath {
  name: string;
  type: string | 'CSV' | 'parquet';
}
interface Component {
  id: string;
  name: string;
  input_path: CompoentPath[];
  output_path: CompoentPath[];
  component_file: string | null;
  category: string | null;
  creator: string | null;
}

interface Category {
  id: string;
  name: string;
  isOpen: boolean;
  components: Component[];
}

const components: Component[] = ref([
  {
    id: 1,
    name: 'Preprocess',
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
    component_file: null,
    category: null,
    creator: null,
  },
  {
    id: 2,
    name: 'process',
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
    component_file: 'process.yaml',
    category: 'preprocess',
    creator: 'admin',
  },
  {
    id: 3,
    name: 'string',
    input_path: [{}],
    output_path: [{}],
    component_file: 'string',
    category: 'string',
    creator: 'string',
  },
  {
    id: 4,
    name: 'Preprocess',
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
    component_file:
      'http://mlflow-minio.kubeflow:9000/mlflow/Preprocess.yaml?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=minio%2F20250916%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250916T080921Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=4965b08816e78add40ccbc190f485652b9e43778363df8b6a8d84b999315b317',
    category: null,
    creator: null,
  },
  {
    id: 5,
    name: 'Preprocess',
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
    component_file:
      'http://mlflow-minio.kubeflow:9000/mlflow/Preprocess.yaml?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=minio%2F20250916%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250916T081110Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=db5644ddf81a181b3109af36cae70226fe159110b4db1c069ff118af26d3137e',
    category: 'training',
    creator: 'sai',
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
  return list.reduce((items, current) => {
    if (items.findIndex((object) => object.id === current.id) === -1) {
      items.push(current);
    }
    return items;
  }, []);
};
const categories = ref(getCategories(components.value));

const emit = defineEmits<{
  dragStart: [component: Component];
}>();

function onDragStart(event: DragEvent, component: Component) {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/json', JSON.stringify(component));
    event.dataTransfer.effectAllowed = 'copy';
  }
  emit('dragStart', component);
}
</script>

<style scoped>
.icon-chevron {
  transition: transform 0.3s;
}
</style>
