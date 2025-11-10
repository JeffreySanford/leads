import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { MaterialSharedModule } from './material-shared.module';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { App } from './app';

@NgModule({
  declarations: [App],
  imports: [
    BrowserModule,
    RouterModule,
    MaterialSharedModule,
    FormsModule,
    MatChipsModule,
    HttpClientModule,
  ],
  bootstrap: [App],
})
export class AppModule {}
