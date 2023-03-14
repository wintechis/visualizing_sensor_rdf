import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { OBSERVATION_COL_NAMES, ObservationColumn, isDiscrete, Observation, OBSERVATION_MAP, dateToString } from '../observation';

/**
 * this function deal with the 
 */

type DiscreteAggFunc = 'Count' | 'Count distinct';
type TimeAggFunc = DiscreteAggFunc | 'Min' | 'Max';
type AggFunc = TimeAggFunc | 'Mean' | 'Sum';

/**
 * grupby suggestion for the time
 */
export type TimeGroup = 'Year'| 'Month'| 'Day'| 'Weekday'| 'Hour'| 'Minute'| 'Second';

/**
 * each group by has his own funtion
 */
export type AggregationFunc = (groupsColumnData: Observation[]) => number | Date | undefined; 

/**
 * the data which deacribes the group by
 * aggregationColumns[i] ist the name for the column that is aggregated by aggregationFuncs[i]
 */
export interface GroupbyStatement {
  groupedColumns: ObservationColumn[],
  timeGroups: TimeGroup[]|undefined;
  aggregationColumns: ObservationColumn[];
  aggregationFuncs: AggregationFunc[] 
  aggregationsNameMap:Map<ObservationColumn, AggFunc>
}

/**
 * @classdesc TODO
 */
@Component({
  selector: 'app-groupby-aggregate',
  templateUrl: './groupby-aggregate.component.html',
  styleUrls: ['./groupby-aggregate.component.css']
})
export class GroupbyAggregateComponent implements OnInit, OnDestroy {
  readonly OBSERVATION_COL_NAMES = OBSERVATION_COL_NAMES;
  readonly discreteAggregations: DiscreteAggFunc[] = ['Count', 'Count distinct'];
  readonly timeAggregations: TimeAggFunc[] = (this.discreteAggregations as TimeAggFunc[]).concat(['Min', 'Max']); // ['Count', 'Count distinct', 'Min', 'Max'];
  readonly numericAggregations: AggFunc[] = (this.timeAggregations as AggFunc[]).concat(['Mean', 'Sum']); // ['Count', 'Count distinct', 'Mean', 'Min', 'Max', 'Sum'];
  readonly timeGroupOptions: TimeGroup[] = ['Year', 'Month', 'Day', 'Weekday', 'Hour', 'Minute', 'Second'];

  @Input() resetEventEmitter!: Observable<void>;
  private resetEventSubscription!: Subscription;
  resetEventSender: Subject<void> = new Subject<void>();

  @Output() groupByStatementEmitter = new EventEmitter<GroupbyStatement|undefined>();

  groupSelection?: ObservationColumn[];
  timeGroups?: TimeGroup[];
  otherColumns?: ObservationColumn[];

  aggregations: Map<ObservationColumn, AggFunc> = new Map();

  sendedStatement:boolean = false;

  constructor() { }

  /**
   * restevent and new initialize
   */
  ngOnInit(): void {
    this.resetEventSubscription = this.resetEventEmitter.subscribe(() => this.reset(false));
  }

  /**
   * the gruop by will remove 
   */
  ngOnDestroy(): void {
    this.resetEventSubscription.unsubscribe();
  }

  /**
   * filter every groupby which the user selected and suggest all other attributes which can now aggregate
   * @param selected all group by statments which are selected
   */
  groupSelectionChanged(selected:string[]): void {
    this.groupSelection = selected as ObservationColumn[]; 
    for(let c of this.groupSelection) this.aggregations.delete(c);
    let other: ObservationColumn[] = [];
    for(let c of OBSERVATION_COL_NAMES) {
      let contains = false
      for(let s of this.groupSelection) {
        if(c == s) {
          contains = true;
          break
        }
      }
      if(!contains) other.push(c);
    }
    this.otherColumns = other;
    if(this.groupSelection.length == 0) this.groupSelection = undefined;
  }

  /**
   * group by by time
   * @param selected 
   */
  groupTimeSelectionChanged(selected:string[]): void {
    this.timeGroups = selected as TimeGroup[];
  }

  /**
   * each colums who are aggregate get a aggregate function
   * @param column -> the group by selected 
   * @param aggFunc -> the function
   */
  aggregationSelectionChanged(column:ObservationColumn, aggFunc:string) {
    this.aggregations.set(column, aggFunc as AggFunc);
  }

  /**
   * the funtion of the submit button
   * all data will be summerize
   * the data will be given to appcomponent
   */
  submit():void{
    this.sendedStatement = true;
    let groupedColumns = this.groupSelection!;
    let aggregationColumns: ObservationColumn[] = [];
    let aggregationFuncs: AggregationFunc[] = [];
    let aggregationsNameMap = new Map<ObservationColumn, AggFunc>();

    for(let agg of this.aggregations.entries()) {
      let col:ObservationColumn = agg[0];
      
      let getVal = (o:Observation) => o[OBSERVATION_MAP[col]];
      let getMean = (data: Observation[]) => {
        let defined:number[] = []; 
        for(let o of data) {
          let v = getVal(o);
          if(v !== undefined) defined.push(v as number);
        }
        if(defined.length <= 0) return undefined;
        return defined.reduce((prev, cur) => prev + cur) / defined.length;
      }
      let getSum = (data: Observation[]) => {
        let sum = 0;
        for(let o of data) {
          let v = getVal(o);
          if(v !== undefined) sum += v as number;
        }
        return sum;
      }
      let getMin = (data: Observation[]) => {
        if(col == 'Result time') {
          let min:Date|undefined = undefined;
          for(let o of data) {
            let v = getVal(o);
            if(v !== undefined) min = (min === undefined ? v : v < min ? v : min) as Date|undefined;
          }
          return min;
        } else {
          let min:number|undefined = undefined;
          for(let o of data) {
            let v = getVal(o);
            if(v !== undefined) min = (min === undefined ? v : Math.min(v as number, min)) as number|undefined;
          }
          return min;
        }
      }
      let getMax = (data: Observation[]) => {
        if(col == 'Result time') {
          let max:Date|undefined = undefined;
          for(let o of data) {
            let v = getVal(o);
            if(v !== undefined) max = (max === undefined ? v : v > max ? v : max) as Date|undefined;
          }
          return max;
        } else {
          let max:number|undefined = undefined;
          for(let o of data) {
            let v = getVal(o);
            if(v !== undefined) max = (max === undefined ? v : Math.max(v as number, max)) as number|undefined;
          }
          return max;
        }
      }
      let countDistinct = (data: Observation[]) => {
        let s = new Set();
        for(let o of data) {
          let v = getVal(o);
          s.add(col == 'Result time' ? dateToString(v as Date) : v);
        }
        return s.size;
      }
      let aggFunc = {
        'Count' : (o:Observation[]) => o.length,
        'Count distinct' : (o:Observation[]) => countDistinct(o),
        'Mean' : (o:Observation[]) => getMean(o), 
        'Min' : (o:Observation[]) => getMin(o), 
        'Max' : (o:Observation[]) => getMax(o),
        'Sum' : (o:Observation[]) => getSum(o), 
      }[agg[1]];

      aggregationColumns.push(col);
      aggregationFuncs.push(aggFunc);
      aggregationsNameMap.set(col, agg[1]);
    }
    
    let timeGroups = this.timeGroups && this.timeGroups.length > 0 ? this.timeGroups : undefined;
    let timeGroupOrder = {
      'Year':0,
      'Month':1,
      'Weekday':2,
      'Day':3,
      'Hour':4,
      'Minute':5,
      'Second':6
    }
    if(timeGroups) timeGroups.sort((a, b) => timeGroupOrder[a] - timeGroupOrder[b]);
    this.groupByStatementEmitter.emit({
      groupedColumns: groupedColumns,
      timeGroups: timeGroups,
      aggregationColumns: aggregationColumns,
      aggregationFuncs: aggregationFuncs,
      aggregationsNameMap:aggregationsNameMap
    });
  }

  /**
   * if the app comoponent sent a reset
   * 
   * @param {boolean=true} - sendUndefStatement 
   */
  reset(sendUndefStatement:boolean=true): void {
    this.sendedStatement = false;
    this.groupSelection = undefined;
    this.timeGroups = undefined;
    this.otherColumns = undefined;
    this.aggregations = new Map();
    this.resetEventSender.next();
    if(sendUndefStatement) this.groupByStatementEmitter.emit(undefined);
  }

  /**
   * Wrapper methode to call the isDiscrete function from observation.ts module
   * (need to be called as instance methode from HTML).
   * @param column {ObservationColumn} - the sumerize data
   * @returns {boolean} - if dicrete then true
   */
  isDiscrete(col:ObservationColumn): boolean {
    return isDiscrete(col);
  }
}
