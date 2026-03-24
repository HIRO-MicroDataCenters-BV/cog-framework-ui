<script lang="ts" setup>
import { Position, MarkerType } from '@vue-flow/core';
import type {
  Node,
  Edge,
  PipelineTemplate,
  TaskDetail,
  PipelineData,
  ComponentInput,
} from '~/types/builder.types';
import { shortenUuid } from '~/utils';
import CopyPaste from '~/components/app/CopyPaste.vue';
import SimpleTabs from '~/components/app/SimpleTabs.vue';
import PipelineRunSheet from '~/components/app/PipelineRunSheet.vue';
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card';
import Badge from '~/components/ui/badge/Badge.vue';
import { Spinner } from '~/components/ui/spinner';

const { setPage } = useApp();
const { initialize: resetBuilderGraph } = usePipelineBuilder();
const { t } = useI18n();
const route = useRoute();

const pipelineRunRouteId = computed(() => {
  const id = route.params.id;
  return Array.isArray(id) ? id[0] : (id as string);
});

const pipelineData = ref<PipelineData | null>(null);
const isRunSheetOpen = ref(false);
const selectedNodeName = ref<string | null>(null);
const isPipelineFlowLoading = ref(false);

const activeTab = ref<'flow' | 'details'>('flow');
const tabs = [
  { key: 'flow', label: 'Flow' },
  { key: 'details', label: 'Details' },
];

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
  nodeIds: string[],
  edges: Array<{ source: string; target: string }>,
) => {
  const positions: Record<string, { x: number; y: number }> = {};
  const levels: Record<number, string[]> = {};
  const memo = new Map<string, number>();

  // Layout configuration
  const NODE_WIDTH = 200;
  const NODE_SPACING = 50;
  const LEVEL_HEIGHT = 180; // Vertical spacing between levels
  const LEVEL_OFFSET = 100;
  const CENTER_X = 400;
  const NODE_HORIZONTAL_SPACING = 300; // Horizontal spacing between nodes on same level

  const incoming = new Map<string, Set<string>>();
  nodeIds.forEach((id) => incoming.set(id, new Set()));
  edges.forEach(({ source, target }) => {
    if (!incoming.has(target)) incoming.set(target, new Set());
    incoming.get(target)!.add(source);
    if (!incoming.has(source)) incoming.set(source, new Set());
  });

  const getLevel = (id: string, stack = new Set<string>()): number => {
    if (memo.has(id)) return memo.get(id)!;
    if (stack.has(id)) return 0;
    stack.add(id);
    const parents = Array.from(incoming.get(id) || []);
    const level = parents.length
      ? Math.max(...parents.map((p) => getLevel(p, new Set(stack)))) + 1
      : 0;
    memo.set(id, level);
    return level;
  };

  nodeIds.forEach((id) => {
    const lvl = getLevel(id);
    if (!levels[lvl]) levels[lvl] = [];
    levels[lvl].push(id);
  });

  const positionNodesOnLevel = (nodeNames: string[], level: number) => {
    // Vertical layout: level determines Y position (top to bottom)
    const y = level * LEVEL_HEIGHT + LEVEL_OFFSET;

    // Calculate average X position of parent nodes for each node
    const getParentAvgX = (nodeName: string): number => {
      const parents = Array.from(incoming.get(nodeName) || []);
      if (parents.length === 0) return 0;

      const parentXs = parents
        .map((p) => positions[p]?.x)
        .filter((x) => x !== undefined);

      if (parentXs.length === 0) return 0;
      return parentXs.reduce((sum, x) => sum + x, 0) / parentXs.length;
    };

    // Sort nodes by average parent X position (left to right)
    const sorted = [...nodeNames].sort((a, b) => {
      const avgA = getParentAvgX(a);
      const avgB = getParentAvgX(b);

      // Sort by parent position
      if (avgA !== avgB) return avgA - avgB;

      // Fallback to alphabetical
      return a.localeCompare(b);
    });

    if (sorted.length === 1) {
      positions[sorted[0]] = { x: CENTER_X, y };
      return;
    }

    sorted.forEach((nodeName, index) => {
      const offset =
        (index - (sorted.length - 1) / 2) * NODE_HORIZONTAL_SPACING;
      positions[nodeName] = { x: CENTER_X + offset, y };
    });
  };

  Object.entries(levels).forEach(([levelStr, nodeNames]) => {
    positionNodesOnLevel(nodeNames, parseInt(levelStr));
  });

  return positions;
};

const convertPipelineToVueFlow = (pipelineData: PipelineData) => {
  const pipelineSpec = pipelineData?.pipeline_spec?.spec;
  const color = 'hsl(var(--muted-foreground))';
  const arrowSize = 11; // Match editor arrow size
  if (!pipelineSpec?.templates) {
    return { nodes: [], edges: [] };
  }

  const { templates, entrypoint } = pipelineSpec as {
    templates: PipelineTemplate[];
    entrypoint?: string;
  };

  const nameToTemplate = new Map<string, PipelineTemplate>();
  templates.forEach((tpl) => nameToTemplate.set(tpl.name, tpl));

  const findDagByName = (name?: string) => {
    if (!name) return undefined;
    const tpl = nameToTemplate.get(name);
    return tpl && (tpl as PipelineTemplate).dag ? tpl : undefined;
  };

  // Find a task by its template name across all DAG templates
  const findTaskByTemplateName = (templateName: string) => {
    for (const template of templates) {
      if (template.dag?.tasks) {
        const task = template.dag.tasks.find(
          (t) => t.template === templateName,
        );
        if (task) {
          return task;
        }
      }
    }
    return undefined;
  };

  const topDag = findDagByName(entrypoint) || templates.find((t) => t.dag);
  const taskDetails = pipelineData.run_details?.task_details || [];
  const onExitTemplateName = (pipelineSpec as { onExit?: string })?.onExit;

  const findTaskDetailForTemplate = (templateName: string) => {
    const exact = taskDetails.find((t) => t.display_name === templateName);
    if (exact) return exact;
    if (templateName === onExitTemplateName) {
      return taskDetails.find((t) => t.display_name?.endsWith('.onExit'));
    }
    return undefined;
  };

  const resolveInputs = (
    template: PipelineTemplate,

    task?: {
      arguments?: { parameters?: Array<{ name: string; value: string }> };
    },
  ): ComponentInput[] => {
    const inputs: ComponentInput[] = [];
    const argsMap = new Map<string, string>();

    if (task?.arguments?.parameters) {
      task.arguments.parameters.forEach((p) => argsMap.set(p.name, p.value));
    }

    // Iterate over template inputs
    const paramInputs = template.inputs?.parameters || [];

    paramInputs.forEach((param) => {
      const providedValue = argsMap.get(param.name);

      if (providedValue) {
        // Check for Pipeline Input Param: {{ inputs.parameters.x }}
        const pipelineParamMatch = providedValue.match(
          /\{\{\s*inputs\.parameters\.([a-zA-Z0-9_]+)\s*\}\}/,
        );

        if (pipelineParamMatch) {
          inputs.push({
            destination: param.name,
            value_source_type: 'pipeline_inputparam',
            source: pipelineParamMatch[1],
          });
          return;
        }

        // Check for Component Output: {{ tasks.taskName.outputs.parameters.y }}
        const componentOutputMatch = providedValue.match(
          /\{\{\s*tasks\.([a-zA-Z0-9_.-]+)\.outputs\.parameters\.([a-zA-Z0-9_]+)\s*\}\}/,
        );

        if (componentOutputMatch) {
          inputs.push({
            destination: param.name,
            value_source_type: 'component_output',
            source: `${componentOutputMatch[1]}.${componentOutputMatch[2]}`,
          });
          return;
        }

        // Constant
        inputs.push({
          destination: param.name,
          value_source_type: 'constant',
          source: providedValue,
        });
      }
    });

    return inputs;
  };

  const createNode = (template: PipelineTemplate, index: number): Node => {
    const taskDetail = findTaskDetailForTemplate(template.name);
    const fallbackPosition = {
      x: (index % 3) * 300 + 100,
      y: Math.floor(index / 3) * 200 + 100,
    };
    const displayName =
      template.metadata?.annotations?.[
        'pipelines.kubeflow.org/task_display_name'
      ];

    return {
      id: template.name,
      type: 'default',
      position: fallbackPosition,
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
      data: {
        label: template.name,
        displayName: displayName || null,
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
          inputs: resolveInputs(
            template,
            findTaskByTemplateName(template.name),
          ),
        },
      },
    };
  };

  const createEdge = (
    source: string,
    target: string,
    sourceHandle?: string,
    targetHandle?: string,
  ): Edge => ({
    id: `edge-${source}-${target}`,
    source,
    target,
    sourceHandle,
    targetHandle,
    style: { stroke: color, strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: arrowSize,
      height: arrowSize,
      color,
    },
  });

  // Map output parameter/artifact names to producer template
  const outputNameToProducer = new Map<string, string>();
  templates.forEach((tpl) => {
    const params = (tpl.outputs as any)?.parameters as Array<{ name: string }>; // eslint-disable-line @typescript-eslint/no-explicit-any
    const arts = (tpl.outputs as any)?.artifacts as Array<{ name: string }>; // eslint-disable-line @typescript-eslint/no-explicit-any
    params?.forEach((p) => outputNameToProducer.set(p.name, tpl.name));
    arts?.forEach((a) => outputNameToProducer.set(a.name, tpl.name));
  });
  // Resolve a task name (from DAG dependencies) to leaf container template names
  const getLeafContainersForTaskName = (
    taskName: string,
    withinDag?: PipelineTemplate,
  ): string[] => {
    // If we have a DAG context, find the task definition by name to get its template
    const taskTplName = withinDag?.dag?.tasks?.find(
      (t: { name: string; template: string }) => t.name === taskName,
    )?.template as string | undefined;
    const candidateName = taskTplName || taskName;
    return getLeafContainersForTemplate(candidateName);
  };

  const getLeafContainersForTemplate = (
    templateName: string,
    seen = new Set<string>(),
  ): string[] => {
    if (seen.has(templateName)) return [];
    seen.add(templateName);
    const tpl = nameToTemplate.get(templateName);
    if (!tpl) return [];
    if (!(tpl as PipelineTemplate).dag) {
      return [tpl.name];
    }
    const dagTpl = tpl as PipelineTemplate;
    const children = dagTpl.dag?.tasks || [];
    const results: string[] = [];
    children.forEach((task: { template: string }) => {
      results.push(...getLeafContainersForTemplate(task.template, seen));
    });
    return Array.from(new Set(results));
  };

  // Collect edges from the entrypoint DAG, resolving to leaf containers
  const edgePairs = new Set<string>();
  if (topDag?.dag?.tasks?.length) {
    topDag.dag.tasks.forEach(
      (task: {
        template: string;
        dependencies?: string[];
        arguments?: { parameters?: Array<{ name: string; value: string }> };
      }) => {
        const targets = getLeafContainersForTemplate(task.template);
        const deps: string[] = task.dependencies || [];
        deps.forEach((depName: string) => {
          const sources = getLeafContainersForTaskName(depName, topDag);
          sources.forEach((s) =>
            targets.forEach((t) => edgePairs.add(`${s}=>${t}`)),
          );
        });

        // Also parse task arguments for {{tasks.XXX.outputs.parameters.YYY}} references
        const taskOutputRef =
          /\{\{\s*tasks\.([a-zA-Z0-9_-]+)\.outputs\.parameters\.([a-zA-Z0-9_.-]+)\s*\}\}/g;
        const params = task.arguments?.parameters || [];
        params.forEach((param) => {
          const matches = Array.from(
            param.value?.matchAll(taskOutputRef) || [],
          );
          matches.forEach((m) => {
            const sourceTaskName = m[1]; // e.g., "download-data"
            const sources = getLeafContainersForTaskName(
              sourceTaskName,
              topDag,
            );
            sources.forEach((s) =>
              targets.forEach((t) => edgePairs.add(`${s}=>${t}`)),
            );
          });
        });
      },
    );
  }

  // Heuristic: implicit edges from parameter references in container args
  const jinjaParamRef = /\{\{\s*inputs\.parameters\.([a-zA-Z0-9_.-]+)\s*\}\}/g;
  templates
    .filter(
      (tpl) =>
        !(tpl as PipelineTemplate).dag &&
        (tpl as PipelineTemplate & { container?: { args?: unknown[] } })
          .container,
    )
    .forEach((tpl) => {
      const args: unknown[] = ((
        tpl as PipelineTemplate & { container?: { args?: unknown[] } }
      ).container?.args || []) as unknown[];
      const argStr = args.join(' ');
      const matches = Array.from(argStr.matchAll(jinjaParamRef));
      matches.forEach((m) => {
        const paramName = m[1];
        const producer = outputNameToProducer.get(paramName);
        if (producer && producer !== tpl.name) {
          edgePairs.add(`${producer}=>${tpl.name}`);
        }
      });
    });

  // onExit handler runs after main DAG completes: add edges from all leaf nodes to it
  if (onExitTemplateName && entrypoint) {
    const mainDagLeaves = getLeafContainersForTemplate(entrypoint);
    mainDagLeaves.forEach((leaf) =>
      edgePairs.add(`${leaf}=>${onExitTemplateName}`),
    );
  }

  // Get node IDs for layout calculation
  const nodeIdsForLayout = templates.filter((t) => !t.dag).map((t) => t.name);

  // Create nodes first
  const nodes = templates
    .filter((template) => !template.dag)
    .map((template, index) => createNode(template, index));

  console.log('[EdgePairs]', Array.from(edgePairs));

  const edgesArray = Array.from(edgePairs)
    .map((key) => key.split('=>'))
    .filter(
      ([producer, consumer]) =>
        nodes.some((n) => n.id === producer) &&
        nodes.some((n) => n.id === consumer),
    )
    .map(([producer, consumer]) => {
      console.log(
        `[CreateEdge] producer=${producer}, consumer=${consumer} => edge(source=${producer}, target=${consumer})`,
      );

      // Find producer and consumer nodes to get their handles
      const producerNode = nodes.find((n) => n.id === producer);
      const consumerNode = nodes.find((n) => n.id === consumer);

      // Get first output handle from producer and first input handle from consumer
      const sourceHandle =
        producerNode?.data?.component?.output_path?.[0]?.name;
      const targetHandle = consumerNode?.data?.component?.input_path?.[0]?.name;

      // producer has output (source), consumer has input (target)
      return createEdge(producer, consumer, sourceHandle, targetHandle);
    });
  const nodePositions = calculateNodePositions(
    nodeIdsForLayout,
    edgesArray.map((e) => ({ source: e.source, target: e.target })),
  );

  nodes.forEach((n) => {
    n.position = nodePositions[n.id] || n.position;
  });

  // Filter nodes based on status to implement progressive disclosure
  const filterNodesByStatus = (
    allNodes: Node[],
    allEdges: Edge[],
  ): { nodes: Node[]; edges: Edge[] } => {
    // Build parent -> children map
    const childrenMap = new Map<string, Set<string>>();
    allNodes.forEach((node) => childrenMap.set(node.id, new Set()));

    allEdges.forEach((edge) => {
      if (!childrenMap.has(edge.source)) {
        childrenMap.set(edge.source, new Set());
      }
      childrenMap.get(edge.source)!.add(edge.target);
    });

    // Get all descendants (recursive)
    const getAllDescendants = (
      nodeId: string,
      seen = new Set<string>(),
    ): Set<string> => {
      if (seen.has(nodeId)) return new Set();
      seen.add(nodeId);

      const descendants = new Set<string>();
      const children = childrenMap.get(nodeId) || new Set();

      children.forEach((child) => {
        descendants.add(child);
        const childDescendants = getAllDescendants(child, seen);
        childDescendants.forEach((d) => descendants.add(d));
      });

      return descendants;
    };

    // Get direct children only
    const getDirectChildren = (nodeId: string): Set<string> => {
      return childrenMap.get(nodeId) || new Set();
    };

    // Determine which nodes to hide
    const nodesToHide = new Set<string>();

    allNodes.forEach((node) => {
      const status = node.data?.status;

      if (status === 'pending') {
        // Pending: hide all descendants
        const descendants = getAllDescendants(node.id);
        descendants.forEach((d) => nodesToHide.add(d));
      } else if (status === 'running') {
        // Running: hide all descendants except direct children
        const allDescendants = getAllDescendants(node.id);
        const directChildren = getDirectChildren(node.id);

        allDescendants.forEach((d) => {
          if (!directChildren.has(d)) {
            nodesToHide.add(d);
          }
        });
      }
      // succeeded/failed: show all (don't hide anything)
    });

    // Filter nodes and edges
    const visibleNodes = allNodes.filter((node) => !nodesToHide.has(node.id));
    const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));
    const visibleEdges = allEdges.filter(
      (edge) =>
        visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target),
    );

    return { nodes: visibleNodes, edges: visibleEdges };
  };

  const { nodes: filteredNodes, edges: filteredEdges } = filterNodesByStatus(
    nodes,
    edgesArray,
  );

  return { nodes: filteredNodes, edges: filteredEdges };
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
  items: Array<{ name: string; type?: string }> | undefined,
  defaultType: string,
) =>
  items?.map((item) => ({ name: item.name, type: item.type || defaultType })) ||
  [];

const getInputPaths = (template: PipelineTemplate) => [
  ...extractPaths(template.inputs?.artifacts, 'Dataset'),
  ...extractPaths(template.inputs?.parameters, 'String'),
];

const getOutputPaths = (template: PipelineTemplate) => [
  ...extractPaths(template.outputs?.artifacts, 'Dataset'),
  ...extractPaths(template.outputs?.parameters, 'String'),
];

const fetchPipelineData = async (expectedRunId: string) => {
  const api = useApi();

  const isStale = () => pipelineRunRouteId.value !== expectedRunId;

  try {
    const data = await api.getPipelineRunFlow(expectedRunId);
    if (isStale()) return;
    if (!data) return;

    pipelineData.value = data as PipelineData;
    const run = data as Record<string, unknown>;

    // Derive run details from KFP v2beta1 run (same shape as Details tab expects)
    const createdAt = run.created_at as string | undefined;
    const finishedAt = run.finished_at as string | undefined;
    let duration: string = '-';
    if (createdAt && finishedAt) {
      const ms = new Date(finishedAt).getTime() - new Date(createdAt).getTime();
      const totalSec = Math.max(0, Math.floor(ms / 1000));
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      duration = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    const experimentRef = run.experiment as Record<string, unknown> | undefined;
    const experimentId =
      experimentRef?.experiment_id ??
      (run.experiment_id as string | undefined) ??
      '';
    runDetails.value = {
      run_id: run.run_id,
      experiment_id: experimentId,
      status:
        (run.state as string | undefined) ||
        (run.status as string | undefined) ||
        '',
      start_time: createdAt ?? null,
      duration,
    };

    // If pipeline uses pipeline_version_reference, fetch the spec from pipeline_version API
    if (
      pipelineData.value.pipeline_version_reference &&
      !pipelineData.value.pipeline_spec
    ) {
      const { pipeline_id, pipeline_version_id } =
        pipelineData.value.pipeline_version_reference;

      const versionData = await api.getPipelineVersion(
        pipeline_id,
        pipeline_version_id,
      );
      if (isStale()) return;
      if (versionData && 'data' in versionData && versionData.data) {
        // Inject the pipeline_spec from version into pipelineData
        pipelineData.value.pipeline_spec = versionData.data.pipeline_spec;
      }
    }

    if (isStale()) return;

    const { nodes, edges } = convertPipelineToVueFlow(pipelineData.value);

    const title = pipelineData.value.display_name || 'Pipeline';

  setPage({
    section: 'pipeline_runs',
    title,
      data: {
        builder: {
          name: title,
          nodes,
          edges,
          pipelineData: pipelineData.value,
        },
      },
    });
  } finally {
    if (pipelineRunRouteId.value === expectedRunId) {
      isPipelineFlowLoading.value = false;
    }
  }
};

const runDetails = ref<Record<string, unknown> | null>(null);

watch(
  pipelineRunRouteId,
  async (runId, prevRunId) => {
    if (!runId || runId === prevRunId) return;

    isRunSheetOpen.value = false;
    selectedNodeName.value = null;
    isPipelineFlowLoading.value = true;
    pipelineData.value = null;
    runDetails.value = null;
    resetBuilderGraph([], []);

    await fetchPipelineData(runId);
  },
  { immediate: true },
);

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
</script>

<template>
  <div class="h-[calc(100svh-74px)] w-full flex flex-col overflow-hidden">
    <div class="flex items-center justify-between flex-shrink-0 pr-4">
      <SimpleTabs v-model="activeTab" :tabs="tabs" />
    </div>

    <div class="flex-1 overflow-hidden">
      <div v-if="activeTab === 'flow'" class="relative h-full">
        <AppBuilder
          :key="String(pipelineRunRouteId ?? '')"
          :readonly="true"
          @node-click="
            (node) => {
              isRunSheetOpen = !!node;
              selectedNodeName = node?.id || null;
            }
          "
        />

        <div
          v-if="isPipelineFlowLoading"
          class="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-[1px]"
          aria-busy="true"
          aria-live="polite"
        >
          <Spinner class="w-8 h-8 text-muted-foreground" />
        </div>

        <PipelineRunSheet
          :open="isRunSheetOpen"
          :run="pipelineData"
          :selected-node-name="selectedNodeName"
          @update:open="(v) => (isRunSheetOpen = v)"
        />
      </div>

      <div v-else class="h-full p-4 overflow-y-auto">
        <div v-if="runDetails" class="max-w-4xl space-y-4">
          <Card class="transition-all duration-200 hover:shadow-md">
            <CardHeader class="py-3 px-4">
              <CardTitle class="flex items-center gap-2 text-sm">
                <div class="p-1 rounded bg-blue-100 dark:bg-blue-900/50">
                  <Icon
                    name="lucide:info"
                    class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400"
                  />
                </div>
                {{ t('title.run_details') }}
              </CardTitle>
            </CardHeader>
            <CardContent class="px-4 pb-4 pt-0">
              <!-- Two-column responsive grid like model metrics table -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0.5">
                <div
                  v-for="(value, key) in runDetails"
                  :key="key"
                  class="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 transition-colors"
                >
                  <span
                    class="text-muted-foreground text-xs flex items-center gap-1"
                  >
                    <Icon :name="getKeyIcon(key)" class="w-3 h-3" />
                    {{ t(`label.${key}`) }}
                  </span>
                  <span
                    class="text-xs font-medium text-right max-w-[55%] bg-muted px-1.5 py-0.5 rounded"
                  >
                    <span
                      v-if="
                        typeof value === 'string' &&
                        value.includes('T') &&
                        value.includes('+')
                      "
                    >
                      {{ new Date(value).toLocaleString() }}
                    </span>
                    <Badge
                      v-else-if="key === 'status'"
                      :value="String(value).toLowerCase() || 'pending'"
                      type="status"
                      class="text-[11px]"
                    />
                    <CopyPaste
                      v-else-if="key === 'run_id' || key === 'experiment_id'"
                      :has-copy="true"
                      :copy-text="String(value)"
                    >
                      <code class="text-[11px] font-mono">
                        {{ shortenUuid(String(value)) }}
                      </code>
                    </CopyPaste>
                    <span v-else>{{ value }}</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div v-else class="flex items-center justify-center h-64">
          <div class="text-gray-500">{{ t('hint.loading') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
