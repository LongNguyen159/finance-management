import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Tracker } from '../components/models';

@Injectable({
  providedIn: 'root'
})
export class TrackingService {

  private readonly localStorageKey = 'trackedCategories';

  // BehaviorSubject to hold the tracking data
  private trackingDataSubject = new BehaviorSubject<Tracker[]>(this.getTrackingData());

  // Observable for components to subscribe to
  trackingData$: Observable<Tracker[]> = this.trackingDataSubject.asObservable();

  categoriesToTrack = signal<string[]>([])

  constructor() { }

  /** Save tracking data to local storage and notify subscribers */
  saveTrackingData(newData: Tracker[], mergeNewIntoExisting: boolean = false): void {
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
  
    // Save the result back to local storage
    localStorage.setItem(this.localStorageKey, JSON.stringify(finalData));
  
    // Update the BehaviorSubject to notify subscribers
    this.trackingDataSubject.next(finalData);
  
    console.log(
      mergeNewIntoExisting
        ? 'Tracking data merged and saved to local storage:'
        : 'Tracking data overridden and saved to local storage:',
      finalData
    );
  }
  
  

  /** Remove tracking data by name */
  removeTrackingData(name: string): void {
    const currentData = this.getTrackingData();

    // Filter out the category with the matching name
    const updatedData = currentData.filter(item => item.name !== name);

    // Save the updated data back to local storage
    localStorage.setItem(this.localStorageKey, JSON.stringify(updatedData));

    // Update the BehaviorSubject to notify subscribers
    this.trackingDataSubject.next(updatedData);
  }

  /** Retrieve tracking data from local storage */
  getTrackingData(): Tracker[] {
    const savedData = localStorage.getItem(this.localStorageKey);
    return savedData ? JSON.parse(savedData) as Tracker[] : [];
  }

  /** Clear tracking data from local storage and notify subscribers */
  clearTrackingData(): void {
    localStorage.removeItem(this.localStorageKey);
    this.trackingDataSubject.next([]); // Notify subscribers about the change
  }
}
