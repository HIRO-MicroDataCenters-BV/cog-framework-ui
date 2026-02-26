<template>
  <div v-if="content" class="w-full h-full flex flex-col overflow-hidden">
    <SimpleTabs v-model="activeTab" :tabs="tabs" class="flex-shrink-0" />

    <div class="flex-1 overflow-y-auto px-4 py-4">
      <!-- Overview Tab -->
      <ModelOverviewTab v-if="activeTab === 'overview'" :content="content" />

      <!-- Artifacts Tab -->
      <ModelArtifactsTab
        v-if="activeTab === 'artifacts'"
        :artifacts="additional?.artifacts"
        :loading="associationsLoading"
      />

      <!-- Associations Tab -->
      <ModelAssociationsTab
        v-if="activeTab === 'associations'"
        :associations="additional"
        :loading="associationsLoading"
      />

      <!-- Compare Tab -->
      <ModelCompareTab
        v-if="activeTab === 'compare'"
        :model="content"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import SimpleTabs from '~/components/app/SimpleTabs.vue';
import ModelOverviewTab from '~/components/app/ModelOverviewTab.vue';
import ModelArtifactsTab from '~/components/app/ModelArtifactsTab.vue';
import ModelAssociationsTab from '~/components/app/ModelAssociationsTab.vue';
import ModelCompareTab from '~/components/app/ModelCompareTab.vue';

const dayjs = useDayjs();
const route = useRoute();
const { getModelById, getModelAssociationsById } = useApi();
const { setPage } = useApp();
const id = computed(() => route.params.id[0] as string);
const content = ref<any>();
const additional = ref<any>();
const associationsLoading = ref(false);
const associationsLoaded = ref(false);

const activeTab = ref('overview');
const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'artifacts', label: 'Artifacts' },
  { key: 'associations', label: 'Associations' },
  { key: 'compare', label: 'Compare' },
];

// Load associations data when switching to artifacts tab
const loadAssociations = async () => {
  if (associationsLoaded.value || associationsLoading.value) return;

  associationsLoading.value = true;
  try {
    const resAssociations = await getModelAssociationsById(id.value);
    if (
      resAssociations &&
      'data' in resAssociations &&
      resAssociations.data &&
      Array.isArray(resAssociations.data) &&
      resAssociations.data.length > 0
    ) {
      additional.value = resAssociations.data[0];
      console.log('Associations data:', additional.value);
    }
    associationsLoaded.value = true;
  } catch (err) {
    console.warn('Failed to load associations:', err);
  } finally {
    associationsLoading.value = false;
  }
};

// Watch for tab changes to lazy load associations
watch(activeTab, (newTab) => {
  if (newTab === 'artifacts' || newTab === 'associations') {
    loadAssociations();
  }
});

onMounted(async () => {
  try {
    const res = await getModelById(id.value);
    console.log('getModelById response:', res);

    if (res && 'data' in res && res.data) {
      const data = res.data;
      console.log('Model data:', data);
      content.value = data;

      if (content.value) {
        setPage({
          section: 'models',
          title: content.value.name as string,
          subtitle: content.value.description as string,
        });
      }
    } else {
      console.error('Invalid response format or no data:', res);
    }
  } catch (error) {
    console.error('Error loading model:', error);
  }
});
</script>

<style scoped>
.overflow-y-auto {
  scrollbar-width: thin;
  scroll-behavior: smooth;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: hsl(var(--muted-foreground) / 0.3);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: hsl(var(--muted-foreground) / 0.5);
}
</style>
