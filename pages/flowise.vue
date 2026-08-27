<script setup lang="ts">
import UpgradePanel from '~/components/app/UpgradePanel.vue';
import EntitlementsUnavailable from '~/components/app/EntitlementsUnavailable.vue';
import {
  ENTERPRISE_CONTACT_EMAIL,
  ENTERPRISE_LEARN_MORE_URL,
} from '~/utils/enterprise';

const { setPage } = useApp();
const config = useRuntimeConfig();

// Tier gate — GenAI is an enterprise feature. Unlike the admin-only Dashboard
// the nav entry stays visible to every tier: free users reach this page and are
// shown what upgrading unlocks, rather than the feature being hidden.
const {
  meetsTier,
  loaded: entitlementsLoaded,
  error: entitlementsError,
  fetchEntitlements,
} = useEntitlements();

const retryingEntitlements = ref(false);
const retryEntitlements = async () => {
  retryingEntitlements.value = true;
  try {
    await fetchEntitlements(true);
  } finally {
    retryingEntitlements.value = false;
  }
};
const hasGenAi = computed(() => meetsTier('enterprise'));

const flowiseHost = computed(() =>
  String(config.public.flowiseHost || '').replace(/\/+$/, ''),
);
const flowiseChatflowId = computed(() =>
  String(config.public.flowiseChatflowId || ''),
);
const flowiseCanvasUrl = computed(() =>
  flowiseHost.value ? `${flowiseHost.value}/flowise/` : '',
);

const upgradeFeatures = [
  {
    title: 'Visual Chatflow Builder',
    description: 'Compose LLM chains and agents on a drag-and-drop canvas',
  },
  {
    title: 'Retrieval-Augmented Generation',
    description: 'Ground answers in your own datasets and vector stores',
  },
  {
    title: 'Embeddable Assistant',
    description: 'Ship the chat widget into your own apps and portals',
  },
  {
    title: 'Served Model Integration',
    description: 'Point chatflows at models you already serve on the platform',
  },
];

setPage({
  section: 'flowise',
});

// Only true once the embedded chatbot has actually been initialised, so the
// cleanup below never tears down something that was skipped by the tier gate.
const chatbotStarted = ref(false);

const startChatbot = async () => {
  if (chatbotStarted.value) return;
  if (!hasGenAi.value) return;
  if (!flowiseHost.value || !flowiseChatflowId.value) return;

  // Use explicit dist entry because flowise-embed package main is misconfigured.
  const { default: Chatbot } = await import('flowise-embed/dist/web.js');

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
  chatbotStarted.value = true;
};

onMounted(async () => {
  await fetchEntitlements();
  await startChatbot();
});

// A retry after a failed entitlements fetch can grant access after mount, so
// the bot is started then too rather than only on the initial load.
watch(hasGenAi, () => {
  startChatbot();
});

onUnmounted(async () => {
  if (!chatbotStarted.value) return;

  // Clean up the bot when leaving /flowise
  const { default: Chatbot } = await import('flowise-embed/dist/web.js');
  Chatbot.destroy();
});
</script>

<template>
  <div class="h-[calc(100svh-74px)] w-full bg-background">
    <div
      v-if="!entitlementsLoaded"
      class="h-full w-full flex items-center justify-center"
    >
      <Icon
        name="lucide:loader-circle"
        class="size-6 animate-spin text-muted-foreground/50"
      />
    </div>

    <div
      v-else-if="entitlementsError"
      class="h-full w-full flex items-center justify-center p-6"
    >
      <EntitlementsUnavailable
        :retrying="retryingEntitlements"
        @retry="retryEntitlements"
      />
    </div>

    <div v-else-if="!hasGenAi" class="h-full w-full overflow-y-auto p-6">
      <UpgradePanel
        class="mx-auto max-w-4xl"
        title="Advanced GenAI Features"
        subtitle="Build, ground and ship LLM assistants on top of the Cognitive Framework."
        banner="GenAI is available on the Enterprise plan"
        banner-badge="Enterprise"
        :features="upgradeFeatures"
        feature-name="GenAI"
        :contact-email="ENTERPRISE_CONTACT_EMAIL"
        :learn-more-url="ENTERPRISE_LEARN_MORE_URL"
      />
    </div>

    <iframe
      v-else-if="flowiseCanvasUrl"
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
