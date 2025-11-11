import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MaterialSharedModule } from './material-shared.module';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [],
  imports: [
    BrowserModule,
    MaterialSharedModule,
    FormsModule,
    MatChipsModule,
    HttpClientModule,
  ],
})
export class AppModule {}
