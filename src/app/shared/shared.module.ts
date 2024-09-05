import { NgModule } from '@angular/core';

import { MenuItems } from './menu-items/menu-items';
import {
  AccordionAnchorDirective,
  AccordionLinkDirective,
  AccordionDirective,
} from './accordion';
import { AppDataHeaderComponent } from './data-header/data-header.component';
import { AppSpinnerComponent } from './spinner.component';

@NgModule({
  declarations: [
    AccordionAnchorDirective,
    AccordionLinkDirective,
    AccordionDirective,
  ],
  imports: [AppDataHeaderComponent, AppSpinnerComponent],
  exports: [
    AccordionAnchorDirective,
    AccordionLinkDirective,
    AccordionDirective,
    AppDataHeaderComponent,
    AppSpinnerComponent,
  ],
  providers: [MenuItems],
})
export class SharedModule {}
