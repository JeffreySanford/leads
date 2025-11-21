import { NgModule } from '@angular/core';
import { SearchSamComponent } from './search-sam.component';
import { MaterialSharedModule } from '../material-shared.module';
import { FormsModule } from '@angular/forms';
import { SearchSamRoutingModule } from './search-sam-routing.module';

@NgModule({
  declarations: [SearchSamComponent],
  imports: [MaterialSharedModule, FormsModule, SearchSamRoutingModule],
  exports: [SearchSamComponent],
})
export class SearchSamModule {}
