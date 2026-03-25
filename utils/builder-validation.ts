import type {
  Node,
  ComponentInput,
  ComponentPath,
  PipelineInputParam,
  PipelineBuilderData,
} from '~/types/builder.types';

/**
 * Resolves the effective input for a definition: stored row, or synthetic constant from schema default.
 */
export function resolveComponentInput(
  inputs: ComponentInput[] | undefined,
  inputDef: ComponentPath,
): ComponentInput | undefined {
  const existing = (inputs || []).find((i) => i.destination === inputDef.name);
  if (existing) return existing;
  if (inputDef.default !== undefined && inputDef.default !== null) {
    return {
      destination: inputDef.name,
      value_source_type: 'constant',
      source: String(inputDef.default),
    };
  }
  return undefined;
}

function inferPipelineParamType(value: unknown): string {
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'Integer' : 'Float';
  }
  if (typeof value === 'string') {
    if (!Number.isNaN(Number(value)) && value.trim() !== '') {
      return value.includes('.') ? 'Float' : 'Integer';
    }
    if (value === 'true' || value === 'false') return 'Boolean';
  }
  return 'String';
}

/**
 * Pipeline parameters for validating pipeline_inputparam sources (matches sheet: input_path or runtime_config).
 */
export function getPipelineParamsForValidation(
  builder: PipelineBuilderData | undefined | null,
): PipelineInputParam[] {
  if (!builder) return [];
  if (builder.input_path?.length) return builder.input_path;
  const pd = builder.pipelineData as
    | { runtime_config?: { parameters?: Record<string, unknown> } }
    | undefined
    | null;
  if (!pd?.runtime_config?.parameters) return [];
  return Object.entries(pd.runtime_config.parameters).map(([name, value]) => ({
    name,
    default: String(value),
    type: inferPipelineParamType(value),
  }));
}

/**
 * Validates component name according to schema rules
 * - Must be non-empty
 * - Must contain only alphanumeric, underscore, hyphen, and spaces
 * - Must be unique among existing names
 */
export function validateComponentName(
  name: string,
  existingNames: string[],
): string | null {
  if (!name || name.trim() === '') {
    return 'validation.component.name_required';
  }

  if (!/^[a-zA-Z0-9_\s-]+$/.test(name)) {
    return 'validation.component.name_format';
  }

  if (existingNames.includes(name)) {
    return 'validation.component.name_unique';
  }

  return null;
}

/**
 * Validates input destination name
 * - Must be non-empty
 * - Must not contain '.' (prevents parsing ambiguity)
 */
export function validateInputDestination(destination: string): string | null {
  if (!destination || destination.trim() === '') {
    return 'validation.input.destination_required';
  }

  if (destination.includes('.')) {
    return 'validation.input.destination_no_dot';
  }

  return null;
}

/**
 * Checks if two types are compatible
 * - Same types are always compatible
 * - Integer is compatible with Float/Number/Double
 */
export function areTypesCompatible(
  provided: string,
  expected: string,
): boolean {
  const p = provided.toLowerCase();
  const e = expected.toLowerCase();

  if (p === e) return true;

  const numberTypes = ['integer', 'int', 'float', 'double', 'number'];
  if (numberTypes.includes(p) && numberTypes.includes(e)) {
    return true;
  }

  // String can accept anything as a fallback
  if (e === 'string') return true;

  return false;
}

/**
 * Validates component_output source format and type compatibility
 */
export function validateComponentOutput(
  source: string,
  components: Node[],
  expectedType?: string,
): string | null {
  if (!source || !source.includes('.')) {
    return 'validation.input.component_output_format';
  }

  const parts = source.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return 'validation.input.component_output_format';
  }

  const [componentName, outputName] = parts;

  // Find component and output definition
  const componentNode = components.find(
    (node) => node.data?.label === componentName,
  );

  if (!componentNode) {
    return 'validation.input.component_not_found';
  }

  const outputDef = componentNode.data?.component?.output_path?.find(
    (out) => out.name === outputName,
  );

  if (!outputDef) {
    return 'validation.input.output_not_found';
  }

  // Validate type compatibility
  if (expectedType && !areTypesCompatible(outputDef.type, expectedType)) {
    return 'validation.input.type_mismatch';
  }

  return null;
}

/**
 * Validates pipeline_inputparam source and type compatibility
 */
export function validatePipelineParam(
  source: string,
  params: PipelineInputParam[],
  expectedType?: string,
): string | null {
  if (!source || source.trim() === '') {
    return 'validation.input.param_required';
  }

  const param = params.find((p) => p.name === source);

  if (!param) {
    return 'validation.input.param_not_found';
  }

  // Validate type compatibility
  if (
    expectedType &&
    param.type &&
    !areTypesCompatible(param.type, expectedType)
  ) {
    return 'validation.input.type_mismatch';
  }

  return null;
}

/**
 * Validates constant value based on expected type
 */
export function validateConstant(source: string, type: string): string | null {
  if (!source || source.trim() === '') {
    return 'validation.input.constant_required';
  }

  const normalizedType = type.toLowerCase();

  switch (normalizedType) {
    case 'integer':
    case 'int':
    case 'float':
    case 'double':
    case 'number':
      // Allow any number format for these types since we treat them as compatible
      if (!/^-?\d+(\.\d+)?$/.test(source)) {
        return normalizedType.includes('int')
          ? 'validation.input.constant_integer'
          : 'validation.input.constant_float';
      }
      break;

    case 'boolean':
    case 'bool':
      if (!/^(true|false|0|1)$/i.test(source)) {
        return 'validation.input.constant_boolean';
      }
      break;

    default:
      break;
  }

  return null;
}

/**
 * Validates a complete ComponentInput
 */
export function validateComponentInput(
  input: ComponentInput,
  inputDefinition: { name: string; type: string },
  components: Node[],
  params: PipelineInputParam[],
): string | null {
  // Validate destination
  const destError = validateInputDestination(input.destination);
  if (destError) return destError;

  // Validate source based on type
  switch (input.value_source_type) {
    case 'component_output':
      return validateComponentOutput(
        input.source,
        components,
        inputDefinition.type,
      );

    case 'pipeline_inputparam':
      return validatePipelineParam(input.source, params, inputDefinition.type);

    case 'constant':
      return validateConstant(input.source, inputDefinition.type);

    default:
      return 'validation.input.invalid_source_type';
  }
}

/**
 * Detects cycles in the component graph using Kahn's algorithm
 * Returns true if a cycle is detected
 */
export function detectCycle(nodes: Node[]): boolean {
  // Build adjacency list and in-degree map
  const graph = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  // Initialize
  nodes.forEach((node) => {
    const nodeId = node.data?.label || node.id;
    graph.set(nodeId, []);
    inDegree.set(nodeId, 0);
  });

  // Build graph from component inputs
  nodes.forEach((node) => {
    const nodeId = node.data?.label || node.id;
    const inputs = node.data?.component?.inputs || [];

    inputs.forEach((input: ComponentInput) => {
      if (input.value_source_type === 'component_output') {
        const [upstreamName] = input.source.split('.');
        if (upstreamName && graph.has(upstreamName)) {
          graph.get(upstreamName)!.push(nodeId);
          inDegree.set(nodeId, (inDegree.get(nodeId) || 0) + 1);
        }
      }
    });
  });

  // Kahn's algorithm
  const queue: string[] = [];
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      queue.push(nodeId);
    }
  });

  let processedCount = 0;

  while (queue.length > 0) {
    const current = queue.shift()!;
    processedCount++;

    const neighbors = graph.get(current) || [];
    neighbors.forEach((neighbor) => {
      const newDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDegree);

      if (newDegree === 0) {
        queue.push(neighbor);
      }
    });
  }

  // If we processed all nodes, no cycle exists
  return processedCount !== nodes.length;
}

/**
 * Validates all components in a pipeline
 * Returns an array of validation errors with component names
 */
export function validateAllComponents(
  nodes: Node[],
  pipelineParams: PipelineInputParam[],
): Array<{ componentName: string; error: string }> {
  const errors: Array<{ componentName: string; error: string }> = [];

  nodes.forEach((node) => {
    const componentName = node.data?.label || node.id;
    const component = node.data?.component;

    if (!component) return;

    const inputDefinitions = component.input_path || [];
    const inputs = component.inputs || [];

    inputDefinitions.forEach((inputDef) => {
      const input = inputs.find((inp) => inp.destination === inputDef.name);
      if (!input) return;

      const error = validateComponentInput(
        input,
        inputDef,
        nodes,
        pipelineParams,
      );

      if (error) {
        errors.push({
          componentName,
          error: `${inputDef.name}: ${error}`,
        });
      }
    });
  });

  return errors;
}
