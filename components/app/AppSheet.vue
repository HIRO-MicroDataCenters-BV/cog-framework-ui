<template>
  <Sheet :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <SheetContent
      :side="side"
      :show-overlay="showOverlay"
      :show-close-button="showCloseButton"
      :class="cn('flex flex-col', contentClass)"
    >
      <SheetHeader v-if="title || $slots.header" :class="headerClass">
        <SheetTitle v-if="title">{{ title }}</SheetTitle>
        <SheetDescription v-if="description">{{ description }}</SheetDescription>
        <slot name="header" />
      </SheetHeader>

      <div class="flex-1 overflow-y-auto min-h-0 py-4 pr-4" :class="bodyClass">
        <slot />
      </div>

      <SheetFooter v-if="$slots.footer" :class="footerClass">
        <slot name="footer" />
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/utils';

export type SheetSide = 'top' | 'right' | 'bottom' | 'left';

const props = withDefaults(
  defineProps<{
    open: boolean;
    title?: string;
    description?: string;
    side?: SheetSide;
    showOverlay?: boolean;
    showCloseButton?: boolean;
    contentClass?: HTMLAttributes['class'];
    headerClass?: HTMLAttributes['class'];
    bodyClass?: HTMLAttributes['class'];
    footerClass?: HTMLAttributes['class'];
  }>(),
  {
    side: 'right',
    showOverlay: true,
    showCloseButton: true,
  },
);

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
}>();
</script>
