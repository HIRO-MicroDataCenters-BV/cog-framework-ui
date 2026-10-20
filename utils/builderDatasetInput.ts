/**
 * Dataset-id inputs in the Training Builder.
 *
 * Platform components take a registered dataset by its id (`dataset_id`,
 * `eval_dataset_id`, …) as a plain String input. The properties sheet offers
 * a picker over the platform's datasets for such inputs instead of a free-text
 * UUID field; this module holds the pure helpers behind it.
 */

export interface DatasetChoice {
  id: string;
  dataset_name?: string | null;
  name?: string | null;
  data_source_type?: number | null;
}

const DATASET_ID_NAME = /(^|_)dataset_id$/i;
const STRING_TYPES = new Set(['string', 'str', 'text', '']);

/** True for String inputs named like `dataset_id` / `eval_dataset_id`. */
export const isDatasetIdInput = (
  name: string | null | undefined,
  type: string | null | undefined,
): boolean =>
  DATASET_ID_NAME.test(name ?? '') &&
  STRING_TYPES.has((type ?? '').trim().toLowerCase());

export const datasetLabel = (dataset: DatasetChoice): string =>
  (dataset.dataset_name || dataset.name || '').trim() ||
  String(dataset.id).slice(0, 8);

/**
 * Options for the picker: every dataset, plus the current value as its own
 * entry when it is not among them (a deleted or foreign dataset keeps its id).
 */
export const datasetOptions = (
  datasets: DatasetChoice[],
  current: string | null | undefined,
): Array<{ value: string; label: string }> => {
  const options = datasets.map((d) => ({
    value: String(d.id),
    label: datasetLabel(d),
  }));
  const value = (current ?? '').trim();
  if (value && !options.some((o) => o.value === value)) {
    options.unshift({ value, label: value });
  }
  return options;
};
