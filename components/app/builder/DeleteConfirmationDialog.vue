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

<template>
  <AlertDialog :open="open">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{
          $t('builder.delete_component_title')
        }}</AlertDialogTitle>
        <AlertDialogDescription>
          <p class="mb-2">
            {{
              $t('builder.delete_component_warning', {
                name: componentName,
                count: dependencies.length,
              })
            }}
          </p>
          <ul
            v-if="dependencies.length > 0"
            class="list-disc pl-5 mt-2 space-y-1"
          >
            <li v-for="dep in dependencies" :key="dep" class="text-sm">
              {{ dep }}
            </li>
          </ul>
          <p class="mt-3 font-medium text-destructive">
            {{ $t('builder.delete_component_consequence') }}
          </p>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="onCancel">
          {{ $t('action.cancel') }}
        </AlertDialogCancel>
        <AlertDialogAction
          class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          @click="onConfirm"
        >
          {{ $t('action.delete_anyway') }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
