<script setup lang="ts">
const { setPage } = useApp();
const config = useRuntimeConfig();

const flowiseHost = computed(() =>
  String(config.public.flowiseHost || '').replace(/\/+$/, ''),
);
const flowiseChatflowId = computed(() =>
  String(config.public.flowiseChatflowId || ''),
);
const flowiseCanvasUrl = computed(() =>
  flowiseHost.value ? `${flowiseHost.value}/flowise/` : '',
);

setPage({
  section: 'flowise',
});

onMounted(async () => {
  if (!flowiseHost.value || !flowiseChatflowId.value) return;

  // Use the official CDN ESM bundle, client-side only
  const { default: Chatbot } = await import(
    'https://cdn.jsdelivr.net/npm/flowise-embed@3.0.5/dist/web.js'
  );

  // Popup/bubble bot only while on /flowise
  Chatbot.init({
    chatflowid: flowiseChatflowId.value,
    apiHost: `${flowiseHost.value}/flowise`,
    theme: {
      button: {
        // make sure it floats above the canvas iframe
        zIndex: 2147483647,
        right: 24,
        bottom: 24,
      },
    },
  });
});

onUnmounted(async () => {
  if (!flowiseHost.value || !flowiseChatflowId.value) return;

  // Clean up the bot when leaving /flowise
  const { default: Chatbot } = await import(
    'https://cdn.jsdelivr.net/npm/flowise-embed@3.0.5/dist/web.js'
  );
  Chatbot.destroy();
});
</script>

<template>
  <div class="h-[calc(100svh-74px)] w-full bg-background">
    <iframe
      v-if="flowiseCanvasUrl"
      :src="flowiseCanvasUrl"
      title="Flowise Canvas"
      class="w-full h-full border-0"
      referrerpolicy="strict-origin-when-cross-origin"
      sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-downloads"
    />
    <div
      v-else
      class="h-full w-full flex items-center justify-center text-sm text-muted-foreground"
    >
      Configure `NUXT_PUBLIC_FLOWISE_HOST` and
      `NUXT_PUBLIC_FLOWISE_CHATFLOW_ID`.
    </div>
  </div>
</template>
