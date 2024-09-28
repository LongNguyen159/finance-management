import { Injectable } from '@angular/core';
import { SankeyInput } from './models';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  userDefinedLinks: SankeyInput[] = [
    { source: 'Total Income', target: 'Taxes', value: 200 },
    { source: 'Total Income', target: 'Net Income', value: 800 },
    { source: 'Net Income', target: 'Housing', value: 400 },
    { source: 'Housing', target: 'Electricity', value: 50 },
    { source: 'Housing', target: 'Water', value: 50 },
    { source: 'Housing', target: 'Wifi', value: 50 },
    { source: 'Net Income', target: 'Commute', value: 100 },
  ]

  
  constructor() { }
}
