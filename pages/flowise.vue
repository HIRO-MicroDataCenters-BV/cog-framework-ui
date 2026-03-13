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

  const isDark =
    document.documentElement.classList.contains('dark') ||
    document.documentElement.dataset.theme === 'dark';

  const darkTheme = {
    chatWindow: {
      showTitle: false,
      showAgentMessages: true,
      welcomeMessage: 'Hello! How can I help you?',
      errorMessage: 'Something went wrong. Please try again.',
      backgroundColor: 'hsl(240 10% 5.9%)',
      fontSize: 14,
      renderHTML: true,
      botMessage: {
        backgroundColor: 'hsl(240 3.7% 15.9%)',
        textColor: 'hsl(240 5% 64.9%)',
        showAvatar: true,
      },
      userMessage: {
        backgroundColor: 'hsl(0 0% 98%)',
        textColor: 'hsl(240 5.9% 10%)',
        showAvatar: true,
      },
      textInput: {
        placeholder: 'Ask anything about your pipelines…',
        backgroundColor: 'hsl(0 0% 12.549%)',
        textColor: 'hsl(0 0% 98%)',
        sendButtonColor: 'hsl(0 0% 98%)',
        autoFocus: true,
      },
      footer: {
        textColor: 'hsl(240 5% 64.9%)',
        text: 'Powered by',
        company: 'Flowise',
        companyLink: 'https://flowiseai.com',
      },
    },
  };

  const lightTheme = {
    chatWindow: {
      showTitle: false,
      showAgentMessages: true,
      welcomeMessage: 'Hello! How can I help you?',
      errorMessage: 'Something went wrong. Please try again.',
      backgroundColor: 'hsl(0 0% 100%)',
      fontSize: 14,
      renderHTML: true,
      botMessage: {
        backgroundColor: 'hsl(240 4.8% 95.9%)',
        textColor: 'hsl(240 3.8% 46.1%)',
        showAvatar: true,
      },
      userMessage: {
        backgroundColor: 'hsl(240 5.9% 10%)',
        textColor: 'hsl(0 0% 98%)',
        showAvatar: true,
      },
      textInput: {
        placeholder: 'Ask anything about your pipelines…',
        backgroundColor: 'hsl(0 0% 100%)',
        textColor: 'hsl(240 10% 3.9%)',
        sendButtonColor: 'hsl(240 5.9% 10%)',
        autoFocus: true,
      },
      footer: {
        textColor: 'hsl(240 3.8% 46.1%)',
        text: 'Powered by',
        company: 'Flowise',
        companyLink: 'https://flowiseai.com',
      },
    },
  };

  // Initialize full-page Flowise chat (renders into <flowise-fullchatbot />)
  Chatbot.initFull({
    chatflowid: 'a5f07387-3b39-4248-a1ae-12f5824cd68a',
    apiHost: 'https://dashboard.cog.hiro-develop.nl/flowise',
    theme: isDark ? darkTheme : lightTheme,
  });
});

onUnmounted(async () => {
  const { default: Chatbot } = await import(
    'https://cdn.jsdelivr.net/npm/flowise-embed@3.0.5/dist/web.js'
  );
  Chatbot.destroy();
});
</script>

<template>
  <div class="h-[calc(100svh-74px)] w-full bg-background flex flex-col">
    <div
      class="flex items-center justify-between gap-2 px-4 py-2 border-b bg-card text-card-foreground"
    >
      <span class="text-sm font-medium">COG Assistant</span>
      <span class="text-xs text-muted-foreground"
        >Ask anything about your pipelines</span
      >
    </div>
    <div class="flex-1">
      <flowise-fullchatbot class="h-full w-full" />
    </div>
  </div>
</template>
