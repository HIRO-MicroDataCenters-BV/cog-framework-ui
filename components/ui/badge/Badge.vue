<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import {
  CheckCircle,
  LoaderCircle,
  CircleSlash,
  Clock,
  Check,
  Calendar,
  Database,
  File,
  Radio,
} from 'lucide-vue-next';
import { reactiveOmit } from '@vueuse/core';
import { Primitive } from 'reka-ui';
import type {
  BadgeVariants,
  BadgeCategory,
  StatusType,
  DataType,
  BadgeCategoryConfig,
} from '.';
import { badgeVariants, badgeConfig, dataTypeMapping } from '.';
import { cn } from '@/utils';

const props = defineProps<
  PrimitiveProps & {
    variant?: BadgeVariants['variant'];
    value?: StatusType | DataType | string | number;
    type?: BadgeCategory;
    class?: HTMLAttributes['class'];
  }
>();

const { t } = useI18n();

const delegatedProps = reactiveOmit(props, 'class', 'value', 'type');

// Get data type from numeric value
const getDataTypeFromValue = (value: number): DataType | null => {
  for (const [type, values] of Object.entries(dataTypeMapping)) {
    if ((values as readonly number[]).includes(value)) {
      return type as DataType;
    }
  }
  return null;
};

// Get configuration key based on type and value
const getConfigKey = (): string | null => {
  if (props.value === null || props.value === undefined || !props.type)
    return null;

  if (props.type === 'status' && typeof props.value === 'string') {
    return props.value.toLowerCase();
  }

  if (props.type === 'type' && typeof props.value === 'number') {
    return (
      getDataTypeFromValue(props.value as number)?.toLocaleLowerCase() ?? null
    );
  }

  return null;
};

// Get variant from configuration
const computedVariant = computed(() => {
  const configKey = getConfigKey();
  if (configKey && props.type) {
    const categoryConfig = badgeConfig[props.type] as Record<
      string,
      BadgeCategoryConfig
    >;
    if (categoryConfig && configKey in categoryConfig) {
      const config = categoryConfig[configKey];
      return config?.variant || props.variant;
    }
  }
  return props.variant;
});

// Get icon component based on configuration
const iconComponent = computed(() => {
  const configKey = getConfigKey();
  if (!configKey || !props.type) return null;

  const categoryConfig = badgeConfig[props.type] as Record<
    string,
    BadgeCategoryConfig
  >;
  if (!categoryConfig || !(configKey in categoryConfig)) return null;

  const config = categoryConfig[configKey];
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
    case 'File':
      return File;
    case 'Database':
      return Database;
    case 'Stream':
      return Radio;
    case 'Calendar':
      return Calendar;
    default:
      return null;
  }
});

// Check if value should animate
const shouldAnimate = computed(() => {
  const configKey = getConfigKey();
  if (!configKey || !props.type) return false;

  const categoryConfig = badgeConfig[props.type] as Record<
    string,
    BadgeCategoryConfig
  >;
  if (!categoryConfig || !(configKey in categoryConfig)) return false;

  const config = categoryConfig[configKey];
  return config?.animate || false;
});

// Get display value
const displayValue = computed(() => {
  const configKey = getConfigKey();
  if (props.type === 'type' && configKey) {
    return t(`label.${configKey}`);
  }
  return props.value;
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
      <span v-if="displayValue" class="capitalize"> {{ displayValue }} </span>
    </slot>
  </Primitive>
</template>
