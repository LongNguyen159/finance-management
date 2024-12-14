import { Injectable } from '@angular/core';
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

  constructor() { }

  /** Save tracking data to local storage and notify subscribers */
  saveTrackingData(newData: Tracker[]): void {
    if (newData.length === 0) {
      return;
    }

    const existingData = this.getTrackingData();

    // Merge the existing data with the new data
    const mergedData = newData.map(newItem => {
      const existingItem = existingData.find(item => item.name === newItem.name);
      if (existingItem) {
        return {
          ...existingItem,
          currentSpending: newItem.currentSpending,
          targetSpending: newItem.targetSpending,
          percentageSpent: newItem.percentageSpent
        };
      }
      return newItem;
    });

    const remainingCategories = existingData.filter(
      item => !newData.some(newItem => newItem.name === item.name)
    );

    const finalData = [...mergedData, ...remainingCategories];

    // Save the result back to local storage
    localStorage.setItem(this.localStorageKey, JSON.stringify(finalData));

    // Update the BehaviorSubject to notify subscribers
    this.trackingDataSubject.next(finalData);
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
