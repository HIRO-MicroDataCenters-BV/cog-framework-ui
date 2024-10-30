import {
  Component,
  inject,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { IActionItem } from 'src/app/shared/data-header/types';
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
}
