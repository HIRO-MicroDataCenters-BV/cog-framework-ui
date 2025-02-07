<script setup lang="ts">
interface Item {
  key: string,
  title: string,
  action: (id: number) => void
}



const props = defineProps<{
  items: Item[]
  id: number
}>()

defineEmits<{
  (e: 'expand'): void
}>()

</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" class="h-8 w-8 p-0">
        <span class="sr-only">{{ $t('hint.open_menu') }}</span>
        <div class="h-4 w-4">
          <Icon name="cog:more" />
        </div>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>{{ $t('title.actions') }}</DropdownMenuLabel>
      <DropdownMenuItem v-for="item in props.items" :key="item.key" @click="item.action(props.id)">
        {{ item.title }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>