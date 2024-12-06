import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ForecastData } from '../components/models';

@Injectable({
  providedIn: 'root'
})
export class PredictService {
  private backendUrl = 'http://localhost:3000/predict';

  constructor(private http: HttpClient) {}

  getPrediction(data: number[]) {
    return this.http.post<ForecastData>(this.backendUrl, { data });
  }
}
