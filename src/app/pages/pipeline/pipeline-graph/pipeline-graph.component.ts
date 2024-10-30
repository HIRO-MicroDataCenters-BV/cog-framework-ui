import { Component, Input, OnInit } from '@angular/core';

import {
  Pipeline,
  PipelineTask,
  PipelineTreeNode,
} from 'src/app/model/Pipeline';
import { flatten, getRoot } from 'src/app/utils';

@Component({
  selector: 'app-pipeline-graph',
  templateUrl: './pipeline-graph.component.html',
  styleUrls: ['./pipeline-graph.component.scss'],
})
export class PipelineGraphComponent implements OnInit {
  @Input()
  get data(): Pipeline {
    return this._data;
  }
  set data(data: Pipeline) {
    this._data = data;
    this.root = this.getRoot(data);
  }
  _data!: Pipeline;
  root!: PipelineTask;

  tree: PipelineTreeNode[] = [];

  ngOnInit() {
    console.log('root', this.root);
    const flatTree: PipelineTask[] = this.flatten(
      this.root.children,
    ) as PipelineTask[];
    if (flatTree.length > 0) {
      this.tree = this.getTree(flatTree);
      console.log('t', this.tree);
    }
  }

  getRoot(data: Pipeline): PipelineTask {
    return getRoot(data);
  }

  flatten(data: PipelineTask | PipelineTask[]) {
    return flatten(data);
  }

  getTree(data: PipelineTask[]): PipelineTreeNode[] {
    const result = [];
    for (const item of data) {
      console.log('i', item);
      result.push({
        id: item.id,
        parentId: item.parent ? item.parent.id : null,
        name: item.name,
        status: item.status.toLowerCase() as PipelineTask['status'],
      });
    }
    return result;
  }
}
