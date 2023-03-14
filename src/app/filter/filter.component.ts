import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { FilterStatement, resetFilterHeight } from '../filter-statement/filter-statement.component';
import { ObservationProjection } from '../observation';

/**
 * the function which filter the data
 */

/**
 * @classdesc Angular intern for giving data to anopther fuction
 */
@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.css']
})
export class FilterComponent implements OnInit, OnDestroy {

  @Input() data?: ObservationProjection[] | undefined;
  @Input() resetEventEmitter!: Observable<void>;

  private resetEventSubscription!: Subscription;
  resetEventSender: Subject<void> = new Subject<void>();

  @Output() filterStatementsEmitter = new EventEmitter<FilterStatement[]>();

  filters: FilterStatement[] = [];

  /**
   * the function will be initialized if the page starts
   */
  ngOnInit(): void {
    this.resetEventSubscription = this.resetEventEmitter.subscribe(() => {
      this.filters = [];
      this.resetEventSender.next();
    });
  }

  /**
   * if the page will be closed then the event will be terminated 
   */
  ngOnDestroy(): void {
    this.resetEventSubscription.unsubscribe();
  }

  /**
   * the function of the submit button 
   * @param index which filterstatement is selected
   * @param filterStatement the data which is handed over
   */
  recieveFilterStatement(index: number, filterStatement: FilterStatement): void {
    this.filters[index] = filterStatement;
    this.filters = this.filters.slice(0, index + 1);
    this.filterStatementsEmitter.emit(this.filters);
  }

  /**
   * the function which delete the a statement from the filter list 
   * @param index 
   */
  deleteFilterStatement(index:number) {
    resetFilterHeight();
    this.filters.splice(index, 1);
    this.filterStatementsEmitter.emit(this.filters);
  }
}
