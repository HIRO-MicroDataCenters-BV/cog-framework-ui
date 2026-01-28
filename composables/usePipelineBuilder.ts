import type { Node, Edge } from '~/types/builder.types';

export const usePipelineBuilder = () => {
  const nodes = useState<Node[]>('builder-nodes', () => []);
  const edges = useState<Edge[]>('builder-edges', () => []);
  const selectedNode = useState<Node | null>(
    'builder-selected-node',
    () => null,
  );

  const initialize = (initialNodes: Node[], initialEdges: Edge[]) => {
    // Deep copy to break references to the page object
    nodes.value = JSON.parse(JSON.stringify(initialNodes || []));
    edges.value = JSON.parse(JSON.stringify(initialEdges || []));
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
    if (selectedNode.value?.id === nodeId) {
      selectedNode.value = null;
    }
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
    const node = nodes.value.find((n) => n.id === nodeId);
    if (node) {
      selectedNode.value = node;
    }
  };

  return {
    nodes,
    edges,
    selectedNode,
    initialize,
    addNode,
    removeNode,
    updateNodePosition,
    updateNodeData,
    addEdge,
    removeEdge,
    selectNode,
  };
};
