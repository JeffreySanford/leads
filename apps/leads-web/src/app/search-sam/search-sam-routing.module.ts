import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SearchSamComponent } from './search-sam.component';

const routes: Routes = [
  { path: '', component: SearchSamComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SearchSamRoutingModule { }