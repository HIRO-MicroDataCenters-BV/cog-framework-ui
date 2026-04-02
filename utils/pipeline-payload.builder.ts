/**
 * pipeline-payload.builder.ts
 *
 * Converts canvas state (canvas.types) → API payload (pipeline-payload.types).
 *
 * This is the single place responsible for the canvas → payload mapping.
 * Nothing else should know how to build PipelineCreationPayload.
 */

import type {
  Node,
  Component,
  ComponentInput,
  PipelineInputParam,
  PipelineOutput,
  PipelineBuilderData,
} from '~/types/canvas.types';

import type {
  PipelineCreationPayload,
  PipelinePayloadComponent,
  PipelinePayloadComponentInput,
  PipelinePayloadInputItem,
  PipelinePayloadOutputItem,
} from '~/types/pipeline-payload.types';

// ---------------------------------------------------------------------------
// Individual converters
// ---------------------------------------------------------------------------

/**
 * Node → PipelinePayloadComponent
 *
 * node.data.component.id  → uuid
 * node.data.label         → name   (user-assigned; unique within pipeline)
 * component.inputs[]      → inputs (wired connections only)
 */
export function nodeToPayloadComponent(node: Node): PipelinePayloadComponent {
  const component = node.data?.component as Component | undefined;
  const uuid = String(component?.id ?? '');
  const name = (node.data?.label as string) || component?.name || '';
  const inputs: PipelinePayloadComponentInput[] = (component?.inputs ?? []).map(
    (input: ComponentInput) => ({
      source: input.source,
      destination: input.destination,
      value_source_type: input.value_source_type,
    }),
  );

  return { uuid, name, inputs };
}

/**
 * PipelineInputParam (canvas) → PipelinePayloadInputItem (payload)
 *
 * Drops the `type` field — the API contract does not include it.
 * Empty strings for `default` are omitted.
 */
export function paramToPayloadInput(
  param: PipelineInputParam,
): PipelinePayloadInputItem {
  const item: PipelinePayloadInputItem = { name: param.name };
  if (param.default !== undefined && param.default !== '')
    item.default = param.default;
  if (param.description) item.description = param.description;
  return item;
}

/**
 * PipelineOutput (canvas) → PipelinePayloadOutputItem (payload)
 */
export function outputToPayloadOutputItem(
  output: PipelineOutput,
  _nodes: Node[],
): PipelinePayloadOutputItem {
  return {
    name: output.name,
    source: {
      component_name: output.source.component_name,
      output_name: output.source.output_name,
    },
  };
}

/**
 * Fallback: when no explicit pipeline outputs are defined, derive one entry
 * per component output from the component catalog definitions.
 */
function deriveOutputsFromComponents(
  components: PipelinePayloadComponent[],
  nodes: Node[],
): PipelinePayloadOutputItem[] {
  const items: PipelinePayloadOutputItem[] = [];

  components.forEach((comp) => {
    const node = nodes.find((n) => (n.data?.label as string) === comp.name);
    const component = node?.data?.component as Component | undefined;
    (component?.output_path ?? []).forEach((path) => {
      items.push({
        name: path.name,
        source: {
          component_name: comp.name,
          output_name: path.name,
        },
      });
    });
  });

  return items;
}

// ---------------------------------------------------------------------------
// Root converter
// ---------------------------------------------------------------------------

/**
 * Converts the full canvas builder state into the API creation payload.
 *
 * @param builder   - Canvas builder state (nodes, edges, params)
 * @param outputNodeIds - IDs of nodes marked as pipeline outputs (optional).
 *                        When provided, only those nodes' output_path entries
 *                        become the payload's output_path. Falls back to all components.
 *
 * Usage:
 *   const payload = builderDataToPayload(builder, outputNodeIds);
 *   api.postTrainingBuilderPipeline(payload);
 */
export function builderDataToPayload(
  builder: PipelineBuilderData,
  outputNodeIds?: string[],
): PipelineCreationPayload {
  const nodes: Node[] = builder.nodes ?? [];

  const pipeline_components = nodes.map(nodeToPayloadComponent);

  const input_path = (builder.input_path ?? []).map(paramToPayloadInput);

  let output_path: PipelinePayloadOutputItem[];

  if (outputNodeIds?.length) {
    // Only designated output nodes' outputs go into the payload
    output_path = outputNodeIds.flatMap((outputNodeId) => {
      const outputNode = nodes.find((n) => n.id === outputNodeId);
      const comp = outputNode?.data?.component as Component | undefined;
      const compName = (outputNode?.data?.label as string) || comp?.name || '';

      return (comp?.output_path ?? []).map((path) => ({
        name: path.name,
        source: {
          component_name: compName,
          output_name: path.name,
        },
      }));
    });
  } else {
    // Fallback: derive from all components (original behaviour)
    output_path = deriveOutputsFromComponents(pipeline_components, nodes);
  }

  return {
    name: builder.name ?? '',
    pipeline_components,
    ...(input_path.length > 0 ? { input_path } : {}),
    ...(output_path.length > 0 ? { output_path } : {}),
  };
}
