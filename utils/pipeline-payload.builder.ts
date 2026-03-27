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
  const inputs: PipelinePayloadComponentInput[] = (
    component?.inputs ?? []
  ).map((input: ComponentInput) => ({
    source: input.source,
    destination: input.destination,
    value_source_type: input.value_source_type,
  }));

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
 *
 * Resolves component_uuid by looking up the matching node by label so the
 * payload carries the optional uuid hint alongside the wiring-by-name fields.
 */
export function outputToPayloadOutputItem(
  output: PipelineOutput,
  nodes: Node[],
): PipelinePayloadOutputItem {
  const matchingNode = nodes.find(
    (n) => (n.data?.label as string) === output.source.component_name,
  );
  const componentUuid =
    String(matchingNode?.data?.component?.id ?? '') || undefined;

  return {
    name: output.name,
    source: {
      component_name: output.source.component_name,
      output_name: output.source.output_name,
      ...(componentUuid ? { component_uuid: componentUuid } : {}),
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
          component_uuid: comp.uuid,
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
 * Usage:
 *   const payload = builderDataToPayload(page.data.builder);
 *   api.postTrainingBuilderPipeline(payload);
 */
export function builderDataToPayload(
  builder: PipelineBuilderData,
): PipelineCreationPayload {
  const nodes: Node[] = builder.nodes ?? [];

  const pipeline_components = nodes.map(nodeToPayloadComponent);

  const input_path = (builder.input_path ?? []).map(paramToPayloadInput);

  const output_path: PipelinePayloadOutputItem[] =
    (builder.output_path ?? []).length > 0
      ? (builder.output_path ?? []).map((o) =>
          outputToPayloadOutputItem(o, nodes),
        )
      : deriveOutputsFromComponents(pipeline_components, nodes);

  return {
    name: builder.name ?? '',
    pipeline_components,
    ...(input_path.length > 0 ? { input_path } : {}),
    ...(output_path.length > 0 ? { output_path } : {}),
  };
}
