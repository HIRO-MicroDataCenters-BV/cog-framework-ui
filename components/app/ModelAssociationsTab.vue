<template>
  <!-- Loading State -->
  <div v-if="loading" class="h-full flex items-center justify-center">
    <div class="text-center">
      <Icon
        name="lucide:loader-2"
        class="w-8 h-8 mx-auto mb-2 animate-spin text-primary"
      />
      <p class="text-sm text-muted-foreground">Loading associations...</p>
    </div>
  </div>

  <div v-else class="space-y-4">
    <!-- Model Info Card -->
    <Card class="transition-all duration-200 hover:shadow-md">
      <CardHeader class="py-3 px-4">
        <CardTitle class="flex items-center gap-2 text-sm">
          <div class="p-1 rounded bg-blue-100 dark:bg-blue-900/50">
            <Icon
              name="lucide:box"
              class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400"
            />
          </div>
          Model Information
        </CardTitle>
      </CardHeader>
      <CardContent class="px-4 pb-4 pt-0">
        <div v-if="associations" class="space-y-0.5">
          <div
            class="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 transition-colors"
          >
            <span class="text-muted-foreground text-xs">Model ID</span>
            <code class="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
              {{ associations.model_id }}
            </code>
          </div>
          <div
            class="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 transition-colors"
          >
            <span class="text-muted-foreground text-xs">Name</span>
            <span class="text-sm font-medium">{{
              associations.model_name
            }}</span>
          </div>
          <div
            class="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 transition-colors"
          >
            <span class="text-muted-foreground text-xs">Description</span>
            <span class="text-sm">{{ associations.model_description }}</span>
          </div>
          <div
            class="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 transition-colors"
          >
            <span class="text-muted-foreground text-xs">User</span>
            <span class="text-sm">{{ associations.user_id }}</span>
          </div>
          <div
            class="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 transition-colors"
          >
            <span class="text-muted-foreground text-xs">Registered</span>
            <span class="text-sm">{{
              formatDate(associations.register_date)
            }}</span>
          </div>
        </div>
        <div
          v-else
          class="flex flex-col items-center justify-center text-muted-foreground text-xs py-4"
        >
          <Icon name="lucide:box" class="w-6 h-6 mb-1 opacity-50" />
          <span>No model information available</span>
        </div>
      </CardContent>
    </Card>

    <!-- Datasets Card -->
    <Card class="transition-all duration-200 hover:shadow-md">
      <CardHeader class="py-3 px-4">
        <CardTitle class="flex items-center gap-2 text-sm">
          <div class="p-1 rounded bg-green-100 dark:bg-green-900/50">
            <Icon
              name="lucide:database"
              class="w-3.5 h-3.5 text-green-600 dark:text-green-400"
            />
          </div>
          Associated Datasets
          <Badge
            v-if="associations?.datasets?.length"
            variant="secondary"
            class="ml-auto text-xs"
          >
            {{ associations.datasets.length }}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent class="px-4 pb-4 pt-0">
        <div v-if="associations?.datasets?.length" class="space-y-2">
          <div
            v-for="dataset in associations.datasets"
            :key="dataset.id || dataset.name"
            class="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
          >
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-md bg-green-100 dark:bg-green-900/30">
                <Icon
                  name="lucide:database"
                  class="w-4 h-4 text-green-600 dark:text-green-400"
                />
              </div>
              <div>
                <p class="text-sm font-medium">
                  {{ dataset.name || dataset.dataset_name }}
                </p>
                <p
                  v-if="dataset.description"
                  class="text-xs text-muted-foreground"
                >
                  {{ dataset.description }}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" class="h-7">
              <Icon name="lucide:external-link" class="w-3 h-3" />
            </Button>
          </div>
        </div>
        <div
          v-else
          class="flex flex-col items-center justify-center text-muted-foreground text-xs py-4"
        >
          <Icon name="lucide:database" class="w-6 h-6 mb-1 opacity-50" />
          <span>No datasets associated</span>
        </div>
      </CardContent>
    </Card>

    <!-- Artifact Path Card -->
    <Card
      v-if="associations?.artifacts?.artifact_uri"
      class="transition-all duration-200 hover:shadow-md"
    >
      <CardHeader class="py-3 px-4">
        <CardTitle class="flex items-center gap-2 text-sm">
          <div class="p-1 rounded bg-purple-100 dark:bg-purple-900/50">
            <Icon
              name="lucide:folder-symlink"
              class="w-3.5 h-3.5 text-purple-600 dark:text-purple-400"
            />
          </div>
          Path
        </CardTitle>
      </CardHeader>
      <CardContent class="px-4 pb-4 pt-0">
        <div
          class="flex items-center justify-between gap-2 p-3 rounded-lg border bg-muted/20"
        >
          <div class="flex items-center gap-2 min-w-0">
            <Icon
              name="lucide:cloud"
              class="w-4 h-4 text-muted-foreground flex-shrink-0"
            />
            <code class="text-xs font-mono text-muted-foreground break-all">
              {{ associations.artifacts.artifact_uri }}
            </code>
          </div>
          <Button
            variant="ghost"
            size="sm"
            class="h-7 px-2 flex-shrink-0"
            @click="copyPath"
          >
            <Icon
              :name="copied ? 'lucide:check' : 'lucide:copy'"
              class="w-3.5 h-3.5"
            />
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script lang="ts" setup>
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card';

const props = defineProps<{
  associations: any;
  loading?: boolean;
}>();

const dayjs = useDayjs();
const copied = ref(false);

const formatDate = (date: string) => {
  if (!date) return '-';
  return dayjs(date).format('MMM DD, YYYY HH:mm');
};

const copyPath = async () => {
  if (!props.associations?.artifacts?.artifact_uri) return;

  try {
    await navigator.clipboard.writeText(
      props.associations.artifacts.artifact_uri,
    );
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};
</script>
