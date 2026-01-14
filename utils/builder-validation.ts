import type {
    Node,
    ComponentInput,
    PipelineInputParam,
} from '~/types/builder.types';

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
 * Validates component_output source format
 * - Must include exactly one '.'
 * - Both component name and output name must be non-empty
 * - Component name must exist in available components
 */
export function validateComponentOutput(
    source: string,
    components: Node[],
): string | null {
    if (!source || !source.includes('.')) {
        return 'validation.input.component_output_format';
    }

    const parts = source.split('.');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
        return 'validation.input.component_output_format';
    }

    const [componentName, outputName] = parts;

    // Check if component exists
    const componentExists = components.some(
        (node) => node.data?.label === componentName,
    );

    if (!componentExists) {
        return 'validation.input.component_not_found';
    }

    return null;
}

/**
 * Validates pipeline_inputparam source
 * - Must match an existing pipeline parameter name
 */
export function validatePipelineParam(
    source: string,
    params: PipelineInputParam[],
): string | null {
    if (!source || source.trim() === '') {
        return 'validation.input.param_required';
    }

    const paramExists = params.some((param) => param.name === source);

    if (!paramExists) {
        return 'validation.input.param_not_found';
    }

    return null;
}

/**
 * Validates constant value based on expected type
 * - Must be non-empty
 * - Must match type format (Integer, Float, Boolean, etc.)
 */
export function validateConstant(
    source: string,
    type: string,
): string | null {
    if (!source || source.trim() === '') {
        return 'validation.input.constant_required';
    }

    const normalizedType = type.toLowerCase();

    switch (normalizedType) {
        case 'integer':
        case 'int':
            if (!/^-?\d+$/.test(source)) {
                return 'validation.input.constant_integer';
            }
            break;

        case 'float':
        case 'double':
        case 'number':
            if (!/^-?\d+(\.\d+)?$/.test(source)) {
                return 'validation.input.constant_float';
            }
            break;

        case 'boolean':
        case 'bool':
            if (!/^(true|false|0|1)$/i.test(source)) {
                return 'validation.input.constant_boolean';
            }
            break;

        // String and other types - accept any non-empty value
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
            return validateComponentOutput(input.source, components);

        case 'pipeline_inputparam':
            return validatePipelineParam(input.source, params);

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
