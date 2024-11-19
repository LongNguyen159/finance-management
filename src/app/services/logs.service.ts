import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { MonthlyData } from '../components/models';


@Injectable({
  providedIn: 'root'
})

/**
 * Manage Logs for each input ID of a month.
 * 
 * This logs trace the changes made to 'Amount' input field, and keep the last 3 changes.
 * 
 * Purpose: So that user remembers what the entered previously, making it easier to revert back
 * if they made a mistake in entering the amount.
 * 
 * Use Case:
 * - User enters an amount in the 'Amount' field using inline calculator: 100 + 200 = 300
 * - And while editing the amount, they might forget "Where am I? What was the previous amount? Did I include them already?"
 * 
 * 
 */
export class LogsService {
  private logs: { [month: string]: { [inputId: string]: { timestamp: string; value: string }[] } } = {};
  private readonly STORAGE_KEY = 'logs';

  constructor(private datePipe: DatePipe) {
    this.loadLogsFromLocalStorage();
  }

  setLog(month: string, inputId: string, newValue: string): void {
    const _timestamp = new Date()

    /** Timestamp for the Logs */
    const timestamp = this.datePipe.transform(_timestamp, 'HH:mm') || '';

    // Ensure logs for the month exist
    if (!this.logs[month]) {
      this.logs[month] = {};
    }

    // Ensure logs for the inputId exist
    if (!this.logs[month][inputId]) {
      this.logs[month][inputId] = [];
    }

    // Add the new log entry
    this.logs[month][inputId].unshift({ timestamp, value: newValue });

    // Keep only the last 3 logs for the input ID
    if (this.logs[month][inputId].length > 5) {
      this.logs[month][inputId].pop(); // Remove the oldest log
    }

    this.saveLogsToLocalStorage();
  }

  /** Get logs for a specific input ID in a specific month */
  getLogs(month: string, inputId: string): { timestamp: string; value: string }[] {
    return this.logs[month]?.[inputId] || [];
  }

  /** [NOT IMPLEMENTED YET] Remove logs for a specific input ID in a specific month */
  removeLogs(month: string, inputId: string): void {
    if (this.logs[month]?.[inputId]) {
      delete this.logs[month][inputId];
      this.saveLogsToLocalStorage();
    }
  }

  /** [NOT IMPLEMENTED YET] Remove all logs for a specific month */
  removeMonthLogs(month: string): void {
    if (this.logs[month]) {
      delete this.logs[month];
      this.saveLogsToLocalStorage();
    }
  }

  /** Save logs to Session Storage */
  private saveLogsToLocalStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.logs));
    } catch (error) {
      console.error('Error saving logs to Session Storage:', error);
    }
  }

  /** Load logs from Session Storage */
  private loadLogsFromLocalStorage(): void {
    try {
      const storedLogs = localStorage.getItem(this.STORAGE_KEY);
      this.logs = storedLogs ? JSON.parse(storedLogs) : {};
      const monthlyData: MonthlyData = JSON.parse(localStorage.getItem('monthlyData') || '{}');
      this.cleanupLogs(monthlyData)
    } catch (error) {
      console.error('Error loading logs from Session Storage:', error);
      this.logs = {};
    }
  }

  /** Keep logs in LocalStorage no more than 30days since their creation date.
   * Use "lastUpdated" property of each month to determine when the logs were last updated.
   * 
   * This function is called only on app load.
   * 
   */
  cleanupLogs(monthlyData: MonthlyData): void {
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    const now = Date.now();
  
    // Return early if monthlyData is empty
    if (!monthlyData || Object.keys(monthlyData).length === 0) {
      console.warn("MonthlyData is empty, skipping cleanup.");
      return;
    }
  
    for (const month in this.logs) {
      const lastUpdated = monthlyData[month]?.lastUpdated;
  
      // Skip if lastUpdated is missing or invalid
      if (!lastUpdated) {
        console.warn(`No valid lastUpdated for month: ${month}, skipping this month.`);
        continue;
      }
  
      // Delete the logs if lastUpdated is older than 30 days
      if (now - new Date(lastUpdated).getTime() > THIRTY_DAYS_MS) {
        console.info(`Deleting logs for month: ${month}, last updated: ${lastUpdated}`);
        delete this.logs[month];
      }
    }
  
    this.saveLogsToLocalStorage();
  }


  /** Sanitise the logs, only keep valid ids in that month.
   * If id changes, or content being pasted (old entries aren't valid anymore), this function clears out
   * the logs for the invalid ids.
   * @param month The month to sanitise logs for.
   * @param validIds The valid IDs (all IDs of that month) to keep logs for.
   * 
   * This function should be called after data is processed, or on form submit.
   */
  sanitiseLogs(month: string, validIds: string[]): void {
    if (!this.logs[month]) return;
  
    // Convert the valid IDs into a Set for faster lookups
    const validIdsSet = new Set(validIds);
  
    // Filter the logs to keep only those with valid IDs
    this.logs[month] = Object.fromEntries(
      Object.entries(this.logs[month]).filter(([inputId]) => validIdsSet.has(inputId))
    );

    this.saveLogsToLocalStorage()
  }
}
