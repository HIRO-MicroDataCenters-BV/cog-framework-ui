import type { Node, Edge, PipelineInputParam } from '~/types/canvas.types';

export const usePipelineBuilder = () => {
  const nodes = useState<Node[]>('builder-nodes', () => []);
  const edges = useState<Edge[]>('builder-edges', () => []);
  const selectedNode = useState<Node | null>(
    'builder-selected-node',
    () => null,
  );
  const pipelineParameters = useState<PipelineInputParam[]>(
    'builder-pipeline-parameters',
    () => [],
  );

  /** Node IDs of components designated as pipeline outputs (multi selection). */
  const outputNodeIds = useState<string[]>('builder-output-node-ids', () => []);

  const initialize = (
    initialNodes: Node[],
    initialEdges: Edge[],
    initialParameters?: PipelineInputParam[],
  ) => {
    // Deep copy to break references to the page object
    nodes.value = initialNodes || [];
    edges.value = initialEdges || [];
    pipelineParameters.value = initialParameters || [];
    outputNodeIds.value = [];
    selectedNode.value = null;
  };

  const addNode = (node: Node) => {
    // Append only. Never reset.
    nodes.value.push(node);
  };

  const removeNode = (nodeId: string) => {
    nodes.value = nodes.value.filter((n) => n.id !== nodeId);
    edges.value = edges.value.filter(
      (e) => e.source !== nodeId && e.target !== nodeId,
    );
    if (selectedNode.value?.id === nodeId) selectedNode.value = null;
    outputNodeIds.value = outputNodeIds.value.filter((id) => id !== nodeId);
  };

  const updateNodePosition = (
    nodeId: string,
    position: { x: number; y: number },
  ) => {
    const node = nodes.value.find((n) => n.id === nodeId);
    if (node) {
      node.position = position;
    }
  };

  // Helper for deep merging to preserve object references and handle reactivity
  const deepMerge = (
    target: Record<string, unknown>,
    source: Record<string, unknown>,
  ) => {
    if (!source || typeof source !== 'object') return;

    for (const key in source) {
      const sourceValue = source[key];

      // Handle Arrays - always replace to trigger reactivity
      if (Array.isArray(sourceValue)) {
        target[key] = [...sourceValue];
      }
      // Handle Objects - merge recursively
      else if (sourceValue !== null && typeof sourceValue === 'object') {
        // Ensure target has an object at this key (create if missing or wrong type)
        if (
          !target[key] ||
          typeof target[key] !== 'object' ||
          Array.isArray(target[key])
        ) {
          target[key] = {};
        }
        // Recursively merge - cast to Record for type safety
        deepMerge(
          target[key] as Record<string, unknown>,
          sourceValue as Record<string, unknown>,
        );
      }
      // Handle primitives and null
      else {
        target[key] = sourceValue;
      }
    }
  };

  const updateNodeData = (
    nodeId: string,
    dataUpdates: Record<string, unknown>,
  ) => {
    const node = nodes.value.find((n) => n.id === nodeId);
    if (node) {
      // Ensure data object exists
      if (!node.data) node.data = { label: 'New Node' };

      // Perform deep merge to mutation state in-place
      deepMerge(node.data, dataUpdates);
    }
  };

  const addEdge = (edge: Edge) => {
    edges.value.push(edge);
  };

  const removeEdge = (edgeId: string) => {
    edges.value = edges.value.filter((e) => e.id !== edgeId);
  };

  const selectNode = (nodeId: string | null) => {
    if (!nodeId) {
      selectedNode.value = null;
      return;
    }
    // Toggle selection: if clicking the same node, deselect it
    if (selectedNode.value?.id === nodeId) {
      selectedNode.value = null;
      return;
    }
    const node = nodes.value.find((n) => n.id === nodeId);
    if (node) {
      selectedNode.value = node;
    }
  };

  const addPipelineParameter = (parameter: PipelineInputParam) => {
    pipelineParameters.value.push(parameter);
  };

  const updatePipelineParameters = (parameters: PipelineInputParam[]) => {
    pipelineParameters.value = parameters;
  };

  /** Toggle a node as a pipeline output (multi-selection). */
  const toggleOutputNode = (nodeId: string) => {
    if (outputNodeIds.value.includes(nodeId)) {
      outputNodeIds.value = outputNodeIds.value.filter((id) => id !== nodeId);
    } else {
      outputNodeIds.value = [...outputNodeIds.value, nodeId];
    }
  };

  return {
    nodes,
    edges,
    selectedNode,
    pipelineParameters,
    outputNodeIds,
    toggleOutputNode,
    initialize,
    addNode,
    removeNode,
    updateNodePosition,
    updateNodeData,
    addEdge,
    removeEdge,
    selectNode,
    addPipelineParameter,
    updatePipelineParameters,
  };
};
