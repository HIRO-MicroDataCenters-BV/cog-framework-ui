<template>
  <div class="h-[calc(100svh-64px)]">
    <AppBuilder :readonly="false" />
  </div>
</template>

<script lang="ts" setup>
const route = useRoute();
const { setPage, page } = useApp();

// Get order_id from query params (for federated pipeline from dataspace)
const orderId = computed(() => route.query.order_id as string | undefined);

// Watch order_id and update page data reactively
// immediate: true ensures it runs on mount with current value
watch(
  orderId,
  (newOrderId) => {
    setPage({
      section: 'pipelines_builder',
      data: {
        builder: {
          name: '',
          nodes: [],
          edges: [],
        },
        orderId: newOrderId,
      },
    });
  },
  { immediate: true },
);
</script>

<style></style>
