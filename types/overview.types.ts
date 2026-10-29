/**
 * Per-user home page overview (`GET /overview`).
 *
 * Sections read from a remote source (`runs`, `endpoints`, `gpu`) are null
 * when that source could not be read; its name is then in `unavailable`.
 */

export interface OverviewRunStats {
  this_week: number;
  last_week: number;
  succeeded_this_week: number;
  failed_this_week: number;
  running: number;
  /** 0-1; null when no run finished this week. */
  success_rate: number | null;
}

export interface OverviewRecentRun {
  run_id: string | null;
  run_name: string | null;
  status: string | null;
  duration: string | null;
  start_time: string | null;
}

export interface OverviewEndpoint {
  isvc_name: string;
  model_name: string | null;
  model_version: string | null;
  model_id: string | null;
  status: string | null;
  url: string | null;
}

export interface OverviewAssets {
  models_total: number;
  models_this_week: number;
  datasets_total: number;
  dataset_source_types: number;
  latest_model_id: string | null;
  latest_model_name: string | null;
}

export interface OverviewGpu {
  total: number;
  in_use: number;
  idle: number;
  utilisation: number | null;
}

export interface OverviewStep {
  key: string;
  title: string;
  done: boolean;
  link: string;
}

export interface OverviewRecommendation {
  kind: 'info' | 'warning' | string;
  message: string;
  action: string;
  link: string;
}

export interface Overview {
  user_id: string;
  namespace: string | null;
  runs: OverviewRunStats | null;
  recent_runs: OverviewRecentRun[];
  endpoints: OverviewEndpoint[] | null;
  assets: OverviewAssets;
  gpu: OverviewGpu | null;
  getting_started: OverviewStep[];
  recommendations: OverviewRecommendation[];
  unavailable: string[];
}
