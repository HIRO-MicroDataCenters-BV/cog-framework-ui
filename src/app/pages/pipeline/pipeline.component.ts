import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { IActionItem } from 'src/app/shared/data-header/types';
import { IRun } from './types';
import { mocks } from 'src/app/mocks';
import { MatDialogConfig } from '@angular/material/dialog';
import { Dialog } from '@angular/cdk/dialog';
/*
interface PipeLineTableModel {
  name: string;
  description: string;
  uploadAt: string;
}
  */

@Component({
  selector: 'app-pipeline',
  templateUrl: './pipeline.component.html',
  styleUrls: ['./pipeline.component.scss'],
})
export class PipelineComponent {
  actions: IActionItem[] = [
    {
      label: 'create_run',
      action: () => {
        this.open();
      },
      disabled: false,
    },
    {
      label: 'compare',
      action: () => {
        this.open();
      },
      disabled: true,
    },
    {
      label: 'clone',
      action: () => {
        this.open();
      },
      disabled: true,
    },
    {
      label: 'archive',
      action: () => {
        this.open();
      },
      disabled: true,
    },
    {
      label: 'refresh',
      action: () => {
        this.open();
      },
      disabled: false,
    },
  ];

  runs: IRun[] = mocks.runs;

  @ViewChild('dialogCreateRun', { read: TemplateRef })
  dialogCreateRun: TemplateRef<unknown> | unknown;

  dialog = inject(Dialog);

  open(inputCfg = {}) {
    const ref = this.dialogCreateRun as TemplateRef<unknown>;
    if (ref) {
      const defCfg = new MatDialogConfig();
      defCfg.minWidth = 300;
      defCfg.autoFocus = false;
      const cfg = { ...defCfg, ...inputCfg };
      this.dialog.open(ref, cfg).closed.subscribe((res) => {
        console.log('is closed', res);
      });
    }
  }

  /*
  modelName = '';
  modelId = '1';

  pipeLineTableModelDataSource: PipeLineTableModel[] = [];
  displayedColumnsPipeLineTableModel: string[] = ['name', 'des', 'createdAt'];
  loading = false;

  constructor(private cogFrameworkApiService: CogFrameworkApiService) {}
  search(): void {
    this.getPipeLineByID();
  }

  getPipeLineByID(): void {
    this.loading = true;
    // const pipeline = this.cogFrameworkApiService.getPipelineByModelID(this.modelId);
    const response = this.cogFrameworkApiService.getPipelineByModelID(
      this.modelId,
    );
    response.subscribe({
      next: (v) => {
        console.log(v);
        console.log(v.data[0]);
        this.buildPipeLineTableModelId(v.data[0]);
      },
      error: (e) => {
        console.log('error----->');
        console.error(e);
        console.error(e.status);
        console.error(e.error.error);
      },
      complete: () => {
        //this.loading = false;
        console.info('complete');
        this.loading = false;
      },
    });
  }

  buildPipeLineTableModelId(pipeline: Pipeline): void {
    const dd: PipeLineTableModel = {
      name: pipeline.name,
      description: pipeline.description,
      uploadAt: pipeline.createdAt_in_sec,
    };
    this.pipeLineTableModelDataSource.push(dd);
    console.log(this.pipeLineTableModelDataSource);
  }
    */
}
