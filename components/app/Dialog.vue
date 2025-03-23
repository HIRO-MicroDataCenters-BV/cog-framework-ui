<template>
  <Dialog :open="open" @update:open="onClose">
    <DialogContent>
      <SidebarProvider>
        <Sidebar v-if="props.navigation.length > 0" height="auto" class="pb-4">
          <SidebarHeader>
            <DialogHeader>
              <DialogTitle>{{ props.title }}</DialogTitle>
            </DialogHeader>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem v-for="item in props.navigation" :key="item">
                  <SidebarMenuSubButton as-child>
                    <Button
                      variant="ghost"
                      :disabled="item === 'back'"
                      @click="onAction(item)"
                    >
                      {{ t(`step.${item}`) }}
                    </Button>
                  </SidebarMenuSubButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <slot />
        </SidebarInset>
      </SidebarProvider>
      <DialogFooter>
        <Button
          v-for="item in props.actions"
          :key="item"
          :variant="variantByType(item)"
          @click="onAction(item)"
        >
          {{ t(`action.${item}`) }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
const { t } = useI18n();

interface ActionHandlers {
  [key: `on${Capitalize<string>}`]: () => Promise<boolean>;
}

const props = withDefaults(
  defineProps<
    {
      open?: boolean;
      sidebarMenu?: string[] | null;
      type?: string;
      title?: string | null;
      description?: string | null;
      actions?: string[];
      navigation?: string[];
    } & ActionHandlers
  >(),
  {
    open: false,
    sidebarMenu: () => [],
    type: 'default',
    title: null,
    description: null,
    navigation: () => [],
    actions: () => ['cancel', 'save'],
    onAction: async () => true,
    onCancel: async () => true,
    onDelete: async () => true,
    onNext: async () => true,
    onBack: async () => true,
  },
);

console.log(props.title);

const emit = defineEmits<{
  (e: 'on-close'): void;
}>();

const open = ref(props.open);
watch(
  () => props.open,
  (value) => {
    open.value = value;
  },
);
const onAction = async (action: string) => {
  const name =
    `on${action.charAt(0).toUpperCase()}${action.slice(1)}` as keyof ActionHandlers;
  if (name in props) {
    const res = await props[name]();
    if (res) {
      emit('on-close');
    }
  }
  if (action === 'cancel') {
    emit('on-close');
  }
};
const onClose = async () => {
  emit('on-close');
  return true;
};

const variantByType = (name: string) => {
  switch (name) {
    case 'cancel':
      return 'outline';
    case 'delete':
      return 'destructive';
    default:
      return 'default';
  }
};
</script>

<style></style>
