import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ObservationColumn } from '../observation';


/**
 * this class is needed if all the diagram is choosen and now the pop up for which data to which axes 
 */

/**
 * Data transport which the user can choose for which Axis
 */
export interface AskAxesData {
  xAxisOptions:ObservationColumn[] | undefined;
  yAxisOptions:ObservationColumn[] | undefined;
  zAxisOptions:ObservationColumn[] | undefined;
  zAxisRequired:boolean
}

/**
 * the user chosse will here return which the axes the user choose
 */
export interface AxesNames {
  xAxis:ObservationColumn | undefined;
  yAxis:ObservationColumn | undefined;
  zAxis:ObservationColumn | undefined;
}

/**
 * @component just a decorator
 * @classdesc which axes get which value
 */
@Component({
  selector: 'app-ask-axes-dialog',
  templateUrl: './ask-axes-dialog.component.html',
  styleUrls: ['./ask-axes-dialog.component.css']
})
export class AskAxesDialogComponent {
  x:ObservationColumn | undefined;
  y:ObservationColumn | undefined;
  z:ObservationColumn | undefined;

  /**
   * Angular intern
   * Data is handing over to the class
   * @param data 
   */
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AskAxesData,
  ) {}

  /**
   * ech axes has his own buttom and each button has his own method
   * this is for the X axis
   * @param columnName 
   */
  selectedX(columnName:string) {
    this.x = columnName as ObservationColumn;
    if(this.y == this.x) this.y = undefined;
    if(this.z == this.x) this.z = undefined;
    this.checkAutoInput();
  }

  /**
   * ech axes has his own buttom and each button has his own method
   * this is for the Y axis
   * @param columnName 
   */
  selectedY(columnName:string) {
    this.y = columnName as ObservationColumn;
    if(this.x == this.y) this.x = undefined;
    if(this.z == this.y) this.z = undefined;
    this.checkAutoInput();
  }

  /**
   * ech axes has his own buttom and each button has his own method
   * this is for the Z axis
   * @param columnName 
   */
  selectedZ(columnName:string) {
    this.z = columnName as ObservationColumn;
    if(this.x == this.z) this.x = undefined;
    if(this.y == this.z) this.y = undefined;
    this.checkAutoInput();
  }

  /**
   * check if sth already too 100% sure if one Data goes to one axis without the user hasnot to choose
   */
  private checkAutoInput(): void {
    if(!this.x) {
      let choises = this.data.xAxisOptions?.filter(o => o != this.y && o != this.z);
      if(choises?.length == 1) {
        this.x = choises[0];
        this.checkAutoInput();
      }
    }
    if(!this.y) {
      let choises = this.data.yAxisOptions?.filter(o => o != this.x && o != this.z);
      if(choises?.length == 1) {
        this.y = choises[0];
        this.checkAutoInput();
      }
    }
    if(!this.z) {
      let choises = this.data.zAxisOptions?.filter(o => o != this.x && o != this.y);
      if(choises?.length == 1) {
        this.z = choises[0];
        this.checkAutoInput();
      }
    }
  }
}
