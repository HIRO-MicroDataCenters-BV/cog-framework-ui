import { Component, Input, OnInit } from '@angular/core';

import {
  Pipeline,
  PipelineTask,
  PipelineTreeNode,
  PipelineTreeNodeConnection,
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

  connections: PipelineTreeNodeConnection[] = [];

  ngOnInit() {
    const flatTree: PipelineTask[] = this.flatten(
      this.root.children,
    ) as PipelineTask[];
    if (flatTree.length > 0) {
      this.tree = this.getTree(flatTree);
    }
  }

  getRoot(data: Pipeline): PipelineTask {
    return getRoot(data);
  }

  flatten(data: PipelineTask | PipelineTask[]) {
    return flatten(data);
  }

  getTree(data: PipelineTask[]): PipelineTreeNode[] {
    const result: PipelineTreeNode[] = [];
    const connections = [];

    for (const item of data) {
      const existsNode = result.find((node) => node.id === item.id);
      if (!existsNode) {
        result.push({
          id: item.id,
          parentId: item.parent ? item.parent.id : null,
          name: item.name,
          status: item.status.toLowerCase() as PipelineTask['status'],
        });

      } else {
        if (item.parent) {
          connections.push({
            from: item.parent.id,
            to: item.id,
            label: '',
          });
        }

      }
    }
    this.connections = connections;
    return result;
  }
}
