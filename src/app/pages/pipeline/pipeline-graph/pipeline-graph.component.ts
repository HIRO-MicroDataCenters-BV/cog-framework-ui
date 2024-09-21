import { Component } from '@angular/core';
import { IRun } from '../types';
import { mocks } from 'src/app/mocks';

@Component({
  selector: 'app-pipeline-graph',
  templateUrl: './pipeline-graph.component.html',
  styleUrls: ['./pipeline-graph.component.scss'],
})
export class PipelineGraphComponent {
  // NOTE: A MOCK DATA FOR RUNS
  // TODO: Remove a mock data after connection to the API
  runs: IRun[] = mocks.runs;
}
