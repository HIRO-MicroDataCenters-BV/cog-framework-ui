<template>
  <Dialog :open="open" @update:open="onClose">
    <DialogContent class="overflow-hidden h-138 max-h-full">
      <SidebarProvider
        style="
          --sidebar-width: 10rem;
          --sidebar-width-mobile: 10rem;
          --height: auto;
        "
      >
        <Sidebar v-if="props.navigation.length > 0" class="pb-4">
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
            <div class="flex gap-2 w-full">
              <div class="flex-1">
                <DialogClose as-child>
                  <Button type="button" variant="outline">
                    {{ t(`action.close`) }}
                  </Button>
                </DialogClose>
              </div>
              <div class="flex gap-2">
                <Button
                  v-for="item in props.stepFormActions.length > 0
                    ? props.stepFormActions
                    : props.actions"
                  :key="item"
                  :variant="variantByActionType(item)"
                  :type="typeByActionType(item, step)"
                  @click="onAction(item)"
                >
                  {{ t(`action.${item}`) }}
                </Button>
              </div>
            </div>
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
  },
);

const _EVENT_TYPES = [
  'on-close',
  'on-save',
  'on-action',
  'on-back',
  'on-next',
  'on-set-step',
  'on-submit',
] as const;

type EventType = (typeof _EVENT_TYPES)[number];

const emit = defineEmits<{
  (
    e:
      | 'on-close'
      | 'on-save'
      | 'on-action'
      | 'on-back'
      | 'on-next'
      | 'on-set-step'
      | 'on-submit',
    value: string | number | boolean,
  ): void;
  (e: 'on-set-step', value: number): void;
}>();

const open = ref(props.open);
const step = ref(props.step);

const icons = {
  type: 'lucide:shapes',
  metadata: 'lucide:text',
  source_settings: 'lucide:settings-2',
  file: 'lucide:file',
  datastream: 'lucide:database',
  review: 'lucide:circle-check',
};

watch(
  () => props.open,
  (value) => {
    open.value = value;
  },
);

watch(
  () => props.step,
  (value) => {
    step.value = value;
  },
);

const onAction = async (action: string | number | boolean) => {
  const name = `on-${action}` as EventType;
  emit('on-action', action);
  console.log('foo', name);
  switch (action) {
    case 'back':
      step.value--;
      emit('on-set-step', step.value);
      break;
    case 'next':
      step.value++;
      emit('on-set-step', step.value);
      break;
    default:
      emit(name, name === 'on-set-step' ? 0 : action);
      break;
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
    case 'back':
    case 'cancel':
      return 'outline';
    case 'next':
    case 'submit':
      return 'default';
    default:
      return 'default';
  }
};
const typeByActionType = (name: string, currentStep = step.value) => {
  switch (name) {
    case 'sumbit':
      return 'submit';
    default:
      return 'button';
  }
};
</script>

<style>
.navigation-item {
  @apply items-center;
  font-weight: 300;
}

.navigation-item[data-active='true'] {
  font-weight: 700;
}
</style>
