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
      showTitle: true,
      showAgentMessages: true,
      title: 'Flowise Bot',
      welcomeMessage: 'Hello! How can I help you?',
      errorMessage: 'Something went wrong. Please try again.',
      // from --background in .dark (tailwind.css)
      backgroundColor: 'hsl(240 10% 5.9%)',
      fontSize: 14,
      renderHTML: true,
      botMessage: {
        // from --muted in .dark
        backgroundColor: 'hsl(240 3.7% 15.9%)',
        // from --muted-foreground in .dark
        textColor: 'hsl(240 5% 64.9%)',
        showAvatar: true,
      },
      userMessage: {
        // from --primary in .dark
        backgroundColor: 'hsl(0 0% 98%)',
        // from --primary-foreground in .dark
        textColor: 'hsl(240 5.9% 10%)',
        showAvatar: true,
      },
      textInput: {
        placeholder: 'Ask anything about your pipelines…',
        // from --card in .dark
        backgroundColor: 'hsl(0 0% 12.549%)',
        // from --foreground in .dark
        textColor: 'hsl(0 0% 98%)',
        // from --primary in .dark
        sendButtonColor: 'hsl(0 0% 98%)',
        autoFocus: true,
      },
      footer: {
        // from --muted-foreground in .dark
        textColor: 'hsl(240 5% 64.9%)',
        text: 'Powered by',
        company: 'Flowise',
        companyLink: 'https://flowiseai.com',
      },
    },
  };

  const lightTheme = {
    chatWindow: {
      showTitle: true,
      showAgentMessages: true,
      title: 'Flowise Bot',
      welcomeMessage: 'Hello! How can I help you?',
      errorMessage: 'Something went wrong. Please try again.',
      // from --background in :root (tailwind.css)
      backgroundColor: 'hsl(0 0% 100%)',
      fontSize: 14,
      renderHTML: true,
      botMessage: {
        // from --muted in :root
        backgroundColor: 'hsl(240 4.8% 95.9%)',
        // from --muted-foreground in :root
        textColor: 'hsl(240 3.8% 46.1%)',
        showAvatar: true,
      },
      userMessage: {
        // from --primary in :root
        backgroundColor: 'hsl(240 5.9% 10%)',
        // from --primary-foreground in :root
        textColor: 'hsl(0 0% 98%)',
        showAvatar: true,
      },
      textInput: {
        placeholder: 'Ask anything about your pipelines…',
        // from --card in :root
        backgroundColor: 'hsl(0 0% 100%)',
        // from --foreground in :root
        textColor: 'hsl(240 10% 3.9%)',
        // from --primary in :root
        sendButtonColor: 'hsl(240 5.9% 10%)',
        autoFocus: true,
      },
      footer: {
        // from --muted-foreground in :root
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
  <div
    class="h-[calc(100svh-74px)] w-full bg-background"
  >
    <flowise-fullchatbot class="h-full w-full" />
  </div>
</template>
