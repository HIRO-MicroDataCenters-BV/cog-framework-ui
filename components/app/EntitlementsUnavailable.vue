<script setup lang="ts">
import { Button } from '~/components/ui/button';

/**
 * Shown when the entitlements fetch failed, in place of a gated feature.
 *
 * Access still fails closed — the feature stays hidden until the tier is
 * confirmed — but the user is told the plan could not be verified rather than
 * being shown an upsell, which would wrongly imply they are on a lower plan.
 */
defineProps<{
  /** True while a retry is in flight, to disable the button */
  retrying?: boolean;
}>();

defineEmits<{ retry: [] }>();
</script>

<template>
  <div class="flex flex-col items-center text-center gap-3 max-w-md">
    <Icon name="lucide:plug-zap" class="size-10 text-muted-foreground/60" />
    <div class="flex flex-col gap-1">
      <h2 class="text-lg font-medium">Couldn't check your plan</h2>
      <p class="text-sm text-muted-foreground">
        We couldn't reach the entitlements service, so this feature stays locked
        for now. If your workspace is on the Enterprise plan, retrying should
        restore access.
      </p>
    </div>
    <Button variant="outline" :disabled="retrying" @click="$emit('retry')">
      <Icon
        :name="retrying ? 'lucide:loader-circle' : 'lucide:refresh-cw'"
        class="size-4 mr-2"
        :class="retrying && 'animate-spin'"
      />
      {{ retrying ? 'Retrying…' : 'Try again' }}
    </Button>
  </div>
</template>
