<template>
  <AppDialog
    :open="open"
    @on-close="async () => emit('on-close')"
    :navigation="navigation"
    :title="t('title.add_dataset')"
    >content</AppDialog
  >
</template>

<script lang="ts" setup>
const { t } = useI18n();
const props = withDefaults(
  defineProps<{
    open?: boolean;
  }>(),
  {
    open: false,
  },
);

const open = ref(props.open);
watch(
  () => props.open,
  (value) => {
    open.value = value;
  },
);

const emit = defineEmits<{
  (e: 'on-close'): void;
}>();

const step = ref(0);

const navigation = ref(['type', 'metadata', 'source_settings', 'review']);
</script>

<style></style>
