import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AskAxesData, AskAxesDialogComponent, AxesNames } from './ask-axes-dialog/ask-axes-dialog.component';
import { FilterStatement, resetFilterHeight } from './filter-statement/filter-statement.component';
import { GroupbyStatement } from './groupby-aggregate/groupby-aggregate.component';
import { OBSERVATION_MAP, Observation, OBSERVATION_COL_NAMES, ObservationColumn, isDiscrete, parseTurtleText, ObservationProjection, dateToString, TIME_GROUPS_SEP_MAP, ObservationColumnFromFile } from './observation';
import { progressSummary, Summary} from './summary';
import { ErrorDialogComponent } from './error-dialog/error-dialog.component';
import { catchError, of, Subject } from 'rxjs';
import { DataTableData, DataTableDialogComponent } from './data-table-dialog/data-table-dialog.component';
import { Chart, ChartSelectionData } from './chart-grid-layout/chart-grid-layout.component';
import {SummaryDialogComponent} from './summary/summary.component';
import { Bar, ChartSelection, Line, PieDoughnut, Scatter } from './chart-selection';
import { DataRequestService } from './data-request.service';
import { UrlConfigData, UrlInputComponent } from './url-input/url-input.component';
import { HttpEvent } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';

/**
 * root component 
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnDestroy {
  readonly title = 'ttl-dashboard';

  urlConfigData?:UrlConfigData;
  dataLoadSubscription?: Subscription;

  isParsing:boolean = false;
  data? : Observation[]; // Liste von Beobachtungen 
  summary?: Summary;

  private filterStatements?: FilterStatement[];
  private groupbyStatement?: GroupbyStatement;
  selectedObservations?: ObservationColumn[];
  transformedData?: ObservationProjection[];
  transformedFirstFive?: ObservationProjection[];
  transformedDataColumns: ObservationColumn[] = OBSERVATION_COL_NAMES;

  resetAfterShowingChart: boolean = true;
  resetEventSender: Subject<void> = new Subject<void>();

  step = 2; // step in filter-groupby-select choices (mat-accordion)

  possibleCharts?: Chart[];
  chartData?: ChartSelectionData;


  // // http://0.0.0.0:5000/data.ttl
  /**
   * loads the live server
   * @param dialog {MatDialog} 
   * @param liveDataService {DataRequestService}
   */
  constructor(private dialog: MatDialog, private liveDataService: DataRequestService) {}

  /**
   * cancel the conection to live server
   */
  ngOnDestroy(): void {
    this.dataLoadSubscription?.unsubscribe();
  }

  /**
   * open the dialog with the url input
   */
  openDataUrlDialog():void {
    let dialogRef = this.dialog.open(UrlInputComponent);
    dialogRef.afterClosed().subscribe((configData:UrlConfigData|undefined) => {
      if(configData) {
        this.resetAll();
        this.urlConfigData = configData;
        if(configData.autoUpdate && configData.autoUpdateByTimeIntervall) {
          this.dataLoadSubscription = interval(configData.updateRateSeconds * 1000).subscribe(
            () => this.requestData()
          );
        } else {
          this.dataLoadSubscription?.unsubscribe();
        }
        this.requestData();
      } 
    });
  }

  /**
   * the file which the user selected 
   * @param event {any}
   */
  fileSelector(event: any) {
    this.isParsing = true;
    this.urlConfigData = undefined;
    this.dataLoadSubscription?.unsubscribe();
    this.data = undefined;
    this.summary = undefined;
    this.resetAll();
    event.target.files[0].text().then((turtleText:string) => {
      this.initFromTurtleText(turtleText);
    });
  }

  /**
   * componente choose between select, filter or group by
   * @param index {number} - which the user want
   */
  setStep(index: number) {
    resetFilterHeight();
    this.step = index;
  }

  /**
   * the next button at the bottom of each component
   */
  nextStep() {
    resetFilterHeight();
    this.step++;
  }

  /**
   * the function of the previous buttom
   */
  prevStep() {
    this.step--;
  }

  /**
   * if the user press the submit buttom at the fillterstatment
   * @param statements {FilterStatement[]} - the context of the filterstatemnt
   */
  recieveFilterStatements(statements:FilterStatement[]): void {
    this.filterStatements = statements;
    if(this.groupbyStatement) this.transformedData = this.getGroupedData();
    else this.transformedData = this.getFilteredData();
    this.transformedFirstFive = this.transformedData.slice(0, 5);
    this.setPossibleCharts();
  }

  /**
   * if the user press the submit buttom at the groupbystatment
   * @param statement {statement} - the context of the groupby statement
   */
  recieveGroupByStatement(statement:GroupbyStatement|undefined) {
    this.groupbyStatement = statement;
    if(statement) {
      this.transformedDataColumns = statement.groupedColumns.concat(statement.aggregationColumns);
      this.transformedData = this.getGroupedData();
      this.step++;
    } else {
      this.transformedDataColumns = OBSERVATION_COL_NAMES;
      this.transformedData = this.filterStatements ? this.getFilteredData() : this.data;
    }
    this.transformedFirstFive = this.transformedData!.slice(0, 5);
    this.selectedObservations = undefined;
    this.setPossibleCharts();
  }

  /**
   * just the selected rows were saved
   * @param selectedColumns {string[]} - the rows which were selected
   */
  recieveSelectStatement(selectedColumns:string[]) {
    this.selectedObservations = selectedColumns.length > 0 ? selectedColumns as ObservationColumn[] : undefined;
    if(this.selectedObservations) this.transformedFirstFive = this.getSelectedData(true);
    else this.transformedFirstFive = (this.transformedData ? this.transformedData : this.data)?.slice(0, 5);
    this.setPossibleCharts();
  }

  /**
   * if the user selected a char
   * @param chart {string|undefined} - which chart the user picks
   */
  chooseChart(chart:string|undefined) {
    if(chart) {
      this.generateDatasets(chart as Chart);
      this.step = 3;
    }
  }
  
  /**
   * the funtion of the reset buttom or the buttom at the bottom of the selct
   */
  resetSelection() {
    this.possibleCharts = undefined;
    this.filterStatements = undefined;
    this.selectedObservations = undefined;
    this.transformedData = this.data;
    this.groupbyStatement = undefined;
    this.transformedDataColumns = [...OBSERVATION_COL_NAMES]; // array copy
    this.transformedFirstFive = this.data?.slice(0, 5);
    this.resetEventSender.next();
  }

  /**
   * the function of the show data buttom 
   */
  showDataPopUp() {
    this.isParsing = true;
    let show = () => {
      let dialogData: DataTableData = {
        columns: this.selectedObservations ? this.selectedObservations : this.transformedDataColumns,
        data:this.transformedData!
      }
      let dialogRef = this.dialog.open(DataTableDialogComponent, {data:dialogData, width: '80%'});
      dialogRef.afterOpened().subscribe(()=>this.isParsing = false);
    }
    if(this.data!.length > 1000) new Promise (resolve => setTimeout (resolve, 500)).then(show);
    else show();
  }

  /**
   * if the url is choises 
   * and the new url data will be filter or group by
   */
  private requestData(): void {
    if(this.urlConfigData) {
      this.isParsing = true;
      new Promise (resolve => setTimeout (resolve, 500)).then(() => {
        this.liveDataService.getData(this.urlConfigData!.url).pipe(catchError(error => {
          this.urlConfigData = undefined;
          this.dataLoadSubscription?.unsubscribe();
          this.dialog.open(ErrorDialogComponent, { data: 
            'Error: ' + (error.error instanceof ErrorEvent ? error.error.message : error.message) // + '. Try again.'
          });
          this.isParsing = false;
          return of(undefined);
        })).subscribe((response:HttpEvent<string>|undefined) => {
          if(response) { 
            this.initFromTurtleText(response as unknown as string);
            if(this.selectedObservations) this.transformedData = this.getSelectedData(false);
            else if(this.groupbyStatement) this.transformedData = this.getGroupedData();
            else if(this.filterStatements) this.transformedData = this.getFilteredData();
            else this.transformedData = this.data;
            this.transformedFirstFive = this.transformedData!.slice(0, 5);
          }
          this.isParsing = false;
        });
      });
    } else {
      this.dataLoadSubscription?.unsubscribe();
    }
  }

  /**
   * it parses the turtle data from string and initiliaze  
   * @param turtleText {string} - the turtle data as string
   */
  private initFromTurtleText(turtleText:string) : void {
    this.data = parseTurtleText(turtleText, this.dialog);
    this.transformedData = this.data;
    this.summary = progressSummary(this.data);
    this.transformedFirstFive = this.data.slice(0, 5);
    this.isParsing = false;
  }

  /**
   * giving the filterd data back
   * @returns {ObservationProjection[]} - the filtered data
   */
  private getFilteredData(): ObservationProjection[] {
    let filtered: Observation[] = [];
    let n = 0;
    for(let observation of this.data!) {
      if(this.isSelectedByFilterStatements(observation)) {
        filtered.push(observation);
        n++;
      }
    }
    return filtered;
  }

  /**
   * Includes filter statements
   * summerize the group by and filter
   * @returns {ObservationProjection[]} - the data group by and filter
   */
  private getGroupedData(): ObservationProjection[] {

    type WeekdayNbr = 0 | 1 | 2 | 4 | 5 | 6;
    let weekdays = {0:'Sunday', 1:'Monday', 2:'Tuesday', 3:'Wednesday', 4:'Thursday', 5:'Friday', 6:'Saturday'};
    
    let getGroupKey = (groupCol:ObservationColumn, observation:Observation) => {
      if(groupCol == 'Result time') {
        let d = observation[OBSERVATION_MAP['Result time']] as Date|undefined;
        if(!d) return undefined;
        if(this.groupbyStatement!.timeGroups) {
          let k:string[] = [];
          for(let timeGroup of this.groupbyStatement!.timeGroups) {
            let getTimeNum:()=>string = {
              'Year': () => d!.getFullYear().toString(),
              'Month': () => (d!.getMonth() + 1).toString(),
              'Day': () => d!.getDate().toString(),
              'Weekday': () => weekdays[d!.getDay() as WeekdayNbr],
              'Hour': () => d!.getUTCHours().toString(),
              'Minute': () => d!.getMinutes().toString(),
              'Second': () => d!.getSeconds().toString()
            }[timeGroup];
            let num = getTimeNum().toString();
            if(num.length <= 1) num = '0' + num;
            k.push(num + TIME_GROUPS_SEP_MAP[timeGroup]);
          }
          let res = k.join('');
          return res.slice(0, res.length - 1);
        } else {
          return dateToString(d);
        }
      } else {
        return observation[OBSERVATION_MAP[groupCol]];
      }
    }

    let groupCols:ObservationColumn[] = this.groupbyStatement!.groupedColumns;
    let grouped = new Map();
    for(let observation of this.data!) {
      if(!this.filterStatements || this.isSelectedByFilterStatements(observation)) {
        let map = grouped;
        for(let groupColIdx = 0; groupColIdx < groupCols.length - 1; groupColIdx++) {
          let key = getGroupKey(groupCols[groupColIdx], observation);
          if(!map.has(key)) map.set(key, new Map());
          map = map.get(key);
        }
        let key = getGroupKey(groupCols[groupCols.length - 1], observation);
        if(!map.has(key)) map.set(key, []);
        map.get(key).push(observation);
      }
    }
    let aggregated:ObservationProjection[] = [];
    let flattenGrouped = (row:ObservationProjection, map:Map<any, Map<any, any>|Observation[]>) => {
      for(let e of map.entries()) {
        let r = [...row]; // array copy
        r.push(e[0]);
        if(e[1] instanceof Map) flattenGrouped(r, e[1]);
        else {
          let observations:Observation[] = e[1];
          let aggregations = this.groupbyStatement!.aggregationFuncs.map(f => f(observations));
          aggregated.push(r.concat(aggregations));
        }
      }
    }
    flattenGrouped([], grouped);
    return aggregated;
  }

  /**
  * Includes filter, group statements and select
  * @param onlyFive - just the first five data will be calculated
  * @returns {ObservationProjection[]} - data with filter select and group by together 
  */
  private getSelectedData(onlyFive:boolean): ObservationProjection[] {
    let data = onlyFive ? this.transformedData!.slice(0, 5) : this.transformedData!;
    let selectedIndicies:number[] = [];
    for(let selectedCol of this.selectedObservations!) {
      for(let i = 0; i < this.transformedDataColumns.length; i++) {
        if(selectedCol == this.transformedDataColumns[i]) {
          selectedIndicies.push(i);
          break;
        }
      }
    }
    return data.map(row => selectedIndicies.map(i => row[i]));
  }


  /**
   * calculate which chart is possible in this situation
   */
  private setPossibleCharts() {
    this.chartData = undefined;
    let selectedColumns: ObservationColumn[] = this.selectedObservations ? this.selectedObservations : this.transformedDataColumns;

    let charts: Chart[] = [];
    if(Bar.isSelectable(selectedColumns, this.groupbyStatement)) charts.push('Bar');
    if(Line.isSelectable(selectedColumns, this.groupbyStatement)) charts.push('Line');
    if(Scatter.isSelectable(selectedColumns, this.groupbyStatement)) charts.push('Scatter');
    const data:ObservationProjection[] = this.selectedObservations ? this.getSelectedData(false) : this.transformedData!;
    if(PieDoughnut.isSelectable(selectedColumns, this.groupbyStatement, data)) charts = charts.concat(['Pie', 'Doughnut']);
    
    this.possibleCharts = charts.length == 0 ? undefined : charts;
  }

  /**
   * generates the data for each diagram
   * and open it if it already clear which value on which axis
   * @param chosenChart {Chart}
   * @returns 
   */
  private generateDatasets(chosenChart:Chart):void {
    let data:ObservationProjection[];
    let columnNames:ObservationColumn[];
    if(this.selectedObservations) {
      data = this.getSelectedData(false);
      columnNames = this.selectedObservations;
    } else {
      data = this.transformedData!
      columnNames =  this.transformedDataColumns;
    }

    let chart: ChartSelection = {
      'Bar': new Bar(data, columnNames, this.groupbyStatement),
      'Line': new Line(data, columnNames, this.groupbyStatement),
      'Scatter': new Scatter(data, columnNames, this.groupbyStatement),
      'Pie': new PieDoughnut(data, columnNames, this.groupbyStatement),
      'Doughnut': new PieDoughnut(data, columnNames, this.groupbyStatement),
    }[chosenChart]

    // if a dialog to ask for axis is needed
    let xAxisOptions:ObservationColumn[]|undefined = chart.getXAxisOptions();
    let yAxisOptions:ObservationColumn[]|undefined = chart.getYAxisOptions();
    let zAxisOptions:ObservationColumn[]|undefined = chart.getZAxisOptions();

    if(xAxisOptions || yAxisOptions || zAxisOptions) {
      let d: AskAxesData = {
        xAxisOptions:xAxisOptions,
        yAxisOptions:yAxisOptions,
        zAxisOptions:zAxisOptions,
        zAxisRequired:chart.isZAxisRequired()
      };
      let dialogRef = this.dialog.open(AskAxesDialogComponent, { data: d });
      dialogRef.afterClosed().subscribe((result:AxesNames|undefined) => {
        if(result) {
          chart.setAxes(result);
          this.generateDatasetsExplicit(chart, chosenChart); 
        }
      });
      return;
    }

    this.showChartAndReset({
      chartType: chosenChart,
      chartData: chart.getChartData(),
      chartOptions: chart.getChartOptions()
    });
  }

  /**
   * open a dialog which the user choose which value on which axis
   * @param chart {chart} - data which axis were chosen
   * @param chartType {charType} - which chart is choosed
   */
  private generateDatasetsExplicit(chart:ChartSelection, chartType:Chart):void {
    this.showChartAndReset({
      chartType: chartType,
      chartData: chart.getChartData(),
      chartOptions:chart.getChartOptions()
    });
  }

  /**
   * show a chart of selected and reset the input of the user if he choose it
   * @param data {ChartSelectionData} - data of the diagram
   */
  private showChartAndReset(data:ChartSelectionData) {
    this.chartData = data;
    if(this.urlConfigData && this.urlConfigData.autoUpdate && !this.urlConfigData.autoUpdateByTimeIntervall)
      this.requestData();
    if(this.resetAfterShowingChart) this.resetSelection();
  }

  /**
   * true if the row will be saved and false if it should deleted
   * @param row {Observation} - each row of the data
   * @returns true saved and false deleted
   */
  private isSelectedByFilterStatements(row:Observation): boolean {
    for(let s of this.filterStatements!) if(!s.filter(row[OBSERVATION_MAP[s.columnName]])) return false;
    return true;
  }

  /**
   * if a new data or new url is uploaded then everything will be resetted
   */
  private resetAll() {
    this.resetSelection();
    this.chartData = undefined;
    this.step = 2;
    this.keySequence = [];
  }


  showTurtles: boolean = false;
  keySequence:(string|undefined)[] = [];
  
  /**
   * Listens to keyboard events 
   * @param event {KeyboardEvent} - event containing the key that was pressed
   */
  @HostListener('window:keyup', ['$event'])
  onKeyUp(event:KeyboardEvent) {
    const KEY_SEQUENCE_MAX_LEN = 12;
    const COMMAND_ESCAPE = ['Shift', '!'];

    if(this.keySequence.length >= KEY_SEQUENCE_MAX_LEN) this.keySequence.shift();
    this.keySequence.push(event.key);
    let isWord = (word:string) => {
      for(let i = COMMAND_ESCAPE.length; i < COMMAND_ESCAPE.length + this.keySequence.length - word.length + 1; i++) {
        let found = true;
        for(let j = 0; j < word.length; j++) if(word[j] != this.keySequence[i+j]) {
          found = false;
          break;
        }
        if(found) {
          this.keySequence = [];
          return true;
        }
      }
      return false;
    } 
    if(isWord('turtle')) this.showTurtles = !this.showTurtles;
    if(this.data) {
      if(isWord('filter')) this.step = 0;
      if(isWord('group')) this.step = 1;
      if(isWord('select')) this.step = 2;
      if(isWord('reset')) this.resetSelection();
      if(isWord('data')) this.showDataPopUp();
      if(isWord('summary') || isWord('summarize') || isWord('summarise')) {
        this.dialog.open(SummaryDialogComponent, { data: {
            summary:this.summary,
            exampleObservations:this.data.slice(0, 5)
        }});
      }
    }
  }
}


