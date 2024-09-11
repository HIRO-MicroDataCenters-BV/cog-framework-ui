import { Component } from '@angular/core';
import { NgForOf } from '@angular/common';
import { IRun } from '../types';

@Component({
  selector: 'app-pipeline-graph',
  templateUrl: './pipeline-graph.component.html',
  styleUrls: ['./pipeline-graph.component.scss'],
})
export class PipelineGraphComponent {
  runs: IRun[] = [
    {
      name: 'Add_pipeline 2024-07-08-17-34-50',
      experiment: 'Default',
      version: 375,
      startAt: new Date('2024-07-21'),
      status: { error: false, phase: 0 },
      completed: false,
    },
    {
      name: 'Test 2024-07-08-17-34-50',
      experiment: 'Default',
      version: 375,
      startAt: new Date('2024-07-21'),
      status: { error: true, phase: 1 },
      completed: false,
    },
  ];
}
