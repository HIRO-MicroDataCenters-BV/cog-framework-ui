<script lang="ts" setup>
import { Position } from '@vue-flow/core';
import type {
  Node,
  Edge,
  PipelineTemplate,
  TaskDetail,
  PipelineData,
} from '~/types/builder.types';

const { setPage, page } = useApp();
const { t } = useI18n();

const pipelineData = ref<PipelineData | null>(null);

const tabs = ref([
  { label: 'flow', value: 'flow' },
  { label: 'details', value: 'details' },
]);

const LAYOUT_CONFIG = {
  nodeWidth: 280,
  nodeSpacing: 80,
  centerX: 500,
  levelHeight: 300,
  levelOffset: 100,
} as const;

const TASK_STATUS_MAP = {
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  RUNNING: 'running',
  PENDING: 'pending',
} as const;

const CATEGORY_PATTERNS = [
  { patterns: ['load', 'dataset'], category: 'data' },
  { patterns: ['preprocess', 'transform'], category: 'preprocessing' },
  { patterns: ['train', 'training'], category: 'training' },
  { patterns: ['evaluate', 'test'], category: 'evaluation' },
  { patterns: ['best', 'select'], category: 'selection' },
] as const;

const calculateNodePositions = (
  templates: PipelineTemplate[],
  dagTasks: Array<{ name: string; dependencies?: string[] }>,
) => {
  const positions: Record<string, { x: number; y: number }> = {};
  const levels: Record<number, string[]> = {};
  const processed = new Set<string>();

  const getNodeLevel = (
    nodeName: string,
    visited = new Set<string>(),
  ): number => {
    if (visited.has(nodeName)) return 0;
    visited.add(nodeName);

    if (processed.has(nodeName)) {
      const found = Object.entries(levels).find(([, nodes]) =>
        nodes.includes(nodeName),
      );
      return found ? parseInt(found[0]) : 0;
    }

    const task = dagTasks.find((t) => t.name === nodeName);
    if (!task?.dependencies?.length) return 0;

    const maxDepLevel = Math.max(
      ...task.dependencies.map((dep: string) =>
        getNodeLevel(dep, new Set(visited)),
      ),
    );
    return maxDepLevel + 1;
  };

  const groupNodesByType = (nodeNames: string[]) => ({
    training: nodeNames.filter((name) => name.startsWith('training')),
    evaluate: nodeNames.filter((name) => name.startsWith('evaluate-model')),
    other: nodeNames.filter(
      (name) =>
        !name.startsWith('training') && !name.startsWith('evaluate-model'),
    ),
  });

  const positionNodesOnLevel = (nodeNames: string[], level: number) => {
    const y = level * LAYOUT_CONFIG.levelHeight + LAYOUT_CONFIG.levelOffset;
    const { other, training, evaluate } = groupNodesByType(nodeNames);
    const allNodes = [...other, ...training, ...evaluate];

    if (allNodes.length === 1) {
      positions[allNodes[0]] = { x: LAYOUT_CONFIG.centerX, y };
      return;
    }

    allNodes.forEach((nodeName, index) => {
      const offset =
        (index - (allNodes.length - 1) / 2) *
        (LAYOUT_CONFIG.nodeWidth + LAYOUT_CONFIG.nodeSpacing);
      positions[nodeName] = { x: LAYOUT_CONFIG.centerX + offset, y };
    });
  };

  templates
    .filter((template) => !template.dag)
    .forEach((template) => {
      const level = getNodeLevel(template.name);
      if (!levels[level]) levels[level] = [];
      levels[level].push(template.name);
      processed.add(template.name);
    });

  Object.entries(levels).forEach(([levelStr, nodeNames]) => {
    positionNodesOnLevel(nodeNames, parseInt(levelStr));
  });

  return positions;
};

const convertPipelineToVueFlow = (pipelineData: PipelineData) => {
  const pipelineSpec = pipelineData?.pipeline_spec?.spec;
  if (!pipelineSpec?.templates) {
    return { nodes: [], edges: [] };
  }

  const { templates } = pipelineSpec;
  const dag = templates.find((t) => t.dag);
  const taskDetails = pipelineData.run_details?.task_details || [];
  const nodePositions = calculateNodePositions(
    templates,
    dag?.dag?.tasks || [],
  );

  const createNode = (template: PipelineTemplate, index: number): Node => {
    const taskDetail = taskDetails.find(
      (task) => task.display_name === template.name,
    );
    const fallbackPosition = {
      x: (index % 3) * 300 + 100,
      y: Math.floor(index / 3) * 200 + 100,
    };

    return {
      id: template.name,
      type: 'default',
      position: nodePositions[template.name] || fallbackPosition,
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
      data: {
        label: template.name,
        status: getTaskStatus(taskDetail),
        category: getComponentCategory(template),
        component: {
          id: template.name,
          name: template.name,
          input_path: getInputPaths(template),
          output_path: getOutputPaths(template),
          component_file: null,
          category: getComponentCategory(template),
          creator: null,
        },
      },
    };
  };

  const createEdge = (source: string, target: string): Edge => ({
    id: `edge-${source}-${target}`,
    source,
    target,
    style: { stroke: '#9BB2BB', strokeWidth: 2 },
    markerEnd: { type: 'arrowclosed', width: 20, height: 20, color: '#9BB2BB' },
  });

  const nodes = templates
    .filter((template) => !template.dag)
    .map((template, index) => createNode(template, index));

  const edges =
    dag?.dag?.tasks
      ?.flatMap(
        (task) =>
          task.dependencies?.map((dependency) => ({
            source: dependency,
            target: task.name,
          })) || [],
      )
      .filter(
        ({ source, target }) =>
          nodes.some((node) => node.id === source) &&
          nodes.some((node) => node.id === target),
      )
      .map(({ source, target }) => createEdge(source, target)) || [];

  return { nodes, edges };
};

const getTaskStatus = (taskDetail: TaskDetail | undefined) => {
  if (!taskDetail) return 'pending';
  return (
    TASK_STATUS_MAP[taskDetail.state as keyof typeof TASK_STATUS_MAP] ||
    'pending'
  );
};

const getComponentCategory = (template: PipelineTemplate) => {
  const name = template.name.toLowerCase();
  const found = CATEGORY_PATTERNS.find(({ patterns }) =>
    patterns.some((pattern) => name.includes(pattern)),
  );
  return found?.category || 'general';
};

const extractPaths = (
  items: Array<{ name: string }> | undefined,
  type: string,
) => items?.map((item) => ({ name: item.name, type })) || [];

const getInputPaths = (template: PipelineTemplate) => [
  ...extractPaths(template.inputs?.artifacts, 'Dataset'),
  ...extractPaths(template.inputs?.parameters, 'String'),
];

const getOutputPaths = (template: PipelineTemplate) => [
  ...extractPaths(template.outputs?.artifacts, 'Dataset'),
  ...extractPaths(template.outputs?.parameters, 'String'),
];

const fetchPipelineData = async () => {
  const route = useRoute();
  const runId = route.params.id as string;
  const api = useApi();

  const data = await api.getPipelineRunFlow(runId);
  if (!data) return;

  pipelineData.value = data as PipelineData;

  const { nodes, edges } = convertPipelineToVueFlow(pipelineData.value);
  const title = pipelineData.value.display_name || 'Pipeline';

  setPage({
    section: 'pipelines',
    title,
    data: {
      builder: { name: title, nodes, edges },
    },
  });
};

const runDetails = ref<Record<string, unknown> | null>(null);

const getKeyIcon = (key: string) => {
  const iconMap: Record<string, string> = {
    run_id: 'lucide:hash',
    experiment_id: 'lucide:hash',
    status: 'lucide:circle-dot-dashed',
    start_time: 'lucide:calendar',
    duration: 'lucide:timer',
  };

  if (iconMap[key]) {
    return iconMap[key];
  }

  if (key.includes('id') || key.includes('Id')) {
    return 'lucide:hash';
  }

  return 'lucide:text';
};

const fetchRunDetails = async () => {
  const route = useRoute();
  const runId = route.params.id as string;
  const api = useApi();

  const response = await api.getPipelineRunsList({ run_id: runId });
  if (
    response &&
    'data' in response &&
    Array.isArray(response.data) &&
    response.data.length > 0
  ) {
    runDetails.value = response.data[0];
  }
};

onMounted(async () => {
  await Promise.all([fetchPipelineData(), fetchRunDetails()]);
});
</script>

<template>
  <div class="h-[calc(100svh-74px)]">
    <Tabs default-value="flow" class="h-full">
      <div class="w-full h-[52px] px-4 border-b border-gray-200">
        <TabsList class="h-full rounded-none bg-transparent gap-4 py-0">
          <TabsTrigger
            v-for="tab in tabs"
            :key="tab.value"
            class="rounded-none px-0 cursor-pointer border-b border-transparent data-[state=active]:border-b-primary data-[state=active]:shadow-none"
            :value="tab.value"
            >{{ t(`tab.${tab.label}`) }}
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="flow" class="h-full">
        <AppBuilder :readonly="true" />
      </TabsContent>
      <TabsContent value="details" class="h-full p-4">
        <div v-if="runDetails" class="space-y-4">
          <Table class="w-full">
            <TableBody>
              <TableRow
                v-for="(value, key) in runDetails"
                :key="key"
                class="border-b-0"
              >
                <TableCell
                  class="text-left py-3 pr-8 w-20 text-gray-500 font-medium flex items-center gap-2"
                >
                  <span class="size-4"><Icon :name="getKeyIcon(key)" /></span>
                  <span>{{ t(`label.${key}`) }}</span>
                </TableCell>
                <TableCell class="text-left py-3">
                  <span
                    v-if="
                      typeof value === 'string' &&
                      value.includes('T') &&
                      value.includes('+')
                    "
                  >
                    {{ new Date(value).toLocaleString() }}
                  </span>
                  <span v-else-if="key === 'status'">{{ value }}</span>
                  <span v-else>{{ value }}</span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div v-else class="flex items-center justify-center h-64">
          <div class="text-gray-500">{{ t('hint.loading') }}</div>
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template>
