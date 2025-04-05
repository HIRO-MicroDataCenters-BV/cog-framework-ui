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
                  <SidebarMenuSubButton
                    as-child
                    :is-active="step === index"
                    class="navigation-item"
                  >
                    <Button
                      variant="ghost"
                      :disabled="item === 'back'"
                      @click="onSetStep(index)"
                    >
                      <span>
                        <Icon :name="icons[item as keyof typeof icons]" />
                      </span>
                      <span>{{ t(`step.${item}`) }}</span>
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
              v-for="item in props.stepFormActions.length > 0
                ? props.stepFormActions
                : props.actions"
              :key="item"
              :variant="variantByActionType(item)"
              :type="typeByActionType(item)"
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

const props = withDefaults(
  defineProps<{
    open?: boolean;
    type?: string;
    title?: string | null;
    description?: string | null;
    actions?: string[];
    navigation?: string[];
    step?: number;
    stepFormActions?: string[];
  }>(),
  {
    open: false,
    type: 'default',
    title: null,
    description: null,
    step: 0,
    navigation: () => [],
    actions: () => ['cancel', 'save'],
    stepFormActions: () => [],
  }
);

const _EVENT_TYPES = [
  'on-close',
  'on-save',
  'on-delete',
  'on-action',
  'on-back',
  'on-next',
  'on-set-step',
  'on-confirm-add',
] as const;

type EventType = (typeof _EVENT_TYPES)[number];

const emit = defineEmits<{
  (
    e:
      | 'on-close'
      | 'on-save'
      | 'on-delete'
      | 'on-action'
      | 'on-back'
      | 'on-next'
      | 'on-confirm-add',
    value: string | number | boolean
  ): void;
  (e: 'on-set-step', value: number): void;
}>();

const open = ref(props.open);
const step = ref(props.step);

const icons = {
  type: 'lucide:shapes',
  metadata: 'lucide:text',
  source_settings: 'lucide:settings-2',
  review: 'lucide:circle-check',
};

watch(
  () => props.open,
  (value) => {
    open.value = value;
  }
);

watch(
  () => props.step,
  (value) => {
    step.value = value;
  }
);

const onAction = async (action: string) => {
  const name = `on-${action}` as EventType;

  if (name === 'on-set-step') {
    emit(name, 0);
  } else {
    emit(name as Exclude<EventType, 'on-set-step'>, false);
  }

  if (action === 'cancel' || action === 'close') {
    emit('on-close', false);
  }
};

const onSetStep = async (index: number) => {
  emit('on-set-step', index);
  step.value = index;
};
const onClose = async () => {
  emit('on-close', false);
  return true;
};

const variantByActionType = (name: string) => {
  switch (name) {
    case 'close':
      return 'outline';
    case 'back':
      return 'outline';
    case 'cancel':
      return 'outline';
    case 'delete':
      return 'destructive';
    default:
      return 'default';
  }
};

const typeByActionType = (name: string) => {
  switch (name) {
    case 'save':
      return 'submit';
    default:
      return 'button';
  }
};
</script>

<style>
/*
.navigation-item {
  @apply font-light items-center;
}
.navigation-item[data-active='true'] {
  @apply font-medium;
}
  */
</style>
