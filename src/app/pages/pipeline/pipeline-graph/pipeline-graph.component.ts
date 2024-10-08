import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IRunDataGraph } from '../types';

@Component({
  selector: 'app-pipeline-graph',
  templateUrl: './pipeline-graph.component.html',
  styleUrls: ['./pipeline-graph.component.scss'],
})
export class PipelineGraphComponent implements OnInit {
  data: IRunDataGraph[] | undefined;

  constructor(private httpClient: HttpClient) {}

  ngOnInit() {
    this.getData();
  }
  async getData() {
    this.data = [
      { id: '1', parentId: null, name: 'Root task', status: 1 },
      { id: '2', parentId: '1', name: 'Any task', status: 1 },
      { id: '3', parentId: '1', name: 'Secondary', status: -1 },
      { id: '4', parentId: '2', name: 'Maybe else', status: 0 },
      { id: '5', parentId: '4', name: 'Other one', status: 0 },
    ];
  }
}
