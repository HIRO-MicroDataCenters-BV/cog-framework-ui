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
                    <span>{{ $t(`builder.categories.${category.id}`) }}</span>
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
interface Component {
  id: string;
  name: string;
  type: 'input' | 'processing' | 'output';
}

interface Category {
  id: string;
  name: string;
  isOpen: boolean;
  components: Component[];
}

const categories: Category[] = [
  {
    id: 'inputs',
    name: 'Inputs',
    isOpen: true,
    components: [
      {
        id: 'data-source',
        name: 'Data Source',
        type: 'input',
      },
      {
        id: 'file-input',
        name: 'File Input',
        type: 'input',
      },
      {
        id: 'api-input',
        name: 'API Input',
        type: 'input',
      },
    ],
  },
  {
    id: 'processing',
    name: 'Processing',
    isOpen: true,
    components: [
      {
        id: 'filter',
        name: 'Filter',
        type: 'processing',
      },
      {
        id: 'transform',
        name: 'Transform',
        type: 'processing',
      },
      {
        id: 'aggregate',
        name: 'Aggregate',
        type: 'processing',
      },
      {
        id: 'join',
        name: 'Join',
        type: 'processing',
      },
    ],
  },
  {
    id: 'outputs',
    name: 'Outputs',
    isOpen: true,
    components: [
      {
        id: 'data-sink',
        name: 'Data Sink',
        type: 'output',
      },
      {
        id: 'file-output',
        name: 'File Output',
        type: 'output',
      },
      {
        id: 'api-output',
        name: 'API Output',
        type: 'output',
      },
    ],
  },
];

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
