<template>
  <Dialog :open="open" @update:open="onClose">
    <DialogContent>
      <DialogHeader>
        <DialogTitle v-if="props.title">{{ props.title }}</DialogTitle>
        <DialogDescription v-if="props.description">
          {{ props.description }}
        </DialogDescription>
      </DialogHeader>
      <div>
        <slot />
      </div>
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
      type?: string;
      title?: string | null;
      description?: string | null;
      actions?: string[];
    } & ActionHandlers
  >(),
  {
    open: false,
    type: 'default',
    title: null,
    description: null,
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
