<script setup lang="ts">
import { computed } from 'vue';
import { useClipboard } from '@vueuse/core';
import { useToaster } from '~/composables/toaster';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';

/**
 * "Request an upgrade" dialog behind every tier-gated feature.
 *
 * Used both by {@link UpgradePanel} (the in-page upsell for gated routes) and
 * directly by the sidebar for gated entries that have no page of their own,
 * such as the external Infra Dashboard link.
 *
 * Amber accents mirror the canary-rollout palette from ModelServingCard, so
 * each carries an explicit `dark:` variant.
 */
const props = defineProps<{
  /** Short feature name, e.g. "GenAI" — names the plan in the copy */
  featureName: string;
  /** Address users are asked to contact for an upgrade */
  contactEmail: string;
}>();

const open = defineModel<boolean>('open', { default: false });

const { t } = useI18n();
const toaster = useToaster();
const { copy, isSupported } = useClipboard();

const mailtoUrl = computed(
  () =>
    `mailto:${props.contactEmail}` +
    `?subject=${encodeURIComponent(`Enterprise access request: ${props.featureName}`)}`,
);

const copyEmail = async () => {
  if (!isSupported.value) {
    toaster.show('error', 'clipboard_not_supported');
    return;
  }
  try {
    await copy(props.contactEmail);
    toaster.show('success', 'copied_to_clipboard');
  } catch (error) {
    console.error('Failed to copy:', error);
    toaster.show('error', 'failed_to_copy');
  }
};
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[480px]">
      <DialogHeader>
        <DialogTitle>Try Enterprise Features</DialogTitle>
        <DialogDescription>
          {{ featureName }} is part of the Enterprise plan. Drop us an email and
          we will get your workspace upgraded.
        </DialogDescription>
      </DialogHeader>

      <div
        class="flex items-center justify-between gap-3 rounded-lg border border-amber-400/40 bg-amber-400/5 px-4 py-3 dark:bg-amber-400/10"
      >
        <span
          class="text-sm font-medium break-all text-amber-800 dark:text-amber-100"
        >
          {{ contactEmail }}
        </span>
        <button
          type="button"
          class="shrink-0 rounded-md p-1.5 text-amber-700 hover:bg-amber-100/60 hover:text-amber-800 dark:text-amber-200 dark:hover:bg-amber-900/40"
          title="Copy email address"
          aria-label="Copy email address"
          @click="copyEmail"
        >
          <Icon name="lucide:copy" class="size-4" />
        </button>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="open = false">
          {{ t('action.close') }}
        </Button>
        <Button
          as-child
          class="bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-400 dark:text-amber-950 dark:hover:bg-amber-300"
        >
          <a :href="mailtoUrl">
            <Icon name="lucide:mail" class="size-4 mr-2" />
            Send Email
          </a>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
