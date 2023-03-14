import { addMinutes, compareAsc } from 'date-fns';
import { AxesNames } from './ask-axes-dialog/ask-axes-dialog.component';
import { GroupbyStatement } from './groupby-aggregate/groupby-aggregate.component';
import { dateToString, ObservationColumn, ObservationProjection, TIME_GROUPS_SEP_MAP } from './observation';

/**
 * just intern used
 */
type DataSequence = (string|undefined)[]|(number|undefined)[]|(Date|undefined)[];
type Dataset = {
    label?:string|number|Date|undefined,
    data:DataSequence,
    segment?:{borderDash:(ctx:any)=>[number, number]|undefined}
}

/**
 * @abstract class for each chart are extended
 * @classdesc the basic function of every function
 */
export abstract class ChartSelection {

    protected xAxisOption: ObservationColumn|undefined; // dataset[i].data [v1, v2, ...]
    protected yAxisOption: ObservationColumn|undefined; // labels
    protected zAxisOption: ObservationColumn|undefined; // series (dataset[i].label)

    /**
     * 
     * @param data {ObservationProjection[]} - is optional
     * @param columns {ObservationProjection[]} - columns[j] is the name of the column from data[i][j]
     * @param groupbyStatement {GroupbyStatement|undefined}
     */
    constructor(
        protected data: ObservationProjection[],
        protected columns: ObservationColumn[],
        protected groupbyStatement:GroupbyStatement|undefined
    ) {
        let continous = columns.filter(c => !this.mustBeDiscrete(c));
        if(continous.length == 1) {
            this.yAxisOption = continous[0];
            if(columns.length == 2) this.xAxisOption = columns[0] == continous[0] ? columns[1] : columns[0];
        } else if(continous.length == 2 && continous.includes('Result time') && !this.canYTimescaled()) {
            this.yAxisOption = continous[0] == 'Result time' ? continous[1] : continous[0];
        }
        this.setRequiredAxesOptions();
    }

    /**
     * which digram can be selected with these chosen data
     * @param columns 
     * @param groupbyStatement 
     * @param data 
     * @returns if it can be choosen or not
     */
    static isSelectable(columns: ObservationColumn[], groupbyStatement:GroupbyStatement|undefined, data?:ObservationProjection[]): boolean {
        let nDiscrete = columns.filter(c => ChartSelection.mustBeDiscrete(c, groupbyStatement)).length;
        return nDiscrete <= 2 && columns.length > nDiscrete;
    }

    /**
     * dialog window which the user wants which axis
     * @param axes {AxesNames} - the axers that are possible to choose
     */
    setAxes(axes:AxesNames):void {
        if(axes.xAxis !== undefined) this.xAxisOption = axes.xAxis;
        if(axes.yAxis !== undefined) this.yAxisOption = axes.yAxis;
        if(axes.zAxis !== undefined) this.zAxisOption = axes.zAxis;
    }
    
    /**
     * giving the data for each char needs it
     * @returns 
     */
    getChartData(): any  {
        let timeIdx = this.columns.indexOf('Result time');

        if(timeIdx >= 0) {
            if(this.isTimeScaleable() && this.groupbyStatement && this.groupbyStatement.timeGroups) {
                let suffix = '';
                let appendix = '';
                if(this.groupbyStatement.timeGroups.length == 2) {
                     let x, y;
                     [x, y] = this.groupbyStatement.timeGroups;
                     if(x == 'Year' && y == 'Month') appendix = '-01';
                     else if(x == 'Month' && y == 'Day') suffix = '2000-';
                     else if(x == 'Hour' && y == 'Minute') {
                        suffix = '2000-01-01T';
                        appendix = ':00+00:00';
                     } else if(x == 'Minute' && y == 'Second') suffix = '2000-01-01T00:';
                } else if(this.groupbyStatement.timeGroups.length == 3) {
                     let x, y, z;
                     [x, y, z] = this.groupbyStatement.timeGroups;
                     if(x == 'Hour' && y == 'Minute' && z == 'Second') suffix = '1000-01-01T';
                }
                for(const row of this.data) if(row[timeIdx]) row[timeIdx] = new Date(suffix + row[timeIdx]! + appendix);
            }
            for(const row of this.data) {
                if(row[timeIdx] instanceof Date) row[timeIdx] = addMinutes(row[timeIdx] as Date, (row[timeIdx] as Date).getTimezoneOffset());
            }
        }

        let sortByTimeIfNeeded = () => {
            if(this.isTimeScaleable() && (this.xAxisOption == 'Result time' || this.yAxisOption == 'Result time')) {
                this.data = this.data.filter(row => row[timeIdx] !== undefined).sort(
                    (r1, r2) => compareAsc(r1[timeIdx] as Date, r2[timeIdx] as Date)
                    );
            } else if(this.groupbyStatement && this.groupbyStatement.timeGroups && this.groupbyStatement.timeGroups.length == 1) {
                this.data = this.data.filter(row => row[timeIdx] !== undefined).sort(
                    (r1, r2) => (r1[timeIdx] as number) - (r2[timeIdx] as number)
                    );
            }
        };

        if(!this.xAxisOption && !this.zAxisOption)  {
            let sets: Dataset[] = this.columns.map(_=>{return {data:[] as DataSequence};});
            for(let row of this.data) for(let i in row) sets[i].data.push(row[i] as any);
            return {datasets:sets};
        } else {
            sortByTimeIfNeeded();
            const labelIdx:number = this.columns.indexOf(this.xAxisOption!);
            const labels:DataSequence = [];
            const nCols = this.columns.length;
            const datasets = [];
            if(!this.zAxisOption) {
                for(let i = 0; i < nCols; i++) if(i != labelIdx) datasets.push({label:this.columns[i], data:[] as DataSequence});
                for(const row of this.data) {
                    labels.push(row[labelIdx] as any);
                    for(let i = 0; i < nCols; i++) {
                        if(i == labelIdx) continue;
                        datasets[i > labelIdx ? i - 1 : i].data.push(row[i] as any);
                    }
                }
                return {labels:labels, datasets:datasets};
            } else {
                const toStringIfDate = (v:any) => v instanceof Date ? dateToString(v as Date) : v;
                const zIndex = this.columns.indexOf(this.zAxisOption);
                const zLabels = new Set(this.data.map(row => toStringIfDate(row[zIndex])));
                const yIndex = this.columns.indexOf(this.yAxisOption!);
                let sets: Dataset[] = [];
                for(const label of zLabels.values()) sets.push({
                    label:label,
                    data:this.data.map(row => label == toStringIfDate(row[zIndex]) ? row[yIndex] : undefined) as DataSequence
                });
                const xIndex = this.columns.indexOf(this.xAxisOption!);
                const xLabels = this.data.map(row => row[xIndex]) as DataSequence;
                return {labels:xLabels, datasets:sets};
            }
        }
    }

    /**
     * giving back the option like how it is cofigure it
     * @returns {any} the option which were choosen 
     */
    getChartOptions(): any {
        let xLabel:any = this.xAxisOption;
        let yLabel:any = this.yAxisOption;
        if(this.groupbyStatement) {
            if(xLabel && this.groupbyStatement.aggregationsNameMap.has(xLabel))
                xLabel = this.groupbyStatement.aggregationsNameMap.get(xLabel) + '( ' + xLabel + ' )';
            if(yLabel && this.groupbyStatement.aggregationsNameMap.has(yLabel))
                yLabel = this.groupbyStatement.aggregationsNameMap.get(yLabel) + '( ' + yLabel + ' )';
            if(this.groupbyStatement.timeGroups) {
              if(xLabel == 'Result time') xLabel += ' "';
              if(yLabel == 'Result time') yLabel += ' "';
              for(let group of this.groupbyStatement.timeGroups) {
                if(this.xAxisOption == 'Result time') xLabel += group + TIME_GROUPS_SEP_MAP[group];
                else if(this.yAxisOption == 'Result time') yLabel += group + TIME_GROUPS_SEP_MAP[group];
              }
              if(this.xAxisOption == 'Result time') xLabel = xLabel.slice(0, xLabel.length-1) + '"';
              if(this.yAxisOption == 'Result time') yLabel = yLabel.slice(0, yLabel.length-1) + '"';
            }
        }
        return {
            plugins:{legend:{display:this.zAxisOption !== undefined}},
            scales: {
                x: {title:{display:xLabel!==undefined, text:xLabel}},
                y: {title:{display:xLabel!==undefined, text:yLabel}},
            }
        };
    }

    /**
     * giving all option for the X - Axis
     * @returns {ObservationColumn[]} each row which possible to choose or undefined becaus it is automatically in it
     */
    getXAxisOptions(): ObservationColumn[]|undefined {
        if(this.xAxisOption || this.isMaxNbrOfSelectedAxes()) return undefined;
        let o = this.excludeAlreadySelectedAxes(this.columns);
        if(o && o.length == 1) {
            this.xAxisOption = o[0];
            return undefined;
        }
        return o;
    }

    /**
     * giving all option for the Y - Axis
     * @returns {ObservationColumn[]} each row which possible to choose or undefined becaus it is automatically in it
     */
    getYAxisOptions(): ObservationColumn[]|undefined {
        if(this.yAxisOption || this.isMaxNbrOfSelectedAxes()) return undefined;
        let o = this.excludeAlreadySelectedAxes(this.columns.filter(c =>
             c == 'Numerical value' || (this.groupbyStatement && this.groupbyStatement.aggregationColumns.includes(c))
        ));
        if(o && o.length == 1) {
            this.yAxisOption = o[0];
            return undefined;
        }
        return o;
    }

    /**
     * giving all option for the Z - Axis
     * @returns {ObservationColumn[]} each row which possible to choose or undefined becaus it is automatically in it
     */
    getZAxisOptions(): ObservationColumn[]|undefined {
        if(this.zAxisOption || this.isMaxNbrOfSelectedAxes() || this.columns.length < 3) return undefined;
        let o = this.excludeAlreadySelectedAxes(this.columns);
        if(o && o.length == 1) {
            this.zAxisOption = o[0];
            return undefined;
        } 
        return o;
    }

    /**
     * @abstract
     * @returns {boolean} if the Z - Axis is required then true otherwise false
     */
    abstract isZAxisRequired(): boolean;

    /**
     * @abstract initialize option which coulum are choosen
     */
    protected abstract setRequiredAxesOptions(): void;

    /**
     * if it is scatter plot then always false
     * @returns always false beside scatter
     */
    protected canYTimescaled(): boolean { return false; }

    /**
     * if the user choose an axis then it will be deleted for the next suggestion
     * @param options {ObservationColumn[]} -  
     * @returns {ObservationColumn[]|undefined} which are left to choose
     */
    protected excludeAlreadySelectedAxes(options:ObservationColumn[]): ObservationColumn[]|undefined {
        options = options.filter(o => o != this.xAxisOption && o != this.yAxisOption && o != this.zAxisOption);
        return options.length > 0 ? options : undefined;
    }

    /**
     * if time can used for one axis then it gives back true
     * @returns {boolean} true if time is selected
     */
    protected isTimeScaleable(): boolean {
        return this.columns.includes('Result time') && this.isInterpretableTimeFormat();
    }

    /**
     * if timt is grouped by or not and if it is still time scalable or not
     * @param groupbyStatement 
     * @returns group by or not for time
     */
    protected static isInterpretableTimeFormat(groupbyStatement:GroupbyStatement|undefined):boolean {
        if(!groupbyStatement || !groupbyStatement.timeGroups) return true;
        if(groupbyStatement.timeGroups.length == 1 && groupbyStatement.timeGroups[0] == 'Weekday') return false;
        else if(groupbyStatement.timeGroups.length == 2) {
            let x, y;
            [x, y] = groupbyStatement.timeGroups;
            if((x == 'Year' && y == 'Month') || (x == 'Month' && y == 'Day') ||
                (x == 'Hour' && y == 'Minute') || (x == 'Minute' && y == 'Second')
            ) return true;
        } else if(groupbyStatement.timeGroups.length == 3) {
            let x, y, z;
            [x, y, z] = groupbyStatement.timeGroups;
            if((x == 'Hour' && y == 'Minute' && z == 'Second') ||
                (x == 'Year' && y == 'Month' && z == 'Day')
            ) return true;
        }
        return false;
    }

    /**
     * Object based wrapper for static function ChartSelection.isInterpretableTimeFormat
     * (using this.groupbyStatement as parameter).
     * @returns 
     */
    protected isInterpretableTimeFormat():boolean {
        return ChartSelection.isInterpretableTimeFormat(this.groupbyStatement);
    }

    /**
     * cheks if it discrete or if it continues then true otherwise false and also with the group by statement
     * @param column {ObservationColumn} 
     * @param groupbyStatement {GroupbyStatement|undefined} - if it is group by or not
     * @returns cheks if it discrete or if it continues then true otherwise false
     */
    protected static mustBeDiscrete(column: ObservationColumn, groupbyStatement:GroupbyStatement|undefined): boolean {
        if(column == 'Numerical value') return false;
        if(column == 'Result time') return !ChartSelection.isInterpretableTimeFormat(groupbyStatement);
        return groupbyStatement === undefined || !groupbyStatement.aggregationColumns.includes(column);
    }

    /**
     * Object based wrapper for static function ChartSelection.mustBeDiscrete
     * (using this.groupbyStatement as parameter).
     * @returns 
     */
    protected mustBeDiscrete(column: ObservationColumn): boolean {
        return ChartSelection.mustBeDiscrete(column, this.groupbyStatement);
    }

    /**
     * number of rows which has to be discrete 
     * @returns {number}
     */
    protected getMinNbrOfDiscretes(): number {
        return this.columns.filter(c => this.mustBeDiscrete(c)).length;
    }

    /**
     * are all axis are selected
     * @returns {boolean} true then enough false too less
     */
    private isMaxNbrOfSelectedAxes(): boolean {
        let s = 0;
        if(this.xAxisOption) s++;
        if(this.yAxisOption) s++;
        if(this.zAxisOption) s++;
        return s >= this.columns.length;
    }
}

/**
 * @classdesc decribe for each Bar Char
 * @extends ChartSelection
 */
export class Bar extends ChartSelection {

    /**
     * @see ChartSelection::constructor
     */
    constructor(data: ObservationProjection[], columns: ObservationColumn[], groupbyStatement:GroupbyStatement|undefined) {
        super(data, columns, groupbyStatement);
    }

    /**
     * @see ChartSelection.isSelectable
     * @override
     */
    static override isSelectable(columns: ObservationColumn[], groupbyStatement:GroupbyStatement|undefined): boolean {
        return super.isSelectable(columns, groupbyStatement) && (
            groupbyStatement !== undefined ||
            columns.filter(c => ChartSelection.mustBeDiscrete(c, groupbyStatement)).length <= 1
        );
    }

    /**
     * @see ChartSelection::getChartData
     * @override
     */
    override getChartData(): any {
        let d = super.getChartData();
        if(!this.xAxisOption && !this.zAxisOption) d.labels = d.datasets[0].data.map((_:any)=>'');
        return d;
    }

    /**
     * @see ChartSelection::getZAxisOptions
     * @override
     */
    override getZAxisOptions(): ObservationColumn[]|undefined {
        if(!super.getZAxisOptions() || !this.groupbyStatement) return undefined;
        let o = this.excludeAlreadySelectedAxes(this.groupbyStatement.groupedColumns);
        if(o && o.length == 1) {
            this.zAxisOption == o[0];
            return undefined;
        }
        return o;
    }

    /**
     * @see ChartSelection::isZAxisRequired
     */
    isZAxisRequired(): boolean {return this.columns.length >= 3;}

    protected setRequiredAxesOptions(): void {    }
}

/**
 * @classdesc
 * @extends ChartSelection
 */
export class PieDoughnut extends ChartSelection {

    /**
     * @see ChartSelection::constructor
     */
    constructor(data: ObservationProjection[], columns: ObservationColumn[], groupbyStatement:GroupbyStatement|undefined) {
        super(data, columns, groupbyStatement);
    }

    static override isSelectable(columns: ObservationColumn[], groupbyStatement:GroupbyStatement|undefined, data:ObservationProjection[]): boolean {
        if(!super.isSelectable(columns, groupbyStatement)) return false;
        // need at least 1 numeric column without negative values
        return PieDoughnut.getNonNegativeNumericColumns(columns, groupbyStatement, data!).length > 0;
    }

    /**
     * @see ChartSelection::getYAxisOptions()
     */
    override getYAxisOptions(): ObservationColumn[] | undefined {
        let o = super.getYAxisOptions();
        if(!o) return undefined;
        o = PieDoughnut.getNonNegativeNumericColumns(this.columns, this.groupbyStatement, this.data!);
        if(o.length == 1) {
            this.yAxisOption = o[0];
            return undefined;
        }
        return o;
    }

    /**
     * @see ChartSelection::getChartOptions()
     */
    override getChartOptions(): any {
        let o = super.getChartOptions();
        o.scales.y.ticks = {display: false};
        o.scales.x.ticks = {display: false};
        o.scales.y.grid = {display:false };
        o.scales.x.grid = {display:false };
        o.scales.y.border = {display: false};
        o.scales.x.border = {display: false};
        return o;
    }

    isZAxisRequired(): boolean { return this.getMinNbrOfDiscretes() > 1;}

    protected setRequiredAxesOptions(): void {  }

    /**
     * cheks which colums does not have negativ and not numerical because you can not use it here
     * @param columns {ObservationColumn[]} - all cloums which have to be cheked
     * @param groupbyStatement {GroupbyStatement|undefined} - the group by statement
     * @param data {GroupbyStatement|undefined} - all the data 
     * @returns the data which fit in the description
     */
    private static getNonNegativeNumericColumns(columns: ObservationColumn[], groupbyStatement:GroupbyStatement|undefined, data:ObservationProjection[]): ObservationColumn[] {
        let nonNegative:ObservationColumn[] = [];
        for(let i = 0; i < columns.length; i++) {
            if((columns[i] == 'Numerical value' || (groupbyStatement && groupbyStatement.aggregationColumns.includes(columns[i])))) {
                let isNonNegative = true;
                for(const row of data) {
                    if(row[i] !== undefined && (row[i] as number) < 0) {
                        isNonNegative = false;
                        break;
                    }
                }
                if(isNonNegative) nonNegative.push(columns[i]);
            }
        }
        return nonNegative;
    }
}

/**
 * @classdesc all diagram for those who have a X-Axis the time then it is calculate different
 * @extends ChartSelection
 */
abstract class ChartSelection_xCartesianTimeScaled extends ChartSelection {

    /**
     * @see ChartSelection::constructor
     */
    constructor(data: ObservationProjection[], columns: ObservationColumn[], groupbyStatement:GroupbyStatement|undefined) {
        super(data, columns, groupbyStatement);
    }

    /**
     * @see ChartSelection::getChartOptions()
     */
    override getChartOptions():any {
        let o:any = super.getChartOptions();
        if(this.xAxisOption == 'Result time' && this.isTimeScaleable() && (
            !this.groupbyStatement || !this.groupbyStatement.timeGroups || this.groupbyStatement.timeGroups.length > 0
        )) {
            o.scales.x.type = 'time';
            if(this.groupbyStatement && this.groupbyStatement.timeGroups)
                o.scales.x.time = {
                    unit:this.groupbyStatement.timeGroups[this.groupbyStatement.timeGroups.length-1].toLowerCase()
                };
        }
        return o;
    }

    isZAxisRequired(): boolean { return this.getMinNbrOfDiscretes() > 1;}
}

/**
 * @classdesc
 * @extends ChartSelection_xCartesianTimeScaled
 */
export class Line extends ChartSelection_xCartesianTimeScaled {

    /**
     * @see ChartSelection::constructor
     */
    constructor(data: ObservationProjection[], columns: ObservationColumn[], groupbyStatement:GroupbyStatement|undefined) {
        super(data, columns, groupbyStatement);
    }

    /**
     * @see ChartSelection::isSelectable
     */
    static override isSelectable(columns: ObservationColumn[], groupbyStatement:GroupbyStatement|undefined): boolean {
        let nbrOfContinous = 0;
        for(const c of columns) if(!ChartSelection.mustBeDiscrete(c, groupbyStatement)) nbrOfContinous++;
        return nbrOfContinous > 1 && super.isSelectable(columns, groupbyStatement);
    }

    /**
     * @see ChartSelection::getXAxisOptions()
     */
    override getXAxisOptions(): ObservationColumn[]|undefined {
        let o = super.getXAxisOptions();
        if(!o) return undefined;
        o = this.excludeAlreadySelectedAxes(o.filter(c => !this.mustBeDiscrete(c)));
        if(o && o.length == 1) {
            this.xAxisOption = o[0];
            return undefined;
        }
        return o;
    }

    /**
     * @see ChartSelection::getChartOptions()
     */
    override getChartOptions(): any {
        let o = super.getChartOptions();
        if(this.xAxisOption != 'Result time') o.scales.x.type = 'linear';
        return o;
    }

     /**
     * @see ChartSelection::setRequiredAxesOptions()
     */
    protected setRequiredAxesOptions(): void {
        if((this.columns.length == 2 && this.isTimeScaleable()) || (
            this.groupbyStatement && this.groupbyStatement.timeGroups &&
            this.groupbyStatement.timeGroups.length == 1
        )) {
            this.xAxisOption = 'Result time';
            this.yAxisOption = this.columns[0] == 'Result time' ? this.columns[1] : this.columns[0];
        }
    }
}

/**
 * @classdesc
 * @extends ChartSelection_xCartesianTimeScaled
 */
export class Scatter extends ChartSelection_xCartesianTimeScaled {

    /**
     * @see ChartSelection::constructor
     */
    constructor(data: ObservationProjection[], columns: ObservationColumn[], groupbyStatement:GroupbyStatement|undefined) {
        super(data, columns, groupbyStatement);
    }

    /**
     * @see ChartSelection::isSelectable()
     */
    static override isSelectable(columns: ObservationColumn[], groupbyStatement:GroupbyStatement|undefined): boolean {
        return columns.length > 1 && super.isSelectable(columns, groupbyStatement);
    }

     /**
     * @see ChartSelection::getYAxisOptions()
     */
    override getYAxisOptions(): ObservationColumn[]|undefined {
        let o = super.getYAxisOptions();
        if(!o) return undefined;
        if(this.isTimeScaleable() || (this.groupbyStatement && this.groupbyStatement.timeGroups &&
            this.groupbyStatement.timeGroups.length == 1 && this.groupbyStatement.timeGroups[0] != 'Weekday'))
            o.push('Result time');
        o = this.excludeAlreadySelectedAxes(o);
        if(o && o.length == 1) {
            this.yAxisOption = o[0];
            return undefined;
        }
        return o;
    }

    /**
     * @see ChartSelection::getChartData()
     */
    override getChartData():any {
        let data = super.getChartData();
        if(this.groupbyStatement && this.groupbyStatement.timeGroups && this.groupbyStatement.timeGroups.length == 1 && this.groupbyStatement.timeGroups[0] != 'Weekday')
            data.datasets.map((set:{labels?:any, data:(string|undefined)[]}) => set.data.map(d => Number(d)));
        return data;
    }

    /**
     * @see ChartSelection::getChartOptions()
     */
    override getChartOptions(): any {
        let o = super.getChartOptions();
        o.elements = { point:{ radius: 4, hoverRadius: 6 } };
        if(this.yAxisOption == 'Result time' && this.isTimeScaleable()) {
            let min = (this.data.map(row => row[this.columns.indexOf('Result time')]) as (Date|undefined)[]).reduce(
                (a:Date|undefined, b:Date|undefined) => a === undefined ? b : (b === undefined ? a : (a < b ? a : b))
                );
            o.scales.y.type = 'time';
            o.scales.y.min = min;
            if(this.groupbyStatement && this.groupbyStatement.timeGroups)
                o.scales.y.time = {
                    unit:this.groupbyStatement.timeGroups[this.groupbyStatement.timeGroups.length-1].toLowerCase()
                };
        }
        if(this.mustBeDiscrete(this.xAxisOption!) || (
            this.xAxisOption == 'Result time' && !this.isInterpretableTimeFormat())
        ) o.scales.x.type = 'category';

        return o;
    }

    /**
    * @see ChartSelection::canYTimescaled()
    */
    protected override canYTimescaled(): boolean { return true; }

    /**
    * @see ChartSelection::setRequiredAxesOptions()
    */
    protected setRequiredAxesOptions(): void {    }
}