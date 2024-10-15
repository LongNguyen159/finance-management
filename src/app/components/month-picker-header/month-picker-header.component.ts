import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatCalendar } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { Subject } from 'rxjs';
import { startWith, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-month-picker-header',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    CommonModule
  ],
  templateUrl: './month-picker-header.component.html',
  styleUrl: './month-picker-header.component.scss'
})
export class MonthPickerHeaderComponent<D> {
  private _calendar = inject<MatCalendar<D>>(MatCalendar);
  private _dateAdapter = inject<DateAdapter<D>>(DateAdapter);

  previousYearClicked() {
    this._calendar.activeDate = this._dateAdapter.addCalendarYears(this._calendar.activeDate, -1);
  }

  // Navigate to today's date
  goToToday() {
    this._calendar.activeDate = this._dateAdapter.today();
  }

  // Navigate to the next year
  nextYearClicked() {
    this._calendar.activeDate = this._dateAdapter.addCalendarYears(this._calendar.activeDate, 1);
  }
}
