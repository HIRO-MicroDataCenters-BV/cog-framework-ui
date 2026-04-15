<template>
  <div class="border-t">
    <div class="p-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-medium">
          {{ $t('builder.pipeline_outputs') }}
        </h3>
        <Button v-if="!readonly" size="sm" variant="outline" @click="addOutput">
          <Icon name="lucide:plus" class="w-4 h-4 mr-1" />
          {{ $t('builder.add_output') }}
        </Button>
      </div>

      <div
        v-if="outputs.length === 0"
        class="text-sm text-muted-foreground text-center py-4"
      >
        {{ $t('builder.no_outputs') }}
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="(output, index) in outputs"
          :key="index"
          class="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
        >
          <div class="flex items-start gap-2">
            <div class="flex-1 space-y-2">
              <div class="flex items-center gap-2">
                <Input
                  v-if="editingIndex === index"
                  v-model="editingOutput.name"
                  class="h-8 text-sm font-medium"
                  :placeholder="$t('builder.output_name')"
                />
                <div v-else class="text-sm font-medium">
                  {{ output.name }}
                </div>
              </div>

              <div v-if="editingIndex === index" class="space-y-2">
                <Select v-model="editingOutput.source.component_name">
                  <SelectTrigger class="h-8 text-sm">
                    <SelectValue
                      :placeholder="$t('builder.select_component')"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="node in allNodes"
                      :key="node.id"
                      :value="node.data?.label || node.id"
                    >
                      {{ node.data?.label || node.id }}
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  v-model="editingOutput.source.output_name"
                  :disabled="!editingOutput.source.component_name"
                >
                  <SelectTrigger class="h-8 text-sm">
                    <SelectValue :placeholder="$t('builder.select_output')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="outputPath in getComponentOutputs(
                        editingOutput.source.component_name,
                      )"
                      :key="outputPath.name"
                      :value="outputPath.name"
                    >
                      {{ outputPath.name }}
                      <span
                        v-if="outputPath.type"
                        class="text-xs text-muted-foreground ml-1"
                      >
                        ({{ outputPath.type }})
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <div class="flex gap-2">
                  <Button size="sm" @click="saveEdit">
                    {{ $t('action.save') }}
                  </Button>
                  <Button size="sm" variant="outline" @click="cancelEdit">
                    {{ $t('action.cancel') }}
                  </Button>
                </div>
              </div>
              <div v-else class="text-xs text-muted-foreground">
                <Icon name="lucide:arrow-left" class="w-3 h-3 inline mr-1" />
                {{ output.source.component_name }}.{{
                  output.source.output_name
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
              <Button size="sm" variant="ghost" @click="deleteOutput(index)">
                <Icon name="lucide:trash-2" class="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PipelineOutput, Node, ComponentPath } from '~/types/canvas.types';

const props = withDefaults(
  defineProps<{
    outputs?: PipelineOutput[];
    allNodes?: Node[];
    readonly?: boolean;
  }>(),
  {
    outputs: () => [],
    allNodes: () => [],
    readonly: false,
  },
);

const emit = defineEmits<{
  'update:outputs': [outputs: PipelineOutput[]];
}>();

const editingIndex = ref<number | null>(null);
const editingOutput = ref<PipelineOutput>({
  name: '',
  source: {
    component_name: '',
    output_name: '',
  },
});

const getComponentOutputs = (componentName: string): ComponentPath[] => {
  const node = props.allNodes.find((n) => n.data?.label === componentName);
  return node?.data?.component?.output_path || [];
};

const addOutput = () => {
  const newOutput: PipelineOutput = {
    name: `output_${props.outputs.length + 1}`,
    source: {
      component_name: '',
      output_name: '',
    },
  };

  editingIndex.value = props.outputs.length;
  editingOutput.value = { ...newOutput };

  // Add placeholder to array
  emit('update:outputs', [...props.outputs, newOutput]);
};

const startEdit = (index: number) => {
  editingIndex.value = index;
  editingOutput.value = JSON.parse(JSON.stringify(props.outputs[index]));
};

const saveEdit = () => {
  if (editingIndex.value === null) return;

  // Validate that component and output are selected
  if (
    !editingOutput.value.source.component_name ||
    !editingOutput.value.source.output_name
  ) {
    return; // Don't save incomplete outputs
  }

  const updated = [...props.outputs];
  updated[editingIndex.value] = { ...editingOutput.value };

  emit('update:outputs', updated);
  editingIndex.value = null;
};

const cancelEdit = () => {
  if (
    editingIndex.value !== null &&
    editingIndex.value >= props.outputs.length - 1
  ) {
    // If it was a new output being added, remove it
    const updated = props.outputs.slice(0, -1);
    emit('update:outputs', updated);
  }
  editingIndex.value = null;
};

const deleteOutput = (index: number) => {
  const updated = props.outputs.filter((_, i) => i !== index);
  emit('update:outputs', updated);
};
</script>
