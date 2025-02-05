<script setup lang="ts">
interface Item {
  title: string,
  action: string
}

defineProps<{
  id: string | number,
  items: Item[]
}>()

defineEmits<{
  (e: 'expand'): void
}>()

</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" class="h-8 w-8 p-0">
        <span class="sr-only">{{ $('hint.open_menu') }}</span>
        <div class="h-4 w-4">
          <Icon name="lucide:dot" />
          <Icon name="lucide:dot" />
          <Icon name="lucide:dot" />
        </div>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>{{ $t('tile.actions') }}</DropdownMenuLabel>
      <DropdownMenuItem>
        Copy ID
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>