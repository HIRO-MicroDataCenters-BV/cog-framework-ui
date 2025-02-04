<script setup lang="ts">
defineProps<{
  item: {
    id: string
  }
}>()

defineEmits<{
  (e: 'expand'): void
}>()

function copy(id: string) {
  navigator.clipboard.writeText(id)
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" class="h-8 w-8 p-0">
        <span class="sr-only">Open menu</span>
        <div class="h-4 w-4">
          <Icon name="lucide:dot" />
          <Icon name="lucide:dot" />
          <Icon name="lucide:dot" />
        </div>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Actions</DropdownMenuLabel>
      <DropdownMenuItem @click="copy(item.id)">
        Copy ID
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>