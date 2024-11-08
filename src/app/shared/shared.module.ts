import { NgModule } from '@angular/core';

import { MenuItems } from './menu-items/menu-items';
import {
  AccordionAnchorDirective,
  AccordionLinkDirective,
  AccordionDirective,
} from './accordion';
import { AppDataHeaderComponent } from './data-header/data-header.component';
import { AppSpinnerComponent } from './spinner.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { MatListModule } from '@angular/material/list';
import { AppLottieComponent } from '../components/lottie/lottie.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule } from '@angular/material/paginator';
import { DatePipe } from '@angular/common';
import { AppFluidHeightDirective } from './fluid-height/fluid-height.directive';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatDialogModule } from '@angular/material/dialog';
import { AppTableComponent } from '../components/app-table/app-table.component';

@NgModule({
  declarations: [
    AccordionAnchorDirective,
    AccordionLinkDirective,
    AccordionDirective,
    AppFluidHeightDirective,
  ],
  imports: [
    AppDataHeaderComponent,
    AppSpinnerComponent,
    AppLottieComponent,
    MonacoEditorModule,
    DatePipe,
    TranslocoPipe,
    AppTableComponent,
  ],
  exports: [
    AccordionAnchorDirective,
    AccordionLinkDirective,
    AccordionDirective,
    AppFluidHeightDirective,
    AppDataHeaderComponent,
    AppSpinnerComponent,
    AppTableComponent,
    FormsModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatProgressBarModule,
    MatListModule,
    MatFormFieldModule,
    MatMenuModule,
    MatToolbarModule,
    MatSidenavModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatDialogModule,
    MonacoEditorModule,
    AppLottieComponent,
    DatePipe,
    TranslocoPipe,
  ],
  providers: [MenuItems],
})
export class SharedModule {}
