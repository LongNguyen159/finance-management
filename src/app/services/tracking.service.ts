import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TrackingService {

  private readonly localStorageKey = 'trackedCategories';

  constructor() { }

  /** Save tracking data to local storage */
  saveTrackingData(newData: any[]): void {
    if (newData.length === 0) {
      console.log('No new data to save. Retaining existing tracking data.');
      return;
    }
    
    const existingData = this.getTrackingData(); // Retrieve current data from local storage
  
    // Merge the existing data with the new data
    const mergedData = newData.map(newItem => {
      const existingItem = existingData.find(item => item.name === newItem.name);
      if (existingItem) {
        // Update existing category
        return {
          ...existingItem,
          currentSpending: newItem.currentSpending,
          targetSpending: newItem.targetSpending,
        };
      }
      // Add new category if it doesn't exist
      return newItem;
    });
  
    // Add back categories that are in `existingData` but not in `newData`
    const remainingCategories = existingData.filter(
      item => !newData.some(newItem => newItem.name === item.name)
    );
  
    // Combine merged and remaining data
    const finalData = [...mergedData, ...remainingCategories];
  
    // Save the result back to local storage
    localStorage.setItem(this.localStorageKey, JSON.stringify(finalData));
    console.log('Tracking data merged and saved to local storage:', finalData);
  }
  

  /** Retrieve tracking data from local storage */
  getTrackingData(): any[] {
    const savedData = localStorage.getItem(this.localStorageKey);
    if (savedData) {
      console.log('Tracking data retrieved from local storage:', JSON.parse(savedData));
      return JSON.parse(savedData);
    }
    console.log('No tracking data found in local storage.');
    return [];
  }

  /** Clear tracking data from local storage (optional utility) */
  clearTrackingData(): void {
    localStorage.removeItem(this.localStorageKey);
    console.log('Tracking data cleared from local storage.');
  }
}
