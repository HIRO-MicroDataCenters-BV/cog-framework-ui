<template>
  <Sheet :open="open" @update:open="(v) => emit('update:open', v)">
    <SheetContent class="sm:max-w-lg">
      <SheetHeader>
        <SheetTitle>{{ $t('builder.manage_parameters') }}</SheetTitle>
        <SheetDescription>
          {{ $t('builder.manage_parameters_description') }}
        </SheetDescription>
      </SheetHeader>

      <div class="mt-6">
        <PipelineParametersPanel
          :parameters="parameters"
          :all-nodes="allNodes"
          :readonly="readonly"
          @update:parameters="handleUpdateParameters"
        />
      </div>
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
import PipelineParametersPanel from './PipelineParametersPanel.vue';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { PipelineInputParam, Node } from '~/types/canvas.types';

interface Props {
  open: boolean;
  parameters: PipelineInputParam[];
  allNodes: Node[];
  readonly?: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  'update:parameters': [parameters: PipelineInputParam[]];
}>();

const handleUpdateParameters = (params: PipelineInputParam[]) => {
  emit('update:parameters', params);
};
</script>
