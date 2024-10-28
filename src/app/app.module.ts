import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { AngularSvgIconModule } from 'angular-svg-icon';

import {
  LocationStrategy,
  PathLocationStrategy,
  APP_BASE_HREF,
} from '@angular/common';
import { AppRoutes } from './app.routing';
import { AppComponent } from './app.component';

import { MainLayoutComponent } from './layouts/main/main.component';
import { AppSidebarComponent } from './components/sidebar/sidebar.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { SharedModule } from './shared/shared.module';
import { AppUserToolbarComponent } from './layouts/main/user-toolbar/user-toolbar.component';
import { provideLottieOptions } from 'ngx-lottie';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { TranslocoRootModule } from './transloco-root.module';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';

@NgModule({
  declarations: [AppComponent, MainLayoutComponent, AppUserToolbarComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    RouterModule.forRoot(AppRoutes),
    AngularSvgIconModule.forRoot(),
    AppSidebarComponent,
    MonacoEditorModule.forRoot(),
    TranslocoRootModule,
  ],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline' },
    },
    {
      provide: MatDialogRef,
      useValue: {},
    },
    { provide: MAT_DIALOG_DATA, useValue: {} },
    provideHttpClient(withInterceptorsFromDi()),
    provideLottieOptions({
      player: () => import('lottie-web'),
    }),
    {
      provide: LocationStrategy,
      useClass: PathLocationStrategy,
    },
    {
      provide: APP_BASE_HREF,
      useValue: '/cogui/',
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
