<script setup>
import { Button } from '@/components/ui/button';

import {
  Pagination,
  PaginationEllipsis,
  PaginationFirst,
  PaginationLast,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const props = defineProps({
  currentPage: {
    type: Number,
    required: true,
  },
  totalPages: {
    type: Number,
    required: true,
  },
  canPreviousPage: {
    type: Boolean,
    default: false,
  },
  canNextPage: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['previousPage', 'nextPage']);
</script>

<template>
  <div class="flex items-center justify-end space-x-2">
    <Pagination
      :current-page="currentPage"
      :total-pages="totalPages"
      :sibling-count="1"
      :boundary-count="1"
    >
      <PaginationContent v-slot="{ items }" class="flex items-center gap-1">
        <PaginationFirst />
        <PaginationPrevious />

        <template v-for="(item, index) in items">
          <PaginationItem
            v-if="item.type === 'page'"
            :key="index"
            :value="item.value"
            as-child
          >
            <Button
              class="w-10 h-10 p-0"
              :variant="item.value === page ? 'default' : 'outline'"
            >
              {{ item.value }}
            </Button>
          </PaginationItem>
          <PaginationEllipsis v-else :key="item.type" :index="index" />
        </template>

        <PaginationNext />
        <PaginationLast />
      </PaginationContent>
    </Pagination>
  </div>
</template>
