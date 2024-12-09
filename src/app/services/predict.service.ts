import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ForecastData } from '../components/models';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PredictService {
  private backendUrl = 'http://localhost:3223/predict';

  constructor(private http: HttpClient) {}

  /** Get projection data using ARIMA machine learning model.
   * @param data - Array of numbers to predict
   * @param monthsToPredict - Number of next N months to predict. Default = 5
   * 
   * @returns ForecastData - Object with forecast data as an Observable
   */
  getPrediction(data: number[], monthsToPredict: number = 5): Observable<ForecastData> {
    return this.http.post<ForecastData>(this.backendUrl, { data, monthsToPredict });
  }
}
