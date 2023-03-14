import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * if an errer occurs then an error window will happen
 */

/**
 * @classdesc: open the error window
 */
@Component({
  selector: 'app-error-dialog',
  templateUrl: './error-dialog.component.html',
  styleUrls: ['./error-dialog.component.css']
})
export class ErrorDialogComponent {

  /**
   * get the input
   * @param message that will be printed
   */
  constructor(@Inject(MAT_DIALOG_DATA) public message: string) { }
}
