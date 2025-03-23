<template>
  <Dialog :open="open" @update:open="onClose">
    <DialogContent>
      <SidebarProvider
        style="--sidebar-width: 10rem; --sidebar-width-mobile: 10rem"
      >
        <Sidebar v-if="props.navigation.length > 0" class="pb-4" height="auto">
          <SidebarHeader>
            <DialogHeader>
              <DialogTitle>{{ props.title }}</DialogTitle>
            </DialogHeader>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem
                  v-for="(item, index) in props.navigation"
                  :key="item"
                >
                  <SidebarMenuSubButton as-child :is-active="step === index">
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
        </SidebarInset>
      </SidebarProvider>
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
      type?: string;
      title?: string | null;
      description?: string | null;
      actions?: string[];
      navigation?: string[];
      step?: number;
    } & ActionHandlers
  >(),
  {
    open: false,
    type: 'default',
    title: null,
    description: null,
    step: 0,
    navigation: () => [],
    actions: () => ['cancel', 'save'],
    onAction: async () => true,
    onCancel: async () => true,
    onDelete: async () => true,
    onNext: async () => true,
    onBack: async () => true,
  },
);

const emit = defineEmits<{
  (e: 'on-close'): void;
}>();

const open = ref(props.open);

const step = ref(props.step);

watch(
  () => props.open,
  (value) => {
    open.value = value;
  },
);

watch(
  () => step,
  (value) => {
    console.log('inner', step, value);
    //open.value = value;
  },
);

const onAction = async (action: string) => {
  console.log('onAction', action);
  const name =
    `on${action.charAt(0).toUpperCase()}${action.slice(1)}` as keyof ActionHandlers;
  console.log(name, props[name], props);
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
    case 'close':
      return 'outline';
      break;
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
