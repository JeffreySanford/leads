import { NgModule } from '@angular/core';
import { SearchSamComponent } from './search-sam.component';
import { MaterialSharedModule } from '../material-shared.module';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [SearchSamComponent],
  imports: [MaterialSharedModule, FormsModule],
  exports: [SearchSamComponent],
})
export class SearchSamModule {}
