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
import { Button } from '~/components/ui/button';

const { setPage } = useApp();
const router = useRouter();
const { t } = useI18n();

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
      <Button @click="dialogOpen = true">
        <Icon name="lucide:plus" class="size-4 mr-2" />
        {{ t('action.add_fine_tune') }}
      </Button>
    </div>

    <div class="flex-1 flex items-center justify-center p-8">
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

    <FineTuneCreate v-model:open="dialogOpen" @created="handleCreated" />
  </div>
</template>
