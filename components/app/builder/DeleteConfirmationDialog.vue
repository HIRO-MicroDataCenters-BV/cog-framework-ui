<template>
  <AlertDialog :open="open">
    <AlertDialogContent class="max-w-md">
      <AlertDialogHeader>
        <div class="flex items-center gap-3 mb-2">
          <div
            class="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center"
          >
            <Icon
              name="lucide:alert-triangle"
              class="w-6 h-6 text-destructive"
            />
          </div>
          <AlertDialogTitle class="text-lg">{{
            $t('builder.delete_component_title')
          }}</AlertDialogTitle>
        </div>
        <AlertDialogDescription class="space-y-3">
          <p class="text-sm">
            {{
              $t('builder.delete_component_warning', {
                name: componentName,
                count: dependencies.length,
              })
            }}
          </p>
          <div
            v-if="dependencies.length > 0"
            class="bg-muted/50 border-l-4 border-destructive/50 rounded-r-lg p-3"
          >
            <p
              class="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider"
            >
              Affected Components:
            </p>
            <div class="space-y-1">
              <div
                v-for="dep in dependencies"
                :key="dep"
                class="flex items-center gap-2 text-sm bg-background/50 px-2 py-1 rounded"
              >
                <Icon name="lucide:link" class="w-3 h-3 text-destructive/70" />
                <span class="font-mono">{{ dep }}</span>
              </div>
            </div>
          </div>
          <div
            class="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-start gap-2"
          >
            <Icon
              name="lucide:shield-alert"
              class="w-4 h-4 text-destructive mt-0.5 flex-shrink-0"
            />
            <p class="text-xs font-semibold text-destructive">
              {{ $t('builder.delete_component_consequence') }}
            </p>
          </div>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter class="gap-2">
        <AlertDialogCancel class="flex-1" @click="onCancel">
          <Icon name="lucide:x" class="w-4 h-4 mr-2" />
          {{ $t('action.cancel') }}
        </AlertDialogCancel>
        <AlertDialogAction
          class="bg-destructive text-destructive-foreground hover:bg-destructive/90 flex-1"
          @click="onConfirm"
        >
          <Icon name="lucide:trash-2" class="w-4 h-4 mr-2" />
          {{ $t('action.delete_anyway') }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup lang="ts">
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';

interface Props {
  open: boolean;
  componentName: string;
  dependencies: string[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  cancel: [];
  confirm: [];
}>();

const onCancel = () => {
  emit('cancel');
};

const onConfirm = () => {
  emit('confirm');
};
</script>
