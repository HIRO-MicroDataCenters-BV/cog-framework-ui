import 'hammerjs';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CdkTableModule } from '@angular/cdk/table';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { SharedModule } from '../shared/shared.module';
import { LottieComponent } from 'ngx-lottie';
import { AppLottieComponent } from './lottie/lottie.component';
import { AppSidebarComponent } from './sidebar/sidebar.component';

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
  ],
  providers: [],
  declarations: [],
})
export class MaterialComponentsModule {}
