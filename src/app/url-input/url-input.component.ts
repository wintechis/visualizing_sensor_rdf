import { Component, OnInit } from '@angular/core';

/**
 * showing the buttom "Pass Url" 
 */

/**
 * the data who will be exported
 */
export interface UrlConfigData {
  url:string,
  autoUpdate:boolean,
  autoUpdateByTimeIntervall: boolean,
  updateRateSeconds:number
}

/**
 * @classdesc which will be default
 */
@Component({
  selector: 'app-url-input',
  templateUrl: './url-input.component.html',
  styleUrls: ['./url-input.component.css']
})
export class UrlInputComponent {

  url?:string;
  autoUpdate:boolean = false;
  autoUpdateByTimeIntervall: boolean = false;
  seconds: number = 10;
}
