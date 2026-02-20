<script setup>
import { computed } from 'vue';

const { t } = useI18n();

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
  siblingCount: {
    type: Number,
    default: 2,
  },
  showEdges: {
    type: Boolean,
    default: true,
  },
  pageSizeOptions: {
    type: Array,
    default: () => [5, 10, 15, 20, 50, 100],
  },
});

const emit = defineEmits(['on-set-page', 'on-set-page-size']);

const PAGINATION_CONFIG = {
  MAX_VISIBLE_PAGES: 5,
  FIRST_PAGE_THRESHOLD: 3,
  LAST_PAGE_THRESHOLD: 2,
  SIDE_PAGES_COUNT: 2,
  MIN_PAGES_FOR_ELLIPSIS: 5,
};

const totalPages = computed(() => Math.ceil(props.totalItems / props.pageSize));

const generatePageNumbers = () => {
  const pages = [];
  const current = props.currentPage;
  const total = totalPages.value;

  if (total <= PAGINATION_CONFIG.MIN_PAGES_FOR_ELLIPSIS) {
    for (let i = 1; i <= total; i++) {
      pages.push({ type: 'page', value: i });
    }
    return pages;
  }

  const {
    MAX_VISIBLE_PAGES,
    FIRST_PAGE_THRESHOLD,
    LAST_PAGE_THRESHOLD,
    SIDE_PAGES_COUNT,
  } = PAGINATION_CONFIG;
  let startPage, endPage;

  if (current <= FIRST_PAGE_THRESHOLD) {
    startPage = 1;
    endPage = Math.min(MAX_VISIBLE_PAGES, total);
  } else if (current >= total - LAST_PAGE_THRESHOLD) {
    startPage = Math.max(1, total - (MAX_VISIBLE_PAGES - 1));
    endPage = total;
  } else {
    startPage = current - SIDE_PAGES_COUNT;
    endPage = current + SIDE_PAGES_COUNT;
  }

  const willShowFirstButton = current > FIRST_PAGE_THRESHOLD;
  if (startPage > 1 && !willShowFirstButton) {
    pages.push({ type: 'page', value: 1 });
    if (startPage > 2) {
      pages.push({ type: 'ellipsis' });
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push({ type: 'page', value: i });
  }

  const willShowLastButton = current < total - LAST_PAGE_THRESHOLD;
  if (endPage < total && !willShowLastButton) {
    if (endPage < total - 1) {
      pages.push({ type: 'ellipsis' });
    }
    pages.push({ type: 'page', value: total });
  }

  return pages;
};

const pageNumbers = computed(() => generatePageNumbers());

const handlePrevPage = () => {
  if (props.currentPage > 1) {
    emit('on-set-page', props.currentPage - 1);
  }
};

const handleNextPage = () => {
  if (props.currentPage < totalPages.value) {
    emit('on-set-page', props.currentPage + 1);
  }
};

const handleSetPage = (page) => {
  if (page !== props.currentPage && page >= 1 && page <= totalPages.value) {
    emit('on-set-page', page);
  }
};

const handleFirstPage = () => {
  emit('on-set-page', 1);
};

const handleLastPage = () => {
  emit('on-set-page', totalPages.value);
};

const handlePageSizeChange = (value) => {
  const newSize = parseInt(value, 10);
  if (!isNaN(newSize) && newSize > 0) {
    emit('on-set-page-size', newSize);
  }
};
</script>

<template>
  <div class="flex items-center justify-between space-x-2 w-full">
    <div class="flex items-center gap-2">
      <Select
        :model-value="pageSize.toString()"
        @update:model-value="handlePageSizeChange"
      >
        <SelectTrigger class="w-[100px]">
          <Icon name="lucide:rows-3" class="size-4" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="option in pageSizeOptions"
            :key="option"
            :value="option.toString()"
          >
            {{ option }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div class="flex items-center justify-end space-x-2">
      <div class="flex items-center gap-1">
        <button
          v-if="
            showEdges && currentPage > PAGINATION_CONFIG.FIRST_PAGE_THRESHOLD
          "
          class="px-3 h-10 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
          :disabled="currentPage === 1"
          @click="handleFirstPage"
        >
          {{ t('action.first') }}
        </button>

        <button
          class="px-3 h-10 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
          :disabled="!canPreviousPage"
          @click="handlePrevPage"
        >
          ‹ {{ t('action.previous') }}
        </button>

        <template v-for="(item, index) in pageNumbers" :key="index">
          <button
            v-if="item.type === 'page'"
            class="w-10 h-10 p-0 border rounded-md"
            :class="{
              'bg-primary text-primary-foreground hover:bg-primary/90':
                item.value === currentPage,
              'bg-background hover:bg-gray-50 cursor-pointer':
                item.value !== currentPage,
            }"
            @click="handleSetPage(item.value)"
          >
            {{ item.value }}
          </button>
          <span
            v-else
            class="w-10 h-10 p-0 flex items-center justify-center text-gray-500"
          >
            ...
          </span>
        </template>

        <button
          class="px-3 h-10 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
          :disabled="!canNextPage"
          @click="handleNextPage"
        >
          {{ t('action.next') }} ›
        </button>

        <button
          v-if="
            showEdges &&
            currentPage < totalPages - PAGINATION_CONFIG.LAST_PAGE_THRESHOLD
          "
          class="px-3 h-10 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
          :disabled="currentPage === totalPages"
          @click="handleLastPage"
        >
          {{ t('action.last') }}
        </button>
      </div>
    </div>
  </div>
</template>
