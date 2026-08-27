<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '~/components/ui/button';
import EnterpriseContactDialog from '~/components/app/EnterpriseContactDialog.vue';

/**
 * Upsell shown in place of a tier-gated feature.
 *
 * Rendered when the current tier is below what a feature requires, instead of
 * hiding the feature outright — the user still reaches the page and sees what
 * the higher tier unlocks, plus how to request it.
 *
 * The amber accents reuse the canary-rollout palette from ModelServingCard —
 * `amber-400/40` borders over an `amber-400/5` (dark `/10`) fill, `amber-500`
 * dots, `amber-800`/`amber-100` text. Fixed palette values rather than theme
 * tokens, so each one carries an explicit `dark:` variant.
 */
defineProps<{
  /** Feature being advertised, e.g. "Advanced GenAI Features" */
  title: string;
  /** One-line pitch under the title */
  subtitle?: string;
  /** Highlighted strip above the feature grid */
  banner?: string;
  /** Small badge inside the banner, e.g. "Enterprise" */
  bannerBadge?: string;
  /** Selling points, rendered as a two-column checklist */
  features: { title: string; description: string }[];
  /** Short feature name used in the request dialog, e.g. "GenAI" */
  featureName: string;
  /** Address users are asked to contact for an upgrade */
  contactEmail: string;
  /** Target for the "Learn More" button */
  learnMoreUrl: string;
}>();

const contactOpen = ref(false);
</script>

<template>
  <div class="rounded-xl border border-border bg-card p-6 flex flex-col gap-5">
    <div class="flex flex-col gap-1">
      <h2 class="text-xl font-semibold tracking-tight">{{ title }}</h2>
      <p v-if="subtitle" class="text-sm text-muted-foreground">
        {{ subtitle }}
      </p>
    </div>

    <div
      v-if="banner"
      class="flex items-center gap-3 rounded-lg border border-amber-400/40 bg-amber-400/5 px-4 py-3 dark:bg-amber-400/10"
    >
      <span class="text-sm font-medium text-amber-800 dark:text-amber-100">
        {{ banner }}
      </span>
      <span
        v-if="bannerBadge"
        class="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
      >
        {{ bannerBadge }}
      </span>
    </div>

    <ul class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
      <li
        v-for="feature in features"
        :key="feature.title"
        class="flex items-start gap-3"
      >
        <span
          class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500"
        >
          <Icon name="lucide:check" class="size-3 text-white" />
        </span>
        <div class="flex flex-col">
          <span class="text-sm font-semibold leading-tight">
            {{ feature.title }}
          </span>
          <span class="text-sm text-muted-foreground leading-snug">
            {{ feature.description }}
          </span>
        </div>
      </li>
    </ul>

    <div class="flex flex-wrap items-center gap-3">
      <slot name="actions">
        <Button
          class="bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-400 dark:text-amber-950 dark:hover:bg-amber-300"
          @click="contactOpen = true"
        >
          Try Enterprise Features
        </Button>
        <Button variant="ghost" as-child>
          <a :href="learnMoreUrl" target="_blank" rel="noopener noreferrer">
            Learn More
          </a>
        </Button>
      </slot>
    </div>

    <EnterpriseContactDialog
      v-model:open="contactOpen"
      :feature-name="featureName"
      :contact-email="contactEmail"
    />
  </div>
</template>
