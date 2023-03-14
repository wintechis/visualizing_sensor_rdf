import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ObservationColumn, ObservationProjection } from '../observation';

/**
 * the table when you click "Show Data"
 */

/**
 * A Projection of the dataset
 * columns[j] is the name of the column at data[i][j]
 */
export interface DataTableData {
  data: ObservationProjection[];
  columns: ObservationColumn[];
}

/**
 * @classdesc it opend the dialog fenster
 */
@Component({
  selector: 'app-data-table-dialog',
  templateUrl: './data-table-dialog.component.html',
  styleUrls: ['./data-table-dialog.component.css']
})
export class DataTableDialogComponent {

  /**
   * the data will be handed over from @see DataTableData
   * @param dialogData 
   */
  constructor(@Inject(MAT_DIALOG_DATA) public dialogData: DataTableData) { }
}
