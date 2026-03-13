<script setup lang="ts">
const { setPage } = useApp();

setPage({
  section: 'flowise',
});

onMounted(async () => {
  // Use the official CDN ESM bundle, client-side only
  const { default: Chatbot } = await import(
    'https://cdn.jsdelivr.net/npm/flowise-embed@3.0.5/dist/web.js'
  );

  // Popup/bubble bot only while on /flowise
  Chatbot.init({
    chatflowid: 'a5f07387-3b39-4248-a1ae-12f5824cd68a',
    apiHost: 'https://dashboard.cog.hiro-develop.nl/flowise',
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
      src="https://dashboard.cog.hiro-develop.nl/flowise/"
      title="Flowise Canvas"
      class="w-full h-full border-0"
      referrerpolicy="no-referrer"
    />
  </div>
</template>
