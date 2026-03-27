<template>
  <div class="border-t">
    <div class="p-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-medium">
          {{ $t('builder.pipeline_parameters') }}
        </h3>
        <Button
          v-if="!readonly"
          size="sm"
          variant="outline"
          @click="addParameter"
        >
          <Icon name="lucide:plus" class="w-4 h-4 mr-1" />
          {{ $t('builder.add_parameter') }}
        </Button>
      </div>

      <div
        v-if="parameters.length === 0"
        class="text-sm text-muted-foreground text-center py-4"
      >
        {{ $t('builder.no_parameters') }}
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="(param, index) in parameters"
          :key="param.name"
          class="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
        >
          <div class="flex items-start gap-2">
            <div class="flex-1 space-y-2">
              <div class="flex items-center gap-2">
                <Input
                  v-if="editingIndex === index"
                  v-model="editingParam.name"
                  class="h-8 text-sm font-medium"
                  :placeholder="$t('builder.parameter_name')"
                  @blur="saveEdit"
                  @keydown.enter="saveEdit"
                  @keydown.esc="cancelEdit"
                />
                <div v-else class="text-sm font-medium">
                  {{ param.name }}
                </div>
                <Badge v-if="param.type" variant="secondary" class="text-xs">
                  {{ param.type }}
                </Badge>
              </div>

              <div v-if="editingIndex === index" class="space-y-2">
                <Input
                  v-model="editingParam.default"
                  class="h-8 text-sm"
                  :placeholder="$t('builder.default_value')"
                />
                <Input
                  v-model="editingParam.description"
                  class="h-8 text-sm"
                  :placeholder="$t('builder.description')"
                />
              </div>
              <div v-else class="text-xs text-muted-foreground space-y-1">
                <div v-if="param.default">
                  <span class="font-medium">{{ $t('builder.default') }}:</span>
                  {{ param.default }}
                </div>
                <div v-if="param.description">
                  {{ param.description }}
                </div>
              </div>

              <div
                v-if="getUsageCount(param.name) > 0"
                class="text-xs text-muted-foreground"
              >
                <Icon name="lucide:link" class="w-3 h-3 inline mr-1" />
                {{
                  $t('builder.used_in_components', {
                    count: getUsageCount(param.name),
                  })
                }}
              </div>
            </div>

            <div v-if="!readonly" class="flex gap-1">
              <Button
                v-if="editingIndex !== index"
                size="sm"
                variant="ghost"
                @click="startEdit(index)"
              >
                <Icon name="lucide:pencil" class="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" @click="deleteParameter(index)">
                <Icon name="lucide:trash-2" class="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Create Parameter Dialog -->
  <CreateParameterDialog
    :open="showCreateDialog"
    :existing-parameters="parameters"
    @update:open="showCreateDialog = $event"
    @create="handleParameterCreated"
  />

  <AlertDialog :open="deleteConfirmation !== null">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{
          $t('builder.delete_parameter')
        }}</AlertDialogTitle>
        <AlertDialogDescription>
          <span
            v-if="
              deleteConfirmation?.usageCount &&
              deleteConfirmation.usageCount > 0
            "
          >
            {{
              $t('builder.parameter_used_warning', {
                name: deleteConfirmation?.name,
                count: deleteConfirmation.usageCount,
              })
            }}
          </span>
          <span v-else>
            {{
              $t('builder.delete_parameter_confirm', {
                name: deleteConfirmation?.name,
              })
            }}
          </span>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="deleteConfirmation = null">
          {{ $t('action.cancel') }}
        </AlertDialogCancel>
        <AlertDialogAction @click="confirmDelete">
          {{ $t('action.delete') }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup lang="ts">
import CreateParameterDialog from './CreateParameterDialog.vue';
import type { PipelineInputParam, Node } from '~/types/canvas.types';

const props = withDefaults(
  defineProps<{
    parameters?: PipelineInputParam[];
    allNodes?: Node[];
    readonly?: boolean;
  }>(),
  {
    parameters: () => [],
    allNodes: () => [],
    readonly: false,
  },
);

const emit = defineEmits<{
  'update:parameters': [parameters: PipelineInputParam[]];
}>();

const editingIndex = ref<number | null>(null);
const editingParam = ref<PipelineInputParam>({
  name: '',
  default: '',
  description: '',
});

const deleteConfirmation = ref<{
  index: number;
  name: string;
  usageCount: number;
} | null>(null);

const showCreateDialog = ref(false);

const getUsageCount = (paramName: string): number => {
  let count = 0;
  props.allNodes.forEach((node) => {
    const inputs = node.data?.component?.inputs || [];
    inputs.forEach((input) => {
      if (
        input.value_source_type === 'pipeline_inputparam' &&
        input.source === paramName
      ) {
        count++;
      }
    });
  });
  return count;
};

const addParameter = () => {
  showCreateDialog.value = true;
};

const handleParameterCreated = (parameter: PipelineInputParam) => {
  emit('update:parameters', [...props.parameters, parameter]);
};

const startEdit = (index: number) => {
  editingIndex.value = index;
  editingParam.value = { ...props.parameters[index] };
};

const saveEdit = () => {
  if (editingIndex.value === null) return;

  const oldName = props.parameters[editingIndex.value].name;
  const newName = editingParam.value.name;

  const updated = [...props.parameters];
  updated[editingIndex.value] = { ...editingParam.value };

  emit('update:parameters', updated);

  // If name changed, update all component references
  if (oldName !== newName) {
    // This will be handled by parent component
    // For now, just emit the update
  }

  editingIndex.value = null;
};

const cancelEdit = () => {
  editingIndex.value = null;
};

const deleteParameter = (index: number) => {
  const param = props.parameters[index];
  const usageCount = getUsageCount(param.name);

  deleteConfirmation.value = {
    index,
    name: param.name,
    usageCount,
  };
};

const confirmDelete = () => {
  if (deleteConfirmation.value === null) return;

  const updated = props.parameters.filter(
    (_, i) => i !== deleteConfirmation.value!.index,
  );
  emit('update:parameters', updated);
  deleteConfirmation.value = null;
};
</script>
