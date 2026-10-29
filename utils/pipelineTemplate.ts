/**
 * Resolved example pipeline (`PipelineTemplateDetail`) → canvas state.
 *
 * Nodes match what `CanvasArea.onDrop` creates for a dragged component, and
 * edges match `CanvasArea.onConnect`, so a loaded example behaves exactly
 * like one built by hand: it can be edited, validated and run.
 */

import { MarkerType, Position } from '@vue-flow/core';

import type {
  ComponentPath,
  Edge,
  Node,
  PipelineBuilderData,
} from '~/types/canvas.types';
import type { PipelineTemplateDetail } from '~/types/template.types';

const EDGE_MARKER_SIZE = 11;

/** Node id for a template step; stable per template so reloading is idempotent. */
export const templateNodeId = (templateKey: string, label: string): string =>
  `example-${templateKey}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

export function templateToBuilderData(
  template: PipelineTemplateDetail,
  getTypeColor: (type: string) => string,
): Required<
  Pick<PipelineBuilderData, 'name' | 'nodes' | 'edges' | 'input_path'>
> {
  const idByLabel = new Map(
    template.nodes.map((node) => [
      node.label,
      templateNodeId(template.key, node.label),
    ]),
  );

  const nodes: Node[] = template.nodes.map((node) => ({
    id: idByLabel.get(node.label)!,
    type: 'default',
    position: { ...node.position },
    targetPosition: Position.Top,
    sourcePosition: Position.Bottom,
    data: {
      label: node.label,
      category: node.component.category ?? undefined,
      // Deep copy, as on drop: nodes must never share component objects.
      component: JSON.parse(
        JSON.stringify({ ...node.component, inputs: node.inputs }),
      ),
    },
  }));

  const edges: Edge[] = [];
  for (const node of template.nodes) {
    for (const input of node.inputs) {
      if (input.value_source_type !== 'component_output') continue;
      const dot = input.source.indexOf('.');
      const upstreamLabel = input.source.slice(0, dot);
      const outputName = input.source.slice(dot + 1);
      const upstream = template.nodes.find((n) => n.label === upstreamLabel);
      const source = idByLabel.get(upstreamLabel);
      const target = idByLabel.get(node.label)!;
      if (!upstream || !source) continue;

      const outputType =
        upstream.component.output_path.find(
          (o: ComponentPath) => o.name === outputName,
        )?.type ?? 'Any';
      const color = getTypeColor(outputType);
      edges.push({
        id: `edge-${source}-${outputName}-${target}-${input.destination}`,
        source,
        target,
        sourceHandle: outputName,
        targetHandle: input.destination,
        style: { stroke: color, strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: EDGE_MARKER_SIZE,
          height: EDGE_MARKER_SIZE,
          color,
        },
        data: { color },
      });
    }
  }

  return {
    name: template.title,
    nodes,
    edges,
    input_path: template.input_path.map((param) => ({ ...param })),
  };
}
