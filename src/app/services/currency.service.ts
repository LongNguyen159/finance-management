import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {

  private readonly currencyKey = 'selectedCurrency';
  private readonly defaultCurrency = 'EUR';

  private currencySymbols: { [key: string]: string } = {
    USD: '$',
    EUR: '€',
    VND: '₫',
  };


  constructor() { }


  getSelectedCurrency(): string {
    return localStorage.getItem(this.currencyKey) || this.defaultCurrency;
  }
  getCurrencySymbol(currency: string = this.getSelectedCurrency()): string {
      return this.currencySymbols[currency] || '';
  }

  setSelectedCurrency(currency: string): void {
      localStorage.setItem(this.currencyKey, currency);
  }
}
