
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ktdTrackById, KtdGridLayout } from '@katoid/angular-grid-layout';
import { ChartType, ChartConfiguration } from 'chart.js';

/**
 * this class is for the already printed charts and all the logic like the size remove or download
 */

/**
 * Define each charts has his own class
 */
export type Chart = 'Bar' | 'Line' | 'Scatter' | 'Pie' | 'Doughnut';

/**
 * each charts has his own interface with
 * which chart was choosen
 * the data from the char
 * the option from the charts  
 */
export interface ChartSelectionData {
  chartType: Chart;
  chartData: any;
  chartOptions:ChartConfiguration['options'];
}

/**
 * @classdesc TODO 
 * if anything changes 
 */
@Component({
  selector: 'app-chart-grid-layout',
  templateUrl: './chart-grid-layout.component.html',
  styleUrls: ['./chart-grid-layout.component.css']
})
export class ChartGridLayoutComponent implements OnChanges {
  readonly cols: number = 6;
  readonly rowHeight: number = 100;

  @Input() chartData?: ChartSelectionData;
  charts: ChartSelectionData[] = [];  

  layout: KtdGridLayout = [  ];
  trackById = ktdTrackById

  /**
   * if anything changes at the @Input parameter then ngOnChanges will be used
   * if new chardata then this method will be used
   * @param changes 
   */
  ngOnChanges(changes: SimpleChanges): void {
    let data: ChartSelectionData|undefined = changes['chartData'].currentValue;
    if(data) {
      let width, heightFaktor;
      if('Pie' == data.chartType || 'Doughnut' == data.chartType) {
        width = 2, heightFaktor = 3;
        if(data.chartData.labels) {
          if(data.chartData.labels.length > 40) width = 4;
          else if(data.chartData.labels.length > 18) width = 3;
        }
      } else {
        width = 3, heightFaktor = 1.5;
        if(data.chartData.labels) {
          if(data.chartData.labels.length > 60) width = this.cols;
          else if(data.chartData.labels.length > 24) width = 4;
        }
      }
      this.charts.unshift(data); // insert at the beginning
      this.layout = [ // insert at beginning & array copy
        {id: this.layout.length.toString(), x: 0, y: 0, w: width, h: Math.ceil(width * heightFaktor), minW: 1, minH: 3},
        ...this.layout 
      ];
    }
  }
  
  /**
   * if the size will be updated by the user
   * @param layout 
   */
  onLayoutUpdated(layout: KtdGridLayout): void {
    this.layout = layout;
  }

  /**
   * Angular wants the data as lower case but we used it with higher case so it will be swopped here
   * @param d {ChartSelectionData} 
   * @returns CharType with lowe cases
   */
  getChartType(d:ChartSelectionData): ChartType {
    return d.chartType.toLowerCase() as ChartType;
  }

  /**
   * each chart get an id here @see char-ChartGridLayoutComponent.html
   * @param idx 
   * @returns {string} -> chart + @param
   */
  getChartId(idx:number): string {
    return 'chart-' + idx;
  }

  /**
   * the tiny button at the top for removing each single chart
   * @param id has his own id but it is just intern
   */
  removeChart(id: string): void {
    const cpy = [...this.layout]; // array copy
    const idx = this.layout.findIndex((item) => item.id === id);
    if (idx > -1) {
      cpy.splice(idx, 1);
      this.charts.splice(idx, 1);
    }
    this.layout = cpy;
  }

  /**
   * the functin for the download button
   * @param chartId which chart will be download
   * @param event that the button was pressed
   */
  downloadCanvas(chartId:string, event:any): void {
    let a = event.target;
    let c = document.getElementById(chartId) as HTMLCanvasElement;
    a.href = c.toDataURL();
    a.download = chartId + ".png";
  }

  /**
   * starts the stop of the eventpropagtion
   * @param event the event propagation
   */
  stopEventPropagation(event: Event) {
    event.preventDefault();
    event.stopPropagation();
  }
}
