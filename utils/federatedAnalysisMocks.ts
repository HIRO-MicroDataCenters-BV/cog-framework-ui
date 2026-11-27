/**
 * In-memory federated analysis runs for mock mode.
 *
 * Shared by both API clients so a run started in mock mode keeps its own id,
 * name and state through the list and detail refreshes that follow.
 */
import federatedAnalysisRunsData from '@/mocks/get.federated-analyses.runs.json';
import type { FederatedAnalysisRun } from '~/types/api.types';

const runs: FederatedAnalysisRun[] = [...federatedAnalysisRunsData.data];
let launched = 0;

/** All mock runs, newest first. */
export const listMockFederatedAnalysisRuns = (): FederatedAnalysisRun[] => [
  ...runs,
];

export const findMockFederatedAnalysisRun = (
  runId: string,
): FederatedAnalysisRun | undefined => runs.find((r) => r.run_id === runId);

/** Records a newly started mock run under an id of its own. */
export const addMockFederatedAnalysisRun = (
  analysisId: string,
  name: string,
): FederatedAnalysisRun => {
  launched += 1;
  const run: FederatedAnalysisRun = {
    run_id: `mock-federated-run-${launched}`,
    run_name: `fedanalysis-${analysisId}-${name}`,
    analysis_id: analysisId,
    name,
    status: 'Running',
    duration: null,
    start_time: new Date().toISOString().slice(0, 19),
    steps: [],
  };
  runs.unshift(run);
  return run;
};
