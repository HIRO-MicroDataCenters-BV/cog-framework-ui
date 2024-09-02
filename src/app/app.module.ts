import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AngularSvgIconModule } from 'angular-svg-icon';

import {
  LocationStrategy,
  PathLocationStrategy,
  APP_BASE_HREF,
} from '@angular/common';
import { AppRoutes } from './app.routing';
import { AppComponent } from './app.component';

//import { FullComponent } from './layouts/full/full.component';
import { MainLayoutComponent } from './layouts/main/main.component';
import { AppHeaderComponent } from './layouts/full/header/header.component';
import { AppSidebarComponent } from './layouts/full/sidebar/sidebar.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DemoMaterialModule } from './demo-material-module';

import { SharedModule } from './shared/shared.module';
import { AppUserToolbarComponent } from './layouts/main/user-toolbar/user-toolbar.component';
import { provideLottieOptions } from 'ngx-lottie';

@NgModule({
  declarations: [
    AppComponent,
    //FullComponent,
    MainLayoutComponent,
    AppHeaderComponent,
    AppUserToolbarComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    DemoMaterialModule,
    FormsModule,
    HttpClientModule,
    SharedModule,
    RouterModule.forRoot(AppRoutes),
    AngularSvgIconModule.forRoot(),
    AppSidebarComponent,
  ],
  providers: [
    provideLottieOptions({
      player: () => import('lottie-web'),
    }),
    {
      provide: LocationStrategy,
      useClass: PathLocationStrategy,
    },
    {
      provide: APP_BASE_HREF,
      useValue: '/cogui',
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
