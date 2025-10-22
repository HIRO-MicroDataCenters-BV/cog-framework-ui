<script lang="ts" setup>
import { Position } from '@vue-flow/core';
import type { Node, Edge } from '~/types/builder.types';

interface PipelineTemplate {
  name: string;
  container?: Record<string, unknown>;
  inputs?: {
    artifacts?: Array<{ name: string }>;
    parameters?: Array<{ name: string }>;
  };
  outputs?: {
    artifacts?: Array<{ name: string }>;
    parameters?: Array<{ name: string }>;
  };
  dag?: {
    tasks: Array<{
      name: string;
      dependencies?: string[];
    }>;
  };
}

interface TaskDetail {
  display_name: string;
  state: string;
}

interface PipelineData {
  display_name: string;
  pipeline_spec: {
    spec: {
      templates: PipelineTemplate[];
    };
  };
  run_details?: {
    task_details: TaskDetail[];
  };
}

const { setPage, page } = useApp();
const { t } = useI18n();

const pipelineData = ref<PipelineData | null>(null);

const tabs = ref([
  {
    label: 'flow',
    value: 'flow',
  },
  {
    label: 'details',
    value: 'details',
  },
]);

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
      for (const [level, nodes] of Object.entries(levels)) {
        if (nodes.includes(nodeName)) return parseInt(level);
      }
      return 0;
    }

    const task = dagTasks.find((t) => t.name === nodeName);
    if (!task || !task.dependencies || task.dependencies.length === 0) {
      return 0;
    }

    const maxDepLevel = Math.max(
      ...task.dependencies.map((dep: string) =>
        getNodeLevel(dep, new Set(visited)),
      ),
    );
    return maxDepLevel + 1;
  };

  templates.forEach((template) => {
    if (template.dag) return;

    const level = getNodeLevel(template.name);
    if (!levels[level]) levels[level] = [];
    levels[level].push(template.name);
    processed.add(template.name);
  });

  Object.entries(levels).forEach(([levelStr, nodeNames]) => {
    const level = parseInt(levelStr);
    const y = level * 300 + 100;

    const trainingNodes = nodeNames.filter((name) =>
      name.startsWith('training'),
    );
    const evaluateNodes = nodeNames.filter((name) =>
      name.startsWith('evaluate-model'),
    );
    const otherNodes = nodeNames.filter(
      (name) =>
        !name.startsWith('training') && !name.startsWith('evaluate-model'),
    );

    const nodeWidth = 280;
    const nodeSpacing = 80;
    const centerX = 500;

    const allNodes = [...otherNodes, ...trainingNodes, ...evaluateNodes];

    if (allNodes.length === 1) {
      positions[allNodes[0]] = { x: centerX, y };
      return;
    }

    allNodes.forEach((nodeName, index) => {
      const offset =
        (index - (allNodes.length - 1) / 2) * (nodeWidth + nodeSpacing);
      const x = centerX + offset;
      positions[nodeName] = { x, y };
    });
  });

  return positions;
};

const convertPipelineToVueFlow = (pipelineData: PipelineData) => {
  if (!pipelineData?.pipeline_spec?.spec?.templates) {
    return { nodes: [], edges: [] };
  }

  const templates = pipelineData.pipeline_spec.spec.templates;
  const dag = pipelineData.pipeline_spec.spec.templates.find((t) => t.dag);
  const taskDetails = pipelineData.run_details?.task_details || [];

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const nodePositions = calculateNodePositions(
    templates,
    dag?.dag?.tasks || [],
  );

  templates.forEach((template, index) => {
    if (template.dag) return;

    const taskDetail = taskDetails.find(
      (task) => task.display_name === template.name,
    );
    const status = getTaskStatus(taskDetail);

    const node: Node = {
      id: template.name,
      type: 'default',
      position: nodePositions[template.name] || {
        x: (index % 3) * 300 + 100,
        y: Math.floor(index / 3) * 200 + 100,
      },
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
      data: {
        label: template.name,
        status: status,
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

    nodes.push(node);
  });

  if (dag?.dag?.tasks) {
    dag.dag.tasks.forEach((task) => {
      if (task.dependencies && task.dependencies.length > 0) {
        task.dependencies.forEach((dependency) => {
          const sourceExists = nodes.some((node) => node.id === dependency);
          const targetExists = nodes.some((node) => node.id === task.name);

          if (sourceExists && targetExists) {
            const edge: Edge = {
              id: `edge-${dependency}-${task.name}`,
              source: dependency,
              target: task.name,
              style: {
                stroke: '#9BB2BB',
                strokeWidth: 2,
              },
              markerEnd: {
                type: 'arrowclosed',
                width: 20,
                height: 20,
                color: '#9BB2BB',
              },
            };
            edges.push(edge);
          }
        });
      }
    });
  }

  return { nodes, edges };
};

const getTaskStatus = (taskDetail: TaskDetail | undefined) => {
  if (!taskDetail) return 'pending';

  switch (taskDetail.state) {
    case 'SUCCEEDED':
      return 'succeeded';
    case 'FAILED':
      return 'failed';
    case 'RUNNING':
      return 'running';
    case 'PENDING':
      return 'pending';
    default:
      return 'pending';
  }
};

const getComponentCategory = (template: PipelineTemplate) => {
  const name = template.name.toLowerCase();

  if (name.includes('load') || name.includes('dataset')) return 'data';
  if (name.includes('preprocess') || name.includes('transform'))
    return 'preprocessing';
  if (name.includes('train') || name.includes('training')) return 'training';
  if (name.includes('evaluate') || name.includes('test')) return 'evaluation';
  if (name.includes('best') || name.includes('select')) return 'selection';

  return 'general';
};

const getInputPaths = (template: PipelineTemplate) => {
  const paths: Array<{ name: string; type: string }> = [];

  if (template.inputs?.artifacts) {
    template.inputs.artifacts.forEach((artifact) => {
      paths.push({
        name: artifact.name,
        type: 'Dataset',
      });
    });
  }

  if (template.inputs?.parameters) {
    template.inputs.parameters.forEach((param) => {
      paths.push({
        name: param.name,
        type: 'String',
      });
    });
  }

  return paths;
};

const getOutputPaths = (template: PipelineTemplate) => {
  const paths: Array<{ name: string; type: string }> = [];

  if (template.outputs?.artifacts) {
    template.outputs.artifacts.forEach((artifact) => {
      paths.push({
        name: artifact.name,
        type: 'Dataset',
      });
    });
  }

  if (template.outputs?.parameters) {
    template.outputs.parameters.forEach((param) => {
      paths.push({
        name: param.name,
        type: 'String',
      });
    });
  }

  return paths;
};

const loadPipelineData = async () => {
  try {
    const mockData = await import('~/mocks/get.runs.flow.json');
    pipelineData.value = mockData.default as PipelineData;

    const { nodes, edges } = convertPipelineToVueFlow(pipelineData.value);

    setPage({
      section: 'pipelines',
      title: pipelineData.value.display_name || 'Pipeline',
      data: {
        builder: {
          name: pipelineData.value.display_name || 'Pipeline',
          nodes,
          edges,
        },
      },
    });
  } catch (error) {
    console.error('Error loading pipeline data:', error);
  }
};

onMounted(() => {
  loadPipelineData();
});
</script>

<template>
  <div class="h-[calc(100svh-74px)]">
    <Tabs default-value="flow" class="h-full">
      <div class="w-full h-[52px] px-4">
        <TabsList class="h-full rounded-none bg-transparent gap-4">
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
      <TabsContent value="details">Components</TabsContent>
    </Tabs>
  </div>
</template>
