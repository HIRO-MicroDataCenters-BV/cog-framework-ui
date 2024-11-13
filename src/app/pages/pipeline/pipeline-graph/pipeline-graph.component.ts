import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';

import {
  Pipeline,
  PipelineTask,
  PipelineTaskNode,
  PipelineTreeNode,
  PipelineTreeNodeConnection,
} from 'src/app/model/Pipeline';
import { ITabItem } from 'src/app/shared/data-header/types';
import { flatten, getRoot, buildImgURL } from 'src/app/utils';

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
  flatTree: PipelineTask[] = [];

  node: PipelineTaskNode | undefined;
  artifacts: unknown | undefined;

  connections: PipelineTreeNodeConnection[] = [];

  detailTabs: ITabItem[] = [
    {
      label: 'Input/Output',
      key: 'inputOutput',
    },
    {
      label: 'Details',
      key: 'details',
    },
    {
      label: 'Logs',
      key: 'logs',
    },
    {
      label: 'Events',
      key: 'events',
    },
  ];

  @ViewChild('drawer') drawer!: MatDrawer;

  ngOnInit() {
    const flatTree: PipelineTask[] = this.flatten(
      this.root.children,
    ) as PipelineTask[];
    this.flatTree = flatTree;
    if (flatTree.length > 0) {
      this.tree = this.getTree(flatTree);
    }
  }

  handleGetNodeById(id: string): void {
    const node = this.flatTree.find((node) => node.id === id) as
      | PipelineTask
      | PipelineTaskNode;
    if (node !== null) {
      this.node = node as PipelineTaskNode;
    }
    this.drawer.open();
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
  buildImgURL(url?: string): string {
    if (!url) {
      return '';
    }
    return buildImgURL(url);
  }
}
