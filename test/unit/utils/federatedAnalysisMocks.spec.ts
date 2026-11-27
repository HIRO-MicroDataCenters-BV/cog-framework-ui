import { describe, it, expect } from 'vitest';
import {
  addMockFederatedAnalysisRun,
  findMockFederatedAnalysisRun,
  listMockFederatedAnalysisRuns,
} from '~/utils/federatedAnalysisMocks';

describe('federated analysis mock runs', () => {
  it('keeps a started run under its own id, ahead of the demo run', () => {
    const before = listMockFederatedAnalysisRuns();
    const first = addMockFederatedAnalysisRun('gwas', 'first');
    const second = addMockFederatedAnalysisRun('gwas', 'second');

    expect(first.run_id).not.toBe(second.run_id);
    expect(before.map((r) => r.run_id)).not.toContain(first.run_id);
    expect(findMockFederatedAnalysisRun(first.run_id)).toMatchObject({
      name: 'first',
      status: 'Running',
      run_name: 'fedanalysis-gwas-first',
    });
    const names = listMockFederatedAnalysisRuns().map((r) => r.name);
    expect(names.slice(0, 2)).toEqual(['second', 'first']);
    expect(names).toHaveLength(before.length + 2);
  });
});
