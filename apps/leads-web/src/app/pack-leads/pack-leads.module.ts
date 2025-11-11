import { NgModule } from '@angular/core';
import { PackLeadsComponent } from './pack-leads.component';
import { MaterialSharedModule } from '../material-shared.module';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { PackLeadsRoutingModule } from './pack-leads-routing.module';

@NgModule({
  declarations: [PackLeadsComponent],
  imports: [MaterialSharedModule, FormsModule, MatChipsModule, PackLeadsRoutingModule],
  exports: [PackLeadsComponent],
})
export class PackLeadsModule {}
