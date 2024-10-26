import 'hammerjs';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CdkTableModule } from '@angular/cdk/table';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { SharedModule } from '../shared/shared.module';
import { LottieComponent } from 'ngx-lottie';
import { AppLottieComponent } from './lottie/lottie.component';
import { AppSidebarComponent } from './sidebar/sidebar.component';
import { AppGraphComponent } from './graph/graph.component';
import { AppDialogComponent } from './app-modal/app-dialog.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CdkTableModule,
    SharedModule,
    LottieComponent,
    AppLottieComponent,
    AppSidebarComponent,
    AppGraphComponent,
    AppDialogComponent,
  ],
  providers: [],
})
export class MaterialComponentsModule {}
