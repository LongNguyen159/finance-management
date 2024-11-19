import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';

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
    this.loadLogsFromSessionStorage();
  }

  setLog(month: string, inputId: string, newValue: string): void {
    const _timestamp = new Date()
    const timestamp = this.datePipe.transform(_timestamp, 'HH:mm:ss') || '';

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
    if (this.logs[month][inputId].length > 3) {
      this.logs[month][inputId].pop(); // Remove the oldest log
    }

    this.saveLogsToSessionStorage();
  }

  /** Get logs for a specific input ID in a specific month */
  getLogs(month: string, inputId: string): { timestamp: string; value: string }[] {
    return this.logs[month]?.[inputId] || [];
  }

  /** [NOT IMPLEMENTED YET] Remove logs for a specific input ID in a specific month */
  removeLogs(month: string, inputId: string): void {
    if (this.logs[month]?.[inputId]) {
      delete this.logs[month][inputId];
      this.saveLogsToSessionStorage();
    }
  }

  /** [NOT IMPLEMENTED YET] Remove all logs for a specific month */
  removeMonthLogs(month: string): void {
    if (this.logs[month]) {
      delete this.logs[month];
      this.saveLogsToSessionStorage();
    }
  }

  /** Save logs to Session Storage */
  private saveLogsToSessionStorage(): void {
    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.logs));
    } catch (error) {
      console.error('Error saving logs to Session Storage:', error);
    }
  }

  /** Load logs from Session Storage */
  private loadLogsFromSessionStorage(): void {
    try {
      const storedLogs = sessionStorage.getItem(this.STORAGE_KEY);
      this.logs = storedLogs ? JSON.parse(storedLogs) : {};
    } catch (error) {
      console.error('Error loading logs from Session Storage:', error);
      this.logs = {};
    }
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

    this.saveLogsToSessionStorage()
  }
}
