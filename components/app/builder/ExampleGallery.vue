<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[920px] max-h-[85svh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ $t('builder.examples.title') }}</DialogTitle>
        <DialogDescription>
          {{ $t('builder.examples.description') }}
        </DialogDescription>
      </DialogHeader>

      <p
        v-if="viewOnly"
        class="text-sm rounded-md border border-border/60 bg-muted/30 px-3 py-2 flex items-center gap-2"
      >
        <Icon name="lucide:lock" class="size-3.5 shrink-0" />
        {{ $t('builder.examples.view_only') }}
      </p>

      <p
        v-if="hasNodes"
        class="text-sm rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2"
      >
        {{ $t('builder.examples.replaces_canvas') }}
      </p>

      <div
        v-if="loadingList"
        class="py-10 flex justify-center text-muted-foreground"
      >
        <Icon name="lucide:loader-2" class="w-5 h-5 animate-spin" />
      </div>

      <p
        v-else-if="templates.length === 0"
        class="py-10 text-center text-sm text-muted-foreground"
      >
        {{ $t('builder.examples.empty') }}
      </p>

      <div v-else class="grid gap-3 sm:grid-cols-2">
        <div
          v-for="template in templates"
          :key="template.key"
          class="rounded-lg border p-4 flex flex-col gap-3"
          :data-testid="`example-${template.key}`"
        >
          <div class="flex items-start justify-between gap-2">
            <h3 class="font-medium leading-tight">{{ template.title }}</h3>
            <Badge variant="outline" class="shrink-0 capitalize">
              {{ template.level }}
            </Badge>
          </div>
          <p class="text-sm text-muted-foreground">{{ template.summary }}</p>

          <ol class="flex flex-wrap items-center gap-1 text-xs">
            <template v-for="(step, index) in template.steps" :key="step">
              <li class="rounded bg-muted px-1.5 py-0.5">{{ step }}</li>
              <Icon
                v-if="index < template.steps.length - 1"
                name="lucide:chevron-right"
                class="w-3 h-3 text-muted-foreground"
                aria-hidden="true"
              />
            </template>
          </ol>

          <div
            class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"
          >
            <span class="inline-flex items-center gap-1">
              <Icon
                :name="
                  template.sample_dataset.kind === 'image'
                    ? 'lucide:image'
                    : 'lucide:table'
                "
                class="w-3.5 h-3.5"
              />
              {{ template.sample_dataset.dataset_name }}
            </span>
            <span class="inline-flex items-center gap-1">
              <Icon name="lucide:clock" class="w-3.5 h-3.5" />
              {{
                $t('builder.examples.minutes', {
                  count: template.estimated_minutes,
                })
              }}
            </span>
            <span
              v-if="template.serves_model"
              class="inline-flex items-center gap-1"
            >
              <Icon name="lucide:rocket" class="w-3.5 h-3.5" />
              {{ $t('builder.examples.deploys') }}
            </span>
          </div>

          <div class="mt-auto flex items-center justify-between gap-2 pt-1">
            <span class="text-[11px] text-muted-foreground truncate">
              {{ template.sample_dataset.source }}
            </span>
            <Button
              size="sm"
              :disabled="!template.available || loadingKey !== null"
              :title="
                template.available ? '' : $t('builder.examples.unavailable')
              "
              @click="useTemplate(template)"
            >
              <Icon
                v-if="loadingKey === template.key"
                name="lucide:loader-2"
                class="w-4 h-4 mr-1 animate-spin"
              />
              {{ $t('builder.examples.use') }}
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { useApi } from '@/composables/api';
import type {
  PipelineTemplateDetail,
  PipelineTemplateSummary,
} from '~/types/template.types';

const props = defineProps<{
  open: boolean;
  /** The canvas already has nodes: loading an example replaces them. */
  hasNodes?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'load', template: PipelineTemplateDetail): void;
}>();

const api = useApi();
const {
  hasPermission,
  loaded: entitlementsLoaded,
  error: entitlementsError,
  fetchEntitlements,
} = useEntitlements();

// A plan without dataset:create opens examples to look at: the sample dataset
// is not registered and the reader step is left empty (Save & Run is locked).
const viewOnly = computed(
  () =>
    entitlementsLoaded.value &&
    !entitlementsError.value &&
    !hasPermission('dataset:create'),
);
const templates = ref<PipelineTemplateSummary[]>([]);
const loadingList = ref(false);
const loadingKey = ref<string | null>(null);

const fetchTemplates = async () => {
  loadingList.value = true;
  try {
    const res = (await api.getTrainingBuilderTemplates()) as {
      data?: PipelineTemplateSummary[];
    } | null;
    templates.value = res?.data ?? [];
  } finally {
    loadingList.value = false;
  }
};

/**
 * Register the sample (first use only, and only when the plan allows it),
 * resolve the example and hand it to the builder. Exposed so
 * `?example=<key>` can load one without the dialog.
 */
const loadTemplate = async (key: string, sampleRegistered = false) => {
  loadingKey.value = key;
  try {
    // `?example=` loads on mount: the plan must be known before deciding.
    await fetchEntitlements();
    if (!sampleRegistered && !viewOnly.value) {
      const sample = await api.postTrainingBuilderTemplateSampleDataset(key);
      if (!sample) return;
    }
    const res = (await api.getTrainingBuilderTemplate(key)) as {
      data?: PipelineTemplateDetail;
    } | null;
    if (res?.data) {
      emit('load', res.data);
      emit('update:open', false);
    }
  } finally {
    loadingKey.value = null;
  }
};

const useTemplate = (template: PipelineTemplateSummary) =>
  loadTemplate(template.key, Boolean(template.sample_dataset.dataset_id));

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) fetchTemplates();
  },
  { immediate: true },
);

defineExpose({ loadTemplate });
</script>
