import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Tracker, TrackingMetaData } from '../components/models';

@Injectable({
  providedIn: 'root'
})
export class TrackingService {

  private readonly localStorageKey = 'trackedCategories';

  // BehaviorSubject to hold the tracking data
  private trackingDataSubject = new BehaviorSubject<Tracker[]>(this.getTrackingData());
  private trackingMetaDataSubject = new BehaviorSubject<{ targetSurplus: number; avgIncome: number }>(this.getAdditionalData());

  // Observable for components to subscribe to
  trackingCategories$: Observable<Tracker[]> = this.trackingDataSubject.asObservable();
  trackingMetaData$: Observable<{ targetSurplus: number; avgIncome: number }> = this.trackingMetaDataSubject.asObservable();

  categoriesToTrack = signal<string[]>([]);

  constructor() { }

  /** Save tracking data to local storage and notify subscribers */
  saveTrackingData(newData: Tracker[], targetSurplus: number, avgIncome: number, mergeNewIntoExisting: boolean = false): void {
    // Filter out any categories where the target spending is 0
    const validData = newData.filter(item => item.targetSpending !== 0);

    if (validData.length === 0) {
      console.log('No valid data to save (all categories have target spending of 0). Retaining existing tracking data.');
      return;
    }

    let finalData: Tracker[];

    if (mergeNewIntoExisting) {
      const existingData = this.getTrackingData();

      // Merge the existing data with the valid new data
      const mergedData = validData.map(newItem => {
        const existingItem = existingData.find(item => item.name === newItem.name);
        if (existingItem) {
          // Update the existing category
          return {
            ...existingItem,
            currentSpending: newItem.currentSpending,
            targetSpending: newItem.targetSpending,
            percentageSpent: newItem.percentageSpent
          };
        }
        // Add the new category if it doesn't exist
        return newItem;
      });

      const remainingCategories = existingData.filter(
        item => !validData.some(newItem => newItem.name === item.name)
      );

      finalData = [...mergedData, ...remainingCategories];
    } else {
      // Override everything with valid new data
      finalData = validData;
    }

    // Save all data into local storage
    const dataToSave = {
      trackingCategories: finalData,
      targetSurplus,
      avgIncome
    };

    localStorage.setItem(this.localStorageKey, JSON.stringify(dataToSave));

    // Update the BehaviorSubject to notify subscribers
    this.trackingDataSubject.next(finalData);
    this.trackingMetaDataSubject.next({ targetSurplus, avgIncome });

    console.log(
      mergeNewIntoExisting
        ? 'Tracking data merged and saved to local storage:'
        : 'Tracking data overridden and saved to local storage:',
      dataToSave
    );
  }



  /** Update the current spending for multiple categories */
  updateMultipleCurrentSpendings(updates: { name: string; totalValue: number }[]): void {
    // Get the current tracking data
    const currentData = this.getTrackingData();

    // Map through the current tracking data and update the matching categories
    const updatedData = currentData.map(item => {
      const update = updates.find(u => u.name === item.name); // Find the matching update
      if (update) {
        return {
          ...item,
          currentSpending: update.totalValue, // Update the current spending
          percentageSpent: (update.totalValue / item.targetSpending) * 100 // Recalculate percentage spent
        };
      }
      return item; // Return unchanged item if no update matches
    });

    // Retrieve existing targetSurplus and avgIncome
    const { targetSurplus, avgIncome } = this.getAdditionalData();

    // Save updated data back to local storage
    const dataToSave = {
      trackingCategories: updatedData,
      targetSurplus,
      avgIncome
    };

    localStorage.setItem(this.localStorageKey, JSON.stringify(dataToSave));

    // Update the BehaviorSubject to notify subscribers
    this.trackingDataSubject.next(updatedData);
  }

  /** Function to cleanup tracked categories: Reset value to 0 if no data of current year is found, but is defined in trackers.
   * (categories that are being tracked but current year has no spending yet, but still has spending from last year)
   */
  cleanupTrackingCategories( categoriesOfCurrentYear: {name: string; totalValue: number;}[] ) {
    const trackedCategories = this.getTrackingData();
    const categoriesOfCurrentYearNames = categoriesOfCurrentYear.map(category => category.name);

    trackedCategories.forEach(trackedCategory => {
      if (!categoriesOfCurrentYearNames.includes(trackedCategory.name)) {
        this.updateMultipleCurrentSpendings([{ name: trackedCategory.name, totalValue: 0 }]);
      }
    })
  }



  /** Remove tracking data by name */
  removeTrackingData(name: string): void {
    const currentData = this.getTrackingData();

    // Filter out the category with the matching name
    const updatedData = currentData.filter(item => item.name !== name);

    // Retrieve existing targetSurplus and avgIncome
    const { targetSurplus, avgIncome } = this.getAdditionalData();

    // Save updated data back to local storage
    const dataToSave = {
      trackingCategories: updatedData,
      targetSurplus,
      avgIncome
    };

    localStorage.setItem(this.localStorageKey, JSON.stringify(dataToSave));

    // Update the BehaviorSubject to notify subscribers
    this.trackingDataSubject.next(updatedData);
    this.trackingMetaDataSubject.next({ targetSurplus, avgIncome });
  }

  /** Retrieve tracking data from local storage */
  getTrackingData(): Tracker[] {
    const savedData = localStorage.getItem(this.localStorageKey);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData) as TrackingMetaData;
        return parsedData.trackingCategories || [];
      } catch (error) {
        console.error('Error parsing tracking data from local storage:', error);
      }
    }
    return [];
  }

  /** Retrieve target surplus and average income */
  getAdditionalData(): { targetSurplus: number; avgIncome: number } {
    const savedData = localStorage.getItem(this.localStorageKey);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        return {
          targetSurplus: parsedData.targetSurplus || 0,
          avgIncome: parsedData.avgIncome || 0
        };
      } catch (error) {
        console.error('Error parsing additional data from local storage:', error);
      }
    }
    return { targetSurplus: 0, avgIncome: 0 };
  }

  /** Clear tracking data from local storage and notify subscribers */
  clearTrackingData(): void {
    localStorage.removeItem(this.localStorageKey);
    this.trackingDataSubject.next([]); // Notify subscribers about the change
    this.trackingMetaDataSubject.next({ targetSurplus: 0, avgIncome: 0 }); // Notify subscribers about the change
    console.log('Tracking data cleared from local storage.');
  }
}
