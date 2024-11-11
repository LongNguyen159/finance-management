import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnInit, Output, signal, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {MatNativeDateModule, provideNativeDateAdapter} from '@angular/material/core';
import {MatDatepickerModule} from '@angular/material/datepicker';

import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import { MonthPickerHeaderComponent } from '../month-picker-header/month-picker-header.component';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { ColorService } from '../../services/color.service';
import { DataService } from '../../services/data.service';
import { BasePageComponent } from '../../base-components/base-page/base-page.component';
import { takeUntil } from 'rxjs';
import { formatYYYMMtoDate } from '../../utils/utils';
import { DateChanges } from '../models';

@Component({
  selector: 'app-month-picker',
  standalone: true,
  providers: [
    provideNativeDateAdapter()
  ],
  imports: [MatFormFieldModule, MatInputModule, MatDatepickerModule, MatIconModule,
    CommonModule, MatButtonModule,
    MatDatepickerModule, MatNativeDateModule,
    MatMenuModule
  ],
  templateUrl: './month-picker.component.html',
  styleUrl: './month-picker.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonthPickerComponent extends BasePageComponent implements OnInit {
  @Input() highlightedMonths: string[] = [];
  @Output() monthSelected = new EventEmitter<DateChanges>();

  colorService = inject(ColorService)
  dataService = inject(DataService)

  // Track previous date to compare with the current date
  private previousDate: Date = new Date();


  cellClass = (date: Date): string => {
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const baseClass = this.highlightedMonths.includes(yearMonth) ? 'highlighted' : '';
    
    // Add 'dark-mode' class conditionally based on dark mode signal
    const darkModeClass = this.colorService.isDarkMode() ? 'dark-mode' : '';
  
    return `${baseClass} ${darkModeClass}`.trim(); // Combine both classes
  };


  @ViewChild(MatMenuTrigger) calendarMenuTrigger!: MatMenuTrigger; // Inject MatMenuTrigger


  selectedDate = signal(new Date());
  calendarVisible = signal(false);
  customHeaderComponent = MonthPickerHeaderComponent

  ngOnInit(): void {
    /** Retrieve the selected data state from service */
    this.selectedDate.set(this.dataService.selectedActiveDate);
    // Set the previous date to the selected date (current date) initially to avoid null values.
    this.previousDate = this.selectedDate();
    this.monthSelected.emit({
      previousMonth: this.previousDate,
      currentMonth: this.selectedDate()
    });

    this.dataService.getSingleMonthData().pipe(takeUntil(this.componentDestroyed$)).subscribe(singleMonth => {


      /** Convert 'singleMonth.month' (a string with YYYY-MM format) to a date object.
       * Then notify the component about selected date.
       * 
       * Each time data changes, mean somewhere in the app a new month is selected.
       */
      if (singleMonth && singleMonth.month) {
        const date = formatYYYMMtoDate(singleMonth.month);
  
        this.selectedDate.set(date);
      }
    })
  }

  previousMonth() {
    const currentDate = this.selectedDate();
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    this.notifyMonthChanges(newDate);
  }

  nextMonth() {
    const currentDate = this.selectedDate();
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    this.notifyMonthChanges(newDate);
  }

  /** Toggle calendar visibility.
   * The open/close state of calendar should be synced with open/close state of menu.
   * Because it makes no sense when calendar is closed by menu is still open.
   */
  toggleCalendar() {
    this.calendarVisible.set(!this.calendarVisible());
    this.calendarVisible() ? this.calendarMenuTrigger.openMenu() : this.calendarMenuTrigger.closeMenu();
  }

  // Handle month selection on calendar view
  onMonthSelected(selectedMonth: Date) {
    // Create a new Date instance to ensure immutability
    const newDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    this.notifyMonthChanges(newDate);

    // Hide calendar & close menu after selection
    this.calendarVisible.set(false);
    this.calendarMenuTrigger.closeMenu();
  }

  // Notify month changes to parent component
  notifyMonthChanges(date: Date) {
    /** Reset data cycle flag for new month */
    this.dataService.hasDataCycle.set(false)
    // Emit both the previous and current month
    this.monthSelected.emit({
      previousMonth: this.previousDate,
      currentMonth: date
    });
    
    // Update selected and previous dates
    this.previousDate = this.selectedDate();
    this.selectedDate.set(date);
    this.dataService.selectedActiveDate = date;
  }

  // Handle year selection (optional)
  yearSelected(selectedYear: Date) {
    const currentDate = this.selectedDate();
    const newDate = new Date(selectedYear.getFullYear(), currentDate.getMonth(), 1);
    this.selectedDate.set(newDate);
  }
}
