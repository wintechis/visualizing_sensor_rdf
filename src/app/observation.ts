import { MatDialog } from '@angular/material/dialog';
import { graph, sym, parse} from 'rdflib';
import { ErrorDialogComponent } from './error-dialog/error-dialog.component';

/**
 * an observation from thr original turtle file
 */
export type Observation = [ 
    number|undefined, // Numerical value
    string|undefined, // Unit
    string|undefined, // Made by sensor
    string|undefined, // Observed property
    Date|undefined    // Result time
];

/**
 * it is one line from the turtle data but it is not known from where 
 */
export type ObservationProjection = (string|number|Date|undefined)[];

/**
 * all columns name from the turtle file
 */
export type ObservationColumnFromFile = 'numericalValue' | 'unit' | 'madeBySensor' | 'observedProperty' | 'resultTime';

/**
 * all columns name that are named for the user
 */
export type ObservationColumn = 'Numerical value' | 'Unit' | 'Made by sensor' | 'Observed property' | 'Result time';

/**
 * that every column has a index
 */
export const OBSERVATION_MAP = {
    'Numerical value': 0,
    'Unit': 1,
    'Made by sensor': 2,
    'Observed property': 3,
    'Result time': 4 
};

/**
 * @enum the names for all coulumn
 */
export enum OBSERVATION_NAMES {
    numericalValue = 'Numerical value', 
    unit = 'Unit',
    madeBySensor = 'Made by sensor', 
    observedProperty = 'Observed property', 
    resultTime = 'Result time', 
};

/**
 * all columns name as const
 */
export const OBSERVATION_COL_NAMES: ObservationColumn[] = Object.keys(OBSERVATION_MAP).map(c => c as ObservationColumn);

/**
 * is one column is discrete 
 * @param column {ObservationColumn} - 
 * @returns if true then discret otherwise false
 */
export function isDiscrete(column: ObservationColumn): boolean {
    return column != 'Numerical value' && column != 'Result time';
}

/**
 * change from Date to String
 * @param d {Date} - a date typ
 * @returns the date as string
 */
export function dateToString(d:Date): string {
  return d.toISOString();
}

/**
 * On a diagram the seperator between the time scals
 */
export const TIME_GROUPS_SEP_MAP = {
  'Year': '-',
  'Month': '-',
  'Day': ',',
  'Weekday': ',',
  'Hour': ':',
  'Minute': ':',
  'Second': ':'
}

/**
 * the function for pasing string to Observation[]
 * @param turtleText {string} - string 
 * @param dialog {MatDialo} - erro if one happen
 * @returns {Observation[]}
 */
export function parseTurtleText(turtleText:string, dialog: MatDialog): Observation[] {

    let store = graph();
    parse(
        turtleText, store, sym('http://localhost').uri, 'text/turtle',
        e => { if(e) dialog.open(ErrorDialogComponent, { data: 'Error while parsing raw turtle data, check file for syntax validity!' }) }
    );
    let data: Observation[] = [];
    
    let observationTriples = store.match(
      null,
      store.sym('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), // a 
      store.sym('http://www.w3.org/ns/sosa/Observation')
    );
    let subjects = observationTriples.map(triple => triple.subject);

    let sosa = 'http://www.w3.org/ns/sosa/';

    let getObject = (subject: any, prefix:string, predicate: ObservationColumnFromFile) => {
      if(store) {
        let res = store.match(subject, store.sym(prefix + predicate), null, null);
        if(res.length <= 0) return undefined;
        else return res[0].object.value; // maximal ein Ergebnis als match
      } else return undefined;
    }
    let getObjectSosa = (subject: any, predicate: ObservationColumnFromFile) => getObject(subject, sosa, predicate);
    let getObjectQudt = (subject: any, predicate: ObservationColumnFromFile) => getObject(subject, 'http://qudt.org/schema/qudt/', predicate);

    for(let s of subjects) {
      let blankNode: any | undefined = store.match(s, store.sym(sosa + 'hasResult'), null, null);
        if(blankNode.length <= 0) blankNode = undefined;
        else blankNode = blankNode[0].object;

      let numericalValue = blankNode ? getObjectQudt(blankNode, 'numericalValue') : undefined;

      let timestamp = getObjectSosa(s, 'resultTime');
      data.push([
        numericalValue ? Number(numericalValue) : undefined,
        blankNode ? getObjectQudt(blankNode, 'unit') : undefined,
        getObjectSosa(s, 'madeBySensor'),
        getObjectSosa(s, 'observedProperty'),
        timestamp ? new Date(timestamp) : undefined
      ]);
    }
    return data;
  }