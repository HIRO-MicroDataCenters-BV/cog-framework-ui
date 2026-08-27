<script setup lang="ts">
/**
 * Fine-tune landing page.
 *
 * Phase 1 keeps this page minimal — a launch button that opens the
 * FineTuneCreate dialog. Once the kfp run completes, the resulting
 * LoRA adapter appears in the existing model-serving picker (no
 * special fine-tune-aware UI needed for serving).
 *
 * Future expansion: list past fine-tune runs by querying
 * `GET /cogapi/models?type=lora` and joining against pipeline runs.
 */
import { ref } from 'vue';
import FineTuneCreate from '~/components/app/dialog/FineTuneCreate.vue';
import UpgradePanel from '~/components/app/UpgradePanel.vue';
import EntitlementsUnavailable from '~/components/app/EntitlementsUnavailable.vue';
import {
  ENTERPRISE_CONTACT_EMAIL,
  ENTERPRISE_LEARN_MORE_URL,
} from '~/utils/enterprise';
import { Button } from '~/components/ui/button';

const { setPage } = useApp();
const router = useRouter();
const { t } = useI18n();

// Tier gate — fine-tuning is an enterprise feature. As with GenAI the nav entry
// stays visible to every tier: free users reach this page and see what
// upgrading unlocks, instead of the feature being hidden.
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
const hasFineTune = computed(() => meetsTier('enterprise'));

const upgradeFeatures = [
  {
    title: 'Parameter-Efficient LoRA Training',
    description: 'Adapt an existing LLM without retraining the full model',
  },
  {
    title: 'Train on Your Own Data',
    description: 'Point a run at any JSONL dataset registered on the platform',
  },
  {
    title: 'Tunable Training Knobs',
    description: 'Control gates, training steps and learning rate per run',
  },
  {
    title: 'Straight to Serving',
    description: 'Completed adapters appear in the model-serving picker',
  },
];

onMounted(() => {
  fetchEntitlements();
});

setPage({
  section: 'fine-tune',
});

const dialogOpen = ref(false);

// `createFineTune` in the API layer already fires the success toast
// via its `successMessage` option — don't duplicate it here. We only
// route the user to the pipeline-runs view when a run was actually
// submitted (run_pipeline=true path).
const handleCreated = (payload: {
  model_id: string;
  run_id?: string | null;
}) => {
  if (payload.run_id) {
    router.push('/pipelines/run');
  }
};
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between px-6 py-4 border-b">
      <div>
        <h1 class="text-xl font-semibold">{{ t('menu.fine_tune') }}</h1>
        <p class="text-sm text-muted-foreground mt-1">
          {{ t('description.fine_tune') }}
        </p>
      </div>
      <Button v-if="hasFineTune" @click="dialogOpen = true">
        <Icon name="lucide:plus" class="size-4 mr-2" />
        {{ t('action.add_fine_tune') }}
      </Button>
    </div>

    <div
      v-if="!entitlementsLoaded"
      class="flex-1 flex items-center justify-center"
    >
      <Icon
        name="lucide:loader-circle"
        class="size-6 animate-spin text-muted-foreground/50"
      />
    </div>

    <div
      v-else-if="entitlementsError"
      class="flex-1 flex items-center justify-center p-6"
    >
      <EntitlementsUnavailable
        :retrying="retryingEntitlements"
        @retry="retryEntitlements"
      />
    </div>

    <div v-else-if="!hasFineTune" class="flex-1 overflow-y-auto p-6">
      <UpgradePanel
        class="mx-auto max-w-4xl"
        title="Advanced Fine-Tuning Features"
        subtitle="Adapt open LLMs to your own data and serve the result on the platform."
        banner="Fine-tuning is available on the Enterprise plan"
        banner-badge="Enterprise"
        :features="upgradeFeatures"
        feature-name="Fine-tuning"
        :contact-email="ENTERPRISE_CONTACT_EMAIL"
        :learn-more-url="ENTERPRISE_LEARN_MORE_URL"
      />
    </div>

    <div v-else class="flex-1 flex items-center justify-center p-8">
      <div class="text-center max-w-md">
        <Icon
          name="lucide:sliders-horizontal"
          class="size-12 text-muted-foreground mx-auto mb-4"
        />
        <h2 class="text-lg font-medium mb-2">
          {{ t('title.fine_tune_empty') }}
        </h2>
        <p class="text-sm text-muted-foreground mb-4">
          {{ t('description.fine_tune_empty') }}
        </p>
        <Button @click="dialogOpen = true">
          <Icon name="lucide:plus" class="size-4 mr-2" />
          {{ t('action.start_fine_tune') }}
        </Button>
      </div>
    </div>

    <FineTuneCreate
      v-if="hasFineTune"
      v-model:open="dialogOpen"
      @created="handleCreated"
    />
  </div>
</template>
