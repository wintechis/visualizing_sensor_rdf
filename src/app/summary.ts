import { Observation, OBSERVATION_MAP } from "./observation";
import {Interval} from 'date-fns';

/**
 * @module for building the summery
 */

/**
 * the building of summery
 */
export interface Summary {
    numberOfObservations: number;

    missingValues: MissingValuesSummary | undefined;
    
    uniqueUnits: Set<string>;
    uniqueSensors: Set<string>;
    uniqueObservedProperties: Set<string>;

    timespan: Interval|undefined
    // timespan (geht erst, wenn resultTime in Zeittyp konvertiert)
}

/**
 * if a value is missing
 */
export interface MissingValuesSummary {
    numericalValue: number;
    unit: number;
    madeBySensor: number;
    observedProperty: number;
    resultTime: number;
}

/**
 * build the summery
 * @param data {Observation[]} - the data input
 * @returns {Summary} - the whole summery
 */
export function progressSummary(data: Observation[]): Summary {

    let countMissing = (values: any[]) => values.filter( (v: string | number | undefined) => v == undefined ).length;

    let getUnique = (values: any[]) => {
      let uniqueValues = new Set<string>();
      for(let v of values) uniqueValues.add(v);
      return uniqueValues;
    };

    let units = data.map(observation => observation[OBSERVATION_MAP['Unit']]);
    let sensors = data.map(observation => observation[OBSERVATION_MAP['Made by sensor']]);
    let observedProperties = data.map(observation => observation[OBSERVATION_MAP['Observed property']]);
    let time = data.map(observation => observation[OBSERVATION_MAP['Result time']]) as (Date|undefined)[];
    let missingValues: MissingValuesSummary = {
      numericalValue: countMissing(data.map(observation => observation[OBSERVATION_MAP['Numerical value']])),
      unit: countMissing(units),
      madeBySensor: countMissing(sensors),
      observedProperty: countMissing(observedProperties),
      resultTime: countMissing(time)
    }
    let hasMissingValues = missingValues.numericalValue > 0 ||
      missingValues.unit > 0 ||
      missingValues.madeBySensor > 0 ||
      missingValues.observedProperty > 0 ||
      missingValues.resultTime > 0;
    let minDate = time.reduce((prev, cur)=> prev === undefined ? cur : (cur !== undefined && cur < prev ? cur : prev));
    let maxDate = time.reduce((prev, cur)=> prev === undefined ? cur : (cur !== undefined && cur > prev ? cur : prev));
    return {
      numberOfObservations: data.length,
      missingValues: hasMissingValues ? missingValues : undefined,
      uniqueUnits: getUnique(units),
      uniqueSensors: getUnique(sensors),
      uniqueObservedProperties: getUnique(observedProperties),
      timespan: minDate ? { start:minDate, end:maxDate! } : undefined
    }
}