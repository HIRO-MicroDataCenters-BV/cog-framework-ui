import type { Node } from '~/types/builder.types';
import {
  resolveComponentInput,
  validateComponentInput,
} from '~/utils/builder-validation';

export const useNodeValidation = () => {
  const { pipelineParameters } = usePipelineBuilder();

  /**
   * Same rules as the properties sheet and `validateComponentInput` (source type + value shape).
   * `allNodes` must be the full graph; peers exclude `node` for component_output resolution.
   */
  const isNodeValid = (node: Node, allNodes: Node[]): boolean => {
    const component = node.data?.component;
    if (!component) return false;

    const inputDefs = component.input_path || [];
    const inputs = component.inputs || [];
    const pipelineParams = pipelineParameters.value;
    const peers = allNodes.filter((n) => n.id !== node.id);

    for (const inputDef of inputDefs) {
      const input = resolveComponentInput(inputs, inputDef);

      if (!inputDef.optional && !input) {
        return false;
      }
      if (!input) continue;

      if (!input.value_source_type) {
        return false;
      }

      const err = validateComponentInput(
        input,
        inputDef,
        peers,
        pipelineParams,
      );
      if (err !== null) return false;
    }

    return true;
  };

  const getValidationStatus = (node: Node, allNodes: Node[]): string => {
    return isNodeValid(node, allNodes) ? 'valid' : 'invalid';
  };

  return { isNodeValid, getValidationStatus };
};
