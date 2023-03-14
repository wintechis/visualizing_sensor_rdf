import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { NgChartsModule } from 'ng2-charts';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; 
import {MatCheckboxModule} from '@angular/material/checkbox'; 
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { SummaryComponent, SummaryDialogComponent } from './summary/summary.component';
import { SelectComponent } from './select/select.component';
import {MatSelectModule} from '@angular/material/select';
import { PreviewComponent } from './preview/preview.component';
import { MultipleChoisesComponent } from './multiple-choises/multiple-choises.component';
import { FilterComponent } from './filter/filter.component';
import { GroupbyAggregateComponent } from './groupby-aggregate/groupby-aggregate.component';
import { FilterStatementComponent } from './filter-statement/filter-statement.component'; 
import {MatAutocompleteModule} from '@angular/material/autocomplete'; 
import {MatInputModule} from '@angular/material/input'; 
import {MatButtonModule} from '@angular/material/button';
import { ErrorDialogComponent } from './error-dialog/error-dialog.component'; 
import {MatDialogModule} from '@angular/material/dialog';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner'; 
import {MatDividerModule} from '@angular/material/divider'; 
import {MatToolbarModule} from '@angular/material/toolbar'; 
import {MatExpansionModule} from '@angular/material/expansion'; 
import {CdkAccordionModule} from '@angular/cdk/accordion'; 
import {MatChipsModule} from '@angular/material/chips'; 
import {MatIconModule} from '@angular/material/icon';
import { AskAxesDialogComponent } from './ask-axes-dialog/ask-axes-dialog.component';
import {MatGridListModule} from '@angular/material/grid-list'; 
import {MatSliderModule} from '@angular/material/slider'; 
import {MatTooltipModule} from '@angular/material/tooltip';
import {NgbDatepickerModule, NgbTimepickerModule, NgbAlertModule} from '@ng-bootstrap/ng-bootstrap';
import { JsonPipe } from '@angular/common';
import { DataTableDialogComponent } from './data-table-dialog/data-table-dialog.component';
import { ChartGridLayoutComponent } from './chart-grid-layout/chart-grid-layout.component';
import { KtdGridModule } from '@katoid/angular-grid-layout';
import { HttpClientModule } from '@angular/common/http';
import {ScrollingModule} from '@angular/cdk/scrolling'; 
import 'chartjs-adapter-date-fns';
import { UrlInputComponent } from './url-input/url-input.component';
import {MatProgressBarModule} from '@angular/material/progress-bar'; 

@NgModule({
  declarations: [
    AppComponent,
    SummaryComponent,
    SelectComponent,
    PreviewComponent,
    MultipleChoisesComponent,
    FilterComponent,
    GroupbyAggregateComponent,
    FilterStatementComponent,
    ErrorDialogComponent,
    SummaryDialogComponent,
    AskAxesDialogComponent,
    DataTableDialogComponent,
    ChartGridLayoutComponent,
    UrlInputComponent,
  ],
  imports: [
    BrowserModule,
    NgChartsModule,
    BrowserAnimationsModule,
    MatCheckboxModule,
    FormsModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatInputModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatToolbarModule,
    MatExpansionModule,
    CdkAccordionModule,
    MatChipsModule,
    MatIconModule,
    MatGridListModule,
    MatSliderModule,
    MatTooltipModule,
    NgbTimepickerModule,
    NgbDatepickerModule, NgbAlertModule, JsonPipe,
    KtdGridModule,
    HttpClientModule,
    ScrollingModule,
    MatProgressBarModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
