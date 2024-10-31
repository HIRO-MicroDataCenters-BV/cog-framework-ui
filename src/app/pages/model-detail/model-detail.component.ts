import { Component } from '@angular/core';
import { CogFrameworkApiService } from '../../service/cog-framework-api.service';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { ModelDetailData } from '../../model/ModelDetails';
import { MatTableModule } from '@angular/material/table';
import { DemoMaterialModule } from '../../demo-material-module';
import { DatePipe, NgIf } from '@angular/common';
import { ModelUploadComponent } from '../../components/model-upload/model-upload.component';
import { AppDataHeaderComponent } from '../../shared/data-header/data-header.component';
import { MODEL_DETAIL_TABS } from './constants';
import { ITabItem } from '../../shared/data-header/types';
import { Subscription } from 'rxjs';
import { ModelInfoComponent } from './model-info/model-info.component';
import { ModelFilesComponent } from './model-files/model-files.component';

@Component({
  selector: 'app-model-detail',
  standalone: true,
  imports: [
    MatCardModule,
    MatListModule,
    MatTableModule,
    DemoMaterialModule,
    NgIf,
    DatePipe,
    ModelUploadComponent,
    AppDataHeaderComponent,
    RouterOutlet,
  ],
  templateUrl: './model-detail.component.html',
  styleUrl: './model-detail.component.scss',
})
export class ModelDetailComponent {
  loading: boolean = false;
  subscribes: Subscription[] = [];
  modelId = '';
  modelDetailData: ModelDetailData | null = null;

  displayedColumns: string[] = ['id', 'action'];
  tabs: ITabItem[] = [];

  constructor(
    private cogFrameworkApiService: CogFrameworkApiService,
    private activatedRoute: ActivatedRoute,
  ) {
    this.subscribes.push(
      this.activatedRoute.params.subscribe((params) => {
        this.modelId = params?.['id'];
        console.log('modelId', this.modelId);
      }),
    );
    this.fetchModelDetails();
  }

  onOutletLoaded(component: ModelInfoComponent | ModelFilesComponent): void {
    console.log('onOutletLoaded', component);
    if (this.modelDetailData) {
      component.modelDetailData = this.modelDetailData;
    }
  }

  fetchModelDetails(): void {
    this.loading = true;
    const response = this.cogFrameworkApiService.getModelDetailById(
      this.modelId,
    );

    response.subscribe({
      next: (v) => {
        this.modelDetailData = v.data[0];
        this.tabs = MODEL_DETAIL_TABS(this.modelId);
      },
      error: (e) => {
        console.error(e);
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
        console.info('complete');
      },
    });
  }
}
