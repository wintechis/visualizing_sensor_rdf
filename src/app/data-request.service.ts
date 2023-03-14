/**
 * 
 * @module Angular Module for http request
 */

import { HttpClient, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataRequestService {

  /**
   * 
   * @param http 
   */
  constructor(private http: HttpClient) { }

  /**
   * @param url {string} - which url request
   * @returns {Observable<HttpEvent<string>>} - the full request
   */
  getData(url:string): Observable<HttpEvent<string>> {
    return this.http.get<any>(url, {responseType: 'text'} as any);
  }
}