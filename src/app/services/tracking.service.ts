import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Tracker } from '../components/models';

@Injectable({
  providedIn: 'root'
})
export class TrackingService {

  private readonly localStorageKey = 'trackedCategories';

  // BehaviorSubject to hold the tracking data
  private trackingDataSubject = new BehaviorSubject<any[]>(this.getTrackingData());

  // Observable for components to subscribe to
  trackingData$: Observable<Tracker[]> = this.trackingDataSubject.asObservable();

  constructor() { }

  /** Save tracking data to local storage and notify subscribers */
  saveTrackingData(newData: any[]): void {
    if (newData.length === 0) {
      console.log('No new data to save. Retaining existing tracking data.');
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

    console.log('Tracking data merged and saved to local storage:', finalData);
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
    console.log('Tracking data cleared from local storage.');
  }
}
