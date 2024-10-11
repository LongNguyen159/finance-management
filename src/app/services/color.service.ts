import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ColorService {

  darkTextPrimary = 'rgb(204,204,204)'
  
  darkBackgroundPrimary = 'rgb(34,34,34)'
  darkBackgroundSecondary = 'rgb(24,24,24)'
  
  
  lightTextPrimary = 'rgb(38,38,38)'
  lightTextSecondary = 'rgb(64,64,64)'
  lightTextTertiary = 'rgb(108,114,127)'

  lightBackgroundPrimary = 'rgb(255,255,255)'
  



  isDarkmode = true

  constructor() { }
}
