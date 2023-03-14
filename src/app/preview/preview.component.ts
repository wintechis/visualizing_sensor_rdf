import { Component, Input, OnInit } from '@angular/core';
import { dateToString, ObservationColumn, ObservationProjection } from '../observation';

/**
 * @classdesc shows the first five example at the top of the page
 */
@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.css']
})
export class PreviewComponent {

  @Input() columns!: ObservationColumn[];
  @Input() data!: ObservationProjection[];


  /**
   * Wrapper that formats a data value to the format as displayed in HTML.
   * @param value {string|number|Date|undefined} - get one of the formats
   * @returns value in String
   */
  getData(value:string|number|Date|undefined) {
    return value instanceof Date ? dateToString(value) : value;
  }

  /**
   * giving the text if the user hover above the buttom
   * @param column {ObservationColumn} - which buttom is selected with the pointer
   * @returns {string} - the text which will be showed 
   */
  getTooltipTextFor(column:ObservationColumn): string {
    return {
      'Numerical value': 'The observations value',
      'Unit': 'The unit of the numerical value',
      'Made by sensor': "The sensor's name that made the observation",
      'Observed property': 'The property that is observed by the sensor',
      'Result time': "The observation's timestamp"
    }[column];
  }
}
