/**
 * Pipeline creation API payload types.
 *
 * These are the shapes that get POSTed to the backend when the user clicks
 * "Save & Run". They are derived from the canvas state, but are intentionally
 * separate — the canvas can hold extra display data that the API doesn't need.
 *
 * Conversion from canvas → payload happens in a single place:
 *   `components/app/Header.vue → executePipelineRun()`
 */

// ---------------------------------------------------------------------------
// Per-component payload
// ---------------------------------------------------------------------------

export interface PipelinePayloadComponent {
  /** Component catalog UUID — used by the backend to fetch component code */
  id: string;
  /** User-assigned name; must be unique within this pipeline */
  name: string;
  inputs: PipelinePayloadComponentInput[];
}

/** Wiring entry for one input on a pipeline component */
export interface PipelinePayloadComponentInput {
  source: string; // "<ComponentName>.<output>", literal value, or param name
  destination: string;
  value_source_type: 'component_output' | 'pipeline_inputparam' | 'constant';
}

// ---------------------------------------------------------------------------
// Pipeline-level inputs and outputs
// ---------------------------------------------------------------------------

/** Top-level pipeline input parameter sent in the payload */
export interface PipelinePayloadInputItem {
  name: string;
  default?: string;
  description?: string;
}

/** Points to the specific component output that backs a pipeline output */
export interface PipelinePayloadOutputSource {
  component_name: string;
  output_name: string;
}

/** Top-level pipeline output entry sent in the payload */
export interface PipelinePayloadOutputItem {
  name: string;
  source: PipelinePayloadOutputSource;
}

// ---------------------------------------------------------------------------
// Root payload
// ---------------------------------------------------------------------------

/** Full POST body sent to the standard (non-federated) pipeline endpoint */
export interface PipelineCreationPayload {
  name: string;
  pipeline_components: PipelinePayloadComponent[];
  input_path?: PipelinePayloadInputItem[];
  output_path?: PipelinePayloadOutputItem[];
}
