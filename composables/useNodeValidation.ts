import type { Node } from '~/types/builder.types';

export const useNodeValidation = () => {
  const isNodeValid = (node: Node): boolean => {
    const component = node.data?.component;
    if (!component) return false;

    // Get required inputs (inputs that are not optional)
    const requiredInputs =
      component.input_path?.filter((input) => !input.optional) || [];

    // Get provided inputs
    const providedInputs = component.inputs || [];

    // Check all required inputs have a source
    return requiredInputs.every((required) =>
      providedInputs.some(
        (provided) =>
          provided.destination === required.name &&
          provided.source &&
          provided.source.trim() !== '',
      ),
    );
  };

  const getValidationStatus = (node: Node): string => {
    return isNodeValid(node) ? 'valid' : 'invalid';
  };

  return { isNodeValid, getValidationStatus };
};
