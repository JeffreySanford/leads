import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { PackLeadsComponent } from './pack-leads.component';
import { MaterialSharedModule } from '../material-shared.module';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [PackLeadsComponent],
  imports: [MaterialSharedModule, FormsModule, MatChipsModule],
  exports: [PackLeadsComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PackLeadsModule {}
