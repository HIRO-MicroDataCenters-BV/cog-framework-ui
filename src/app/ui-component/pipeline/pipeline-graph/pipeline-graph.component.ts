import { Component } from '@angular/core';
import { IRun } from '../types';

@Component({
  selector: 'app-pipeline-graph',
  templateUrl: './pipeline-graph.component.html',
  styleUrls: ['./pipeline-graph.component.scss'],
})
export class PipelineGraphComponent {
  // NOTE: A MOCK DATA FOR RUNS
  // TODO: Remove a mock data after connection to the API
  runs: IRun[] = [
    {
      id: 1,
      name: 'Add_pipeline 2024-07-08-17-34-50',
      experiment: 'Default',
      version: 375,
      startAt: new Date('2024-07-21'),
      endAt: null,
      status: { error: false, phase: 2 },
      completed: false,
    },
    {
      id: 2,
      name: 'Test 2024-07-08-17-34-50',
      experiment: 'Default',
      version: 375,
      startAt: new Date('2024-07-21'),
      endAt: null,
      status: { error: true, phase: 3 },
      completed: false,
    },
    {
      id: 3,
      name: 'Test 2024-07-08-17-34-50',
      experiment: 'Default',
      version: 375,
      startAt: new Date('2024-07-21'),
      endAt: new Date(),
      status: { error: false, phase: 5 },
      completed: true,
    },
  ];
}
