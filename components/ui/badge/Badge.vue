<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import {
  CheckCircle,
  LoaderCircle,
  CircleSlash,
  Clock,
  Check,
} from 'lucide-vue-next';
import { reactiveOmit } from '@vueuse/core';
import { Primitive } from 'reka-ui';
import type { BadgeVariants, StatusType } from '.';
import { badgeVariants, statusConfig } from '.';
import { cn } from '@/utils';

const props = defineProps<
  PrimitiveProps & {
    variant?: BadgeVariants['variant'];
    status?: StatusType | string;
    class?: HTMLAttributes['class'];
  }
>();

const delegatedProps = reactiveOmit(props, 'class', 'status');

// Get variant from status if status is provided
const computedVariant = computed(() => {
  if (props.status) {
    const statusKey = props.status.toLowerCase() as StatusType;
    return statusConfig[statusKey]?.variant || props.variant;
  }
  return props.variant;
});

// Get icon component based on status
const iconComponent = computed(() => {
  if (!props.status) return null;

  const statusKey = props.status.toLowerCase() as StatusType;
  const config = statusConfig[statusKey];

  if (!config) return null;

  switch (config.icon) {
    case 'CheckCircle':
      return CheckCircle;
    case 'LoaderCircle':
      return LoaderCircle;
    case 'CircleSlash':
      return CircleSlash;
    case 'Clock':
      return Clock;
    case 'Check':
      return Check;
    default:
      return null;
  }
});

// Check if status should animate
const shouldAnimate = computed(() => {
  if (!props.status) return false;
  const statusKey = props.status.toLowerCase() as StatusType;
  return statusConfig[statusKey]?.animate || false;
});
</script>

<template>
  <Primitive
    data-slot="badge"
    :class="cn(badgeVariants({ variant: computedVariant }), props.class)"
    v-bind="delegatedProps"
  >
    <component
      :is="iconComponent"
      v-if="iconComponent"
      :class="cn('w-3 h-3', shouldAnimate && 'animate-spin duration-1000')"
    />
    <slot>
      <span v-if="props.status" class="capitalize">
        {{ props.status }}
      </span>
    </slot>
  </Primitive>
</template>
