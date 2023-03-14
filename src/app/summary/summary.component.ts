import { Component, Inject, Input, OnInit } from '@angular/core';
import { Summary } from '../summary';
import { Observation, OBSERVATION_COL_NAMES, OBSERVATION_NAMES } from '../observation';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { intervalToDuration, Duration } from 'date-fns';
import { dateToString } from '../observation';

/**
 * the summary button at the top of the page 
 */

/**
 * the data which will be handed over
 */
interface SummaryData {
  summary: Summary,
  exampleObservations: Observation[]
}

/**
 * @classdesc the button of the summery
 */
@Component({
  selector: 'app-summary',
  template: `<button mat-button (click)="openSummary()">Show summary</button>`,
  styleUrls: ['./summary.component.css']
})
export class SummaryComponent {

  @Input() summary!: Summary;
  @Input() exampleObservations!: Observation[];

  /**
   * open the dialog
   * @param dialog {MatDialog} - the dialog window
   */
  constructor(private dialog: MatDialog) { }

  /**
   * if the user opended the dialog then it will show
   */
  openSummary() {
    let summary = this.summary;
    let exampleObservations = this.exampleObservations;
    this.dialog.open(SummaryDialogComponent, {
      data: {
        summary,
        exampleObservations
      }
    });
  }
}

/**
 * @classdesc shows the data of the summery
 */
@Component({
  selector: 'summary-dialog-component',
  templateUrl: './summary-dialog-component.html',
})
export class SummaryDialogComponent {
  readonly OBSERVATION_NAMES = OBSERVATION_NAMES;
  readonly OBSERVATION_COL_NAMES = OBSERVATION_COL_NAMES;

  summary:Summary;
  exampleObservations: Observation[];

  /**
   * inialize the diagram for the summery
   * @param summaryData 
   */
  constructor(@Inject(MAT_DIALOG_DATA) public summaryData: SummaryData) {
    this.summary = summaryData.summary;
    this.exampleObservations = summaryData.exampleObservations;
  }

  /**
   * the first five who will be choosen in the summery like unit, made by sensor and observed Property
   * @param values {Set<string>} - the dataset
   * @returns {string[]} - returns as a string
   */
  getFiveExamples(values: Set<string>): string[] {
    let res = [];
    let max = 5;
    for(let v of values) {
      res.push(v);
      max--;
      if(max <= 0) break;
    }
    return res;
  }

  /**
   * giving the time intervall in showing summery 
   * @returns an array of [string, number] tupels (index 0 in tupel is time, index 1 amount)
   */
  getIntervall(): [string, number][] {
    let d : Duration = intervalToDuration(this.summary.timespan!);
    let res:[string, number][] = [];
    if(d.years && d.years > 0) res.push(['Years', d.years]);
    if(d.months && d.months > 0) res.push(['Months', d.months]);
    if(d.days && d.days > 0) res.push(['Days', d.days]);
    if(d.hours && d.hours > 0) res.push(['Hours', d.hours]);
    if(d.minutes && d.minutes > 0) res.push(['Minutes', d.minutes]);
    if(d.seconds && d.seconds > 0) res.push(['Seconds', d.seconds]);
    return res;
  }

  /**
   * Wrapper for function dateToString() of the observation.ts module 
   * (from HTML the only class methods can be called).
   * @param d {Date|number} - the date typ
   * @returns {string} - the html needs a string
   */
  dateToString(d:Date|number): string {
    return dateToString(d as Date);
  }
}

