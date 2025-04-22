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
  pageSize: {
    type: Number,
    required: true,
  },
  totalItems: {
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

const emit = defineEmits(['on-prev-page', 'on-next-page', 'on-set-page']);

const handlePrevPage = () => {
  if (props.canPreviousPage) {
    emit('on-prev-page');
  }
};

const handleNextPage = () => {
  if (props.canNextPage) {
    emit('on-next-page');
  }
};

const handleSetPage = (page) => {
  emit('on-set-page', page);
};

const handleFirstPage = () => {
  emit('on-set-page', 0);
};

const handleLastPage = () => {
  emit('on-set-page', Math.ceil(totalItems.value / pageSize.value) - 1);
};
</script>

<template>
  <div class="flex items-center justify-end space-x-2">
    <Pagination :items-per-page="props.pageSize" :total="props.totalItems">
      <PaginationContent v-slot="{ items }" class="flex items-center gap-1">
        <PaginationFirst @click="handleFirstPage" />
        <PaginationPrevious @click="handlePrevPage" />

        <template v-for="(item, index) in items">
          <PaginationItem
            v-if="item.type === 'page'"
            :key="index"
            :value="item.value"
            as-child
          >
            <Button
              class="w-10 h-10 p-0"
              :variant="item.value === currentPage ? 'default' : 'outline'"
              @click="handleSetPage(item.value)"
            >
              {{ item.value }}
            </Button>
          </PaginationItem>
          <PaginationEllipsis v-else :key="item.type" :index="index" />
        </template>

        <PaginationNext @click="handleNextPage" />
        <PaginationLast @click="handleLastPage" />
      </PaginationContent>
    </Pagination>
  </div>
</template>
