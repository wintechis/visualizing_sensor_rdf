import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { Observable, Subscription } from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {COMMA, ENTER} from '@angular/cdk/keycodes';

/**
 * @classdesc that the user can choose several axes in "selected"
 */
@Component({
  selector: 'app-multiple-choises',
  templateUrl: './multiple-choises.component.html',
  styleUrls: ['./multiple-choises.component.css']
})
export class MultipleChoisesComponent implements OnInit, OnDestroy {

  @Input() label: string = 'Columns';
  @Input() options!: string[];
  selectableOptions!: string[];

  @Input() resetEventEmitter?: Observable<void>;
  private resetEventSubscription?: Subscription;

  @Output() choicesChangeEmiter = new EventEmitter<string[]>();

  separatorKeysCodes: number[] = [ENTER, COMMA];
  selectCtrl = new FormControl('');
  filteredOptions: Observable<string[]>;
  choices: string[] = [];

  @ViewChild('optionInput') optionInput!: ElementRef<HTMLInputElement>;

  /**
   * initaise the option you can choose
   */
  constructor() {
    this.filteredOptions = this.selectCtrl.valueChanges.pipe(
      startWith(null),
      map((option: string | null) => (option ? this._filter(option) : this.selectableOptions.slice())),
    );
  }

  /**
   * if the component will be loaded at the user and the suggestion
   */
  ngOnInit(): void {
    this.selectableOptions = this.options;
    this.resetEventSubscription = this.resetEventEmitter?.subscribe(() => {
      this.choices = [];
      this.selectableOptions = this.options;
      this._updateFilteredOptions();
    });
  }

  /**
   * if sth change then angular will say sth
   * @param changes 
   */
  ngOnChanges(changes: SimpleChanges) {
    this.selectableOptions = changes['options'].currentValue;
    this._updateFilteredOptions();
    this.choices = [];
  }

  /**
   * reset the whole selection window
   */
  ngOnDestroy(): void  {
    this.resetEventSubscription?.unsubscribe();
  }

  /**
   * add one sigular option
   * @param event {MatChipInputEvent} - event who triggers if one is add
   */
  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) { // Add option
      this.choices.push(value);
      this.selectableOptions = this.selectableOptions.filter(o => o != value);
    }
    // Clear input value
    event.chipInput!.clear();
    this.selectCtrl.setValue(null);
  }

  /**
   * remove one singular option from the selct bar and will be updated to new selection
   * @param option {string} - which option will be removed
   */
  remove(option: string): void {
    const index = this.choices.indexOf(option);
    if (index >= 0) {
      this.selectableOptions.push(this.choices.splice(index, 1)[0]);
      this._updateFilteredOptions();
      this.choicesChangeEmiter.emit(this.choices);
    }
  }

  /**
   * for the user who tipe the otion
   * @param event {MatAutocompleteSelectedEvent} - the auto complete for helping with tiping
   */
  selected(event: MatAutocompleteSelectedEvent): void {
    this.choices.push(event.option.viewValue);
    this.selectableOptions = this.selectableOptions.filter(o => o != event.option.viewValue);
    this.optionInput.nativeElement.value = '';
    this.selectCtrl.setValue(null);
    this.choicesChangeEmiter.emit(this.choices);
  }

  /**
   * checks which option is left and update for the user
   */
  private _updateFilteredOptions() {
    this.filteredOptions = this.selectCtrl.valueChanges.pipe(
      startWith(null),
      map((option: string | null) => (option ? this._filter(option) : this.selectableOptions.slice())),
    );
  }

  /**
   * filter the options who are left to choose for tiping
   * @param value {string} - the user tiped 
   * @returns {string} - what will be suggested
   */
  private _filter(value: string): string[] {
    return this.selectableOptions.filter(option => {
      return option.toLowerCase().includes(value.toLowerCase())
    });
  }
}
