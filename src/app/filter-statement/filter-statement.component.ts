import { Component, Input, OnInit, Output, EventEmitter, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import {FormControl} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { NgbDateStruct, NgbTimeStruct } from '@ng-bootstrap/ng-bootstrap';
import {Observable, Subject, Subscription} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';
import { OBSERVATION_MAP, OBSERVATION_COL_NAMES, ObservationColumn, isDiscrete, Observation, ObservationProjection } from '../observation';


/**
 * 
 */

/**
 * the columName and one method for the filter
 */
export interface FilterStatement {
  columnName: ObservationColumn, 
  filter: any// function: (string|number|Date|undefined) => boolean //funtion retutn a boolean if the statemnt stays or sort out
}

/**
 * workaround because day-picker had some bugs
 */
export function resetFilterHeight(): void {
  const filter = document.getElementById('selection-filter');
  if(filter) filter.style.minHeight = 'fit-content';
}

/**
 * all the operation type which are possible by filter
 */
type OperatorOption = '=' | '!=' | '<' | '>' | '<=' | '>=';


/**
 * @classdesc TODO
 */
@Component({
  selector: 'app-filter-statement',
  templateUrl: './filter-statement.component.html',
  styleUrls: ['./filter-statement.component.css']
})
export class FilterStatementComponent implements OnInit, OnChanges, OnDestroy {
  readonly OBSERVATION_COL_NAMES = OBSERVATION_COL_NAMES;
  
  @Input() data?: ObservationProjection[] | undefined;

  @Input() resetEventEmitter!: Observable<void>;
  private resetEventSubscription!: Subscription;
  resetEventSender: Subject<void> = new Subject<void>();

  @Output() filterEmitter = new EventEmitter<FilterStatement>();

  columnName?: ObservationColumn;
  operatorOptions?: OperatorOption[];
  operator?: OperatorOption;

  /*
  Discrete column selected
  */
  discreteAutocompleteControl = new FormControl('');
  discreteOptions?: string[];
  filteredDiscreteOptions!: Observable<Set<string>>;
  discreteValue?: string;

  /*
  numericValue selected 
  */
  numericalValue?: number;

  /*
  resultTime selected
  */
  time?: NgbTimeStruct; //= { hour: 0, minute: 0, second: 0 };
  date?:NgbDateStruct; // { "year": 2023, "month": 2, "day": 3 }


  /**
   * for the dialog component if an error occus @see error-dialog
   * @param dialog 
   */
  constructor(private dialog: MatDialog) { }


  /**
   * intialise a single filter statment
   */
  ngOnInit(): void {
    this.filteredDiscreteOptions = this.discreteAutocompleteControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '')),
    );
    this.resetEventSubscription = this.resetEventEmitter?.subscribe(() => {
      this.discreteOptions = undefined;
      this.discreteValue = undefined;
      this.numericalValue = undefined;
      this.resetEventSender.next();
    });
  }

  /**
   * angular intern 
   * if sth changes intern thenit will be updated
   * @param changes 
   */
  ngOnChanges(changes: SimpleChanges): void {
    if(!this.discreteValue) {
      this.filteredDiscreteOptions = this.discreteAutocompleteControl.valueChanges.pipe(
        startWith(''),
        map(value => this._filter(value || '')),
      );
    }
  }

  /**
   * reset a single filterstatment
   */
  ngOnDestroy(): void {
    this.resetEventSubscription?.unsubscribe();
  }

  /**
   * if sth change  on the coloumn then 
   * the new colum will be initalised and the rest reseted
   * @param {string} value column which will be replaced
   */
  selectionChange(value:string): void {
    resetFilterHeight();
    this.columnName = undefined;
    this.operator = undefined;
    this.discreteValue = undefined;
    this.numericalValue = undefined;
    this.columnName = value as ObservationColumn;
    if(isDiscrete(this.columnName)) {
      this.operatorOptions = ['=', '!='];
      this.discreteOptions = this.data?.map(row => row[OBSERVATION_MAP[this.columnName!]] as string);
    } else { // 'Result time' & 'Numerical value'
      this.operatorOptions = ['=', '!=', '<', '>', '<=', '>='];
    }
  }

  /**
   * if just the oparator will be changed 
   * @param {string|undefined} value the operator will be change
   */
  selectionChangeOperator(value:string|undefined): void {
    resetFilterHeight();
    this.discreteValue = undefined;
    this.numericalValue = undefined;
    this.operator = value ? value as OperatorOption : undefined;
  }

  /**
   * the function which will be submitted
   * and then handover to the mother class
   * The dates had some bugs so it is also a workaround
   * @returns void
   */
  submit(): void {
    resetFilterHeight();
    if(isDiscrete(this.columnName!)) {
      let value = this.discreteValue;
      this.filterEmitter.emit({
        columnName:this.columnName!,
        filter: this.operator == '=' ? 
          (v: string ) => v == value : (v: string ) => v != value
      });
    } else if(this.columnName == 'Result time') {
      if(this.date !== undefined && typeof this.date == 'string') {
        this.dialog.open(ErrorDialogComponent, { data: 'Date input is not correct, check for validity and try again!' });
        return;
      }
      let compare = (v: Date, comp:any) => { // comp:(number, number)=>boolean
        return (
          this.date === undefined || (
            comp(v.getFullYear(), this.date.year) &&
            comp(v.getMonth() + 1, this.date.month) &&
            comp(v.getDate(), this.date.day)
          )
        ) && (
          this.time === undefined || (
            comp(v.getUTCHours(), this.time.hour) &&
            comp(v.getMinutes(), this.time.minute) &&
            comp(v.getSeconds(), this.time.second)
          )
        )
      }
      let f = {
        '=': (v: Date) => compare(v, (n1:number, n2:number) => n1 == n2),
        '!=':(v: Date) => {
          return (
            this.date !== undefined && (
              v.getFullYear() != this.date.year ||
              v.getMonth() + 1 != this.date.month ||
              v.getDate() != this.date.day
            )
          ) || (
            this.time !== undefined && (
              v.getUTCHours() != this.time.hour ||
              v.getMinutes() != this.time.minute ||
              v.getSeconds() != this.time.second
            )
          )
        },
        '<': (v: Date) => {
          if(this.date !== undefined) {
            if(v.getFullYear() < this.date.year) return true;
            if(v.getFullYear() == this.date.year) {
              if(v.getMonth() + 1 < this.date.month) return true;
              if(v.getMonth() + 1 == this.date.month) {
                if(v.getDate() < this.date.day) return true;
                if(v.getDate() == this.date.day && this.time === undefined) return false;
              } else {
                return false;
              }
            } else {
              return false;
            }
          }
          if(this.time !== undefined) {
            if(v.getUTCHours() < this.time.hour) return true;
            if(v.getUTCHours() == this.time.hour) {
              if(v.getMinutes() < this.time.minute) return true;
              if(v.getMinutes() == this.time.minute) {
                if(v.getSeconds() < this.time.second) return true;
                if(v.getSeconds() == this.time.second) return false;
              } else {
                return false;
              }
            } else {
              return false;
            }
          }
          return false;
        },
        '>': (v: Date) => {
          if(this.date !== undefined) {
            if(v.getFullYear() > this.date.year) return true;
            if(v.getFullYear() == this.date.year) {
              if(v.getMonth() + 1 > this.date.month) return true;
              if(v.getMonth() + 1 == this.date.month) {
                if(v.getDate() > this.date.day) return true;
                if(v.getDate() == this.date.day && this.time === undefined) return false;
              } else {
                return false;
              }
            } else {
              return false;
            }
          }
          if(this.time !== undefined) {
            if(v.getUTCHours() > this.time.hour) return true;
            if(v.getUTCHours() == this.time.hour) {
              if(v.getMinutes() > this.time.minute) return true;
              if(v.getMinutes() == this.time.minute) {
                if(v.getSeconds() > this.time.second) return true;
                if(v.getSeconds() == this.time.second) return false;
              } else {
                return false;
              }
            } else {
              return false;
            }
          }
          return false;
        },
        '<=':(v: Date) => compare(v, (n1:number, n2:number) => n1 <= n2),
        '>=':(v: Date) => compare(v, (n1:number, n2:number) => n1 >= n2),
      };
      this.filterEmitter.emit({
        columnName:this.columnName,
        filter:f[this.operator!]
      });
    } else { // Numerical value
      let value = this.numericalValue!; 
      let f = {
        '=': (v: number) => v == value,
        '!=':(v: number) => v != value,
        '<': (v: number) => v < value,
        '>': (v: number) => v > value,
        '<=':(v: number) => v <= value,
        '>=':(v: number) => v >= value,
      };
      this.filterEmitter.emit({
        columnName:this.columnName!,
        filter:f[this.operator!]
      });
    }
  }

  /**
   * Wrapper methode to call the isDiscrete function from observation.ts module
   * (need to be called as instance methode from HTML).
   * @param column {ObservationColumn}
   * @returns {boolean} if it is dicrete or indiscrete 
   */
  isDiscrete(column:ObservationColumn): boolean {
    return isDiscrete(column)
  }

  /**
   * cheks before if the filter statment is complet 
   * @returns {boolean} if true then submit can be pressed from the user
   */
  isValidInput(): boolean {
    if(this.columnName == 'Result time') return this.date !== undefined || this.time !== undefined ;
    if(this.columnName == 'Numerical value') return this.numericalValue !== undefined;
    return this.discreteValue !== undefined;
  }

  /**
   * open the datepicker for the date
   * @param d {any} is an event
   */
  openedDatepicker(d:any): void {
    const filter = document.getElementById('selection-filter');
    if(filter) {
      filter.style.minHeight = '306px';
      filter.style.display = 'inline-block';
    }
  }

  /**
   * if you tip the result then it will filter all which still fits 
   * @param value {string} - the string from the user
   * @returns {Set<string>} - the result which is can be choosen
   */
  private _filter(value: string): Set<string> {
    if(this.discreteOptions) return new Set(this.discreteOptions.filter(
      option => option.toLowerCase().includes(value.toLowerCase())
      ));
    else return new Set<string>();
  }
}
