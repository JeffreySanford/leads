import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PackLeadsComponent } from './pack-leads.component';

const routes: Routes = [
  { path: '', component: PackLeadsComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PackLeadsRoutingModule { }