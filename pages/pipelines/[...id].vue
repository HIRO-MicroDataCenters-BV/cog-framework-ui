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
  nodeIds: string[],
  edges: Array<{ source: string; target: string }>,
) => {
  const positions: Record<string, { x: number; y: number }> = {};
  const levels: Record<number, string[]> = {};
  const memo = new Map<string, number>();

  // Layout configuration
  const NODE_WIDTH = 200;
  const NODE_SPACING = 50;
  const LEVEL_HEIGHT = 150;
  const LEVEL_OFFSET = 50;
  const CENTER_X = 400;

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

  const groupNodesByType = (nodeNames: string[]) => ({
    training: nodeNames.filter((name) => name.startsWith('federated-client')),
    evaluate: nodeNames.filter((name) => name.startsWith('evaluate-model')),
    other: nodeNames.filter(
      (name) =>
        !name.startsWith('federated-client') &&
        !name.startsWith('evaluate-model'),
    ),
  });

  const positionNodesOnLevel = (nodeNames: string[], level: number) => {
    const y = level * LEVEL_HEIGHT + LEVEL_OFFSET;
    const { other, training, evaluate } = groupNodesByType(nodeNames);
    const allNodes = [...other, ...training, ...evaluate];
    
    if (allNodes.length === 1) {
      positions[allNodes[0]] = { x: CENTER_X, y };
      return;
    }
    
    allNodes.forEach((nodeName, index) => {
      const offset =
        (index - (allNodes.length - 1) / 2) *
        (NODE_WIDTH + NODE_SPACING);
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

  const topDag = findDagByName(entrypoint) || templates.find((t) => t.dag);
  const taskDetails = pipelineData.run_details?.task_details || [];

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
      position: fallbackPosition,
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
          inputs: resolveInputs(
            template,

            topDag?.dag?.tasks?.find((t) => t.template === template.name),
          ),
        },
      },
    };
  };

  const createEdge = (source: string, target: string): Edge => ({
    id: `edge-${source}-${target}`,
    source,
    target,
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

  // Get node IDs for layout calculation
  const nodeIdsForLayout = templates.filter((t) => !t.dag).map((t) => t.name);

  // Create nodes first
  const nodes = templates
    .filter((template) => !template.dag)
    .map((template, index) => createNode(template, index));

  const edgesArray = Array.from(edgePairs)
    .map((key) => key.split('=>'))
    .filter(
      ([source, target]) =>
        nodes.some((n) => n.id === source) &&
        nodes.some((n) => n.id === target),
    )
    .map(([source, target]) => createEdge(source, target));
  const nodePositions = calculateNodePositions(
    nodeIdsForLayout,
    edgesArray.map((e) => ({ source: e.source, target: e.target })),
  );

  nodes.forEach((n) => {
    n.position = nodePositions[n.id] || n.position;
  });

  return { nodes, edges: edgesArray };
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
  // route.params.id is an array because of [...id].vue catch-all route
  const runId = Array.isArray(route.params.id) 
    ? route.params.id[0] 
    : route.params.id as string;
  const api = useApi();

  const data = await api.getPipelineRunFlow(runId);
  if (!data) return;

  pipelineData.value = data as PipelineData;

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
    if (versionData && 'data' in versionData && versionData.data) {
      // Inject the pipeline_spec from version into pipelineData
      pipelineData.value.pipeline_spec = versionData.data.pipeline_spec;
    }
  }

  const { nodes, edges } = convertPipelineToVueFlow(pipelineData.value);

  console.log('edges', edges)
  
  
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
                  <CopyPaste
                    v-else-if="key === 'run_id' || key === 'experiment_id'"
                    :has-copy="true"
                    :copy-text="String(value)"
                  >
                    {{ shortenUuid(String(value)) }}
                  </CopyPaste>
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
