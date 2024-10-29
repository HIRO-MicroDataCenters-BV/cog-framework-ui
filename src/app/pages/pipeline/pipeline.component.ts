import {
  Component,
  inject,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { IActionItem } from 'src/app/shared/data-header/types';
import { IRun } from './types';
//import { mocks } from 'src/app/mocks';
import { MatDialogConfig } from '@angular/material/dialog';
import { Dialog } from '@angular/cdk/dialog';
import { FormGroup, FormControl } from '@angular/forms';
import { ButtonItem } from 'src/app/model/General';
import { Pipeline } from 'src/app/model/Pipeline';
/*
interface PipeLineTableModel {
  name: string;
  description: string;
  uploadAt: string;
}
  */

interface ButtonItems {
  createRun: ButtonItem[];
}

@Component({
  selector: 'app-pipeline',
  templateUrl: './pipeline.component.html',
  styleUrls: ['./pipeline.component.scss'],
})
export class PipelineComponent implements OnInit {
  actions: IActionItem[] = [
    {
      label: 'create_run',
      action: () => {
        this.open({ minWidth: 640, maxWidth: '90%' });
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

  dialogActions: ButtonItems = {
    createRun: [
      {
        varient: 'secondary',
        type: 'cancel',
        ui: 'basic',
      },
      {
        varient: 'primary',
        type: 'start',
        ui: 'flat',
        action: () => {
          this.onSubmit();
        },
        hasClose: false,
      },
    ],
  };

  runs: Pipeline[] = []; //mocks.runs;

  @ViewChild('dialogCreateRun', { read: TemplateRef })
  dialogCreateRun: TemplateRef<unknown> | unknown;

  @ViewChild('dialogSelectPipeline', { read: TemplateRef })
  dialogSelectPipeline: TemplateRef<unknown> | unknown;

  @ViewChild('dialogSelectExperiment', { read: TemplateRef })
  dialogSelectExperiment: TemplateRef<unknown> | unknown;

  dialog = inject(Dialog);

  pipelineForm: FormGroup = new FormGroup({
    name: new FormControl(''),
  });

  ngOnInit(): void {
    console.log('init');

    //this.pipelineForm.addControl('');
    //firstName: new FormControl(''),
    // NOTE: createdatinSec createdAt_in_sec
    //required fields for [POST] /pipiline
    /*
    {
     run_details: {
     uuid: string,
     name: string,
     experiment_uuid,
     pipeline_uuid
     createdAt_in_sec: string($date-time)
     },
     experiment_details: {
      name
      description
      uuid
      createdatinSec
     },
     pipeline_details: {
      uuid
      name
      description
      createdAt_in_sec
      experiment_uuid
     },
     task_details: {
      uuid
      runuuid
      createdtimestamp
      startedtimestamp
      finishedtimestamp
     },
    }
    //not required
    {
     run_details: {
      display_name
      description
     },
     pipeline_details: {
      model_id
      parameters
      status
      pipeline_spec
      pipeline_spec_uri
     },
     task_details: {
      state
      name
      parenttaskuuid
     },
     model_ids: []
    }
    */
  }

  changeData(data: Pipeline) {
    this.runs = data ? [data] : [];
  }

  open(inputCfg: MatDialogConfig = {}) {
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

  onSubmit() {
    console.log('form values', this.pipelineForm.value);
    this.dialog.closeAll();
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
