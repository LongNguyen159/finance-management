import { Component, EventEmitter, Input, OnChanges, Output, signal, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
import { MonthPickerHeaderComponent } from '../month-picker-header/month-picker-header.component';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatCalendarCellClassFunction, MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { DatePipe } from '@angular/common';
import { formatDateToYYYYMM } from '../../utils/utils';

@Component({
  selector: 'app-simple-month-picker',
  standalone: true,
  imports: [
    MatButtonModule,
    MatMenuModule,
    MatDatepickerModule,
    DatePipe
  ],
  providers: [
    provideNativeDateAdapter()
  ],
  templateUrl: './simple-month-picker.component.html',
  styleUrl: './simple-month-picker.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class SimpleMonthPickerComponent implements OnChanges {
  @Input() dateValue: Date = new Date();

  /** Comparator to validate the date range is valid: start must always <= end */
  @Input() comparator!: Date;
  @Input() type!: 'start' | 'end';
  
  @Output() selectedMonth = new EventEmitter<string>();


  customHeaderComponent = MonthPickerHeaderComponent

  /** Set Selected date to be the start or end date of the Input */
  selectedDate = signal(new Date());
  calendarVisible = signal(false);

  /** Date filter validation: Validates if start always <= end */
  rangeValidator = (date: Date | null): boolean => {
    if (!date) {
      return false;
    }

    if (this.type === 'start') {
      return date <= this.comparator
    } else if (this.type === 'end') {
      return date >= this.comparator
    }
    return true
  };

  /** Highlight the selected date, start date, end date and in-between dates */
  dateClass: MatCalendarCellClassFunction<Date> = (cellDate, view) => {
    if (this.type === 'start') {
      if (cellDate.getTime() === this.dateValue.getTime()) {
        return 'highlight-date highlight-start-date';
      } else if (cellDate.getTime() === this.comparator.getTime()) {
        return 'highlight-date highlight-end-date';
      } else if (cellDate > this.dateValue && cellDate < this.comparator) {
        return 'highlight-date highlight-in-between-date';
      }
    } else if (this.type === 'end') {
      if (cellDate.getTime() === this.dateValue.getTime()) {
        return 'highlight-date highlight-end-date';
      } else if (cellDate.getTime() === this.comparator.getTime()) {
        return 'highlight-date highlight-start-date';
      } else if (cellDate > this.comparator && cellDate < this.dateValue) {
        return 'highlight-date highlight-in-between-date';
      }
    }
    return '';
  };

  

  @ViewChild(MatMenuTrigger) calendarMenuTrigger!: MatMenuTrigger; // Inject MatMenuTrigger

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['dateValue'] && !isNaN(changes['dateValue'].currentValue)) {
      this.selectedDate.set(this.dateValue);
    }
  }

  /** Toggle calendar visibility.
   * The open/close state of calendar should be synced with open/close state of menu.
   * Because it makes no sense when calendar is closed by menu is still open.
   */
  toggleCalendar() {
    this.calendarVisible.set(!this.calendarVisible());
    this.calendarVisible() ? this.calendarMenuTrigger.openMenu() : this.calendarMenuTrigger.closeMenu();
  }


  /** Emits the selected month on month selected */
  onMonthSelected(selectedMonth: Date | null) {
    if (!selectedMonth) {
      return;
    }
    // Create a new Date instance to ensure immutability
    const newDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    this.selectedDate.set(newDate);

    
    this.selectedMonth.emit(formatDateToYYYYMM(newDate));

    // Hide calendar & close menu after selection
    this.calendarVisible.set(false);
    this.calendarMenuTrigger.closeMenu();
  }
}
