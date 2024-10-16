import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, EventEmitter, inject, Input, OnInit, Output, signal, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {MatNativeDateModule, provideNativeDateAdapter} from '@angular/material/core';
import {MatDatepickerModule} from '@angular/material/datepicker';

import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import { MatMomentDateModule, provideMomentDateAdapter } from '@angular/material-moment-adapter';
import * as _moment from 'moment';
import { default as _rollupMoment, Moment } from 'moment';
import { MonthPickerHeaderComponent } from '../month-picker-header/month-picker-header.component';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { ColorService } from '../../services/color.service';


const moment = _rollupMoment || _moment;

export const MY_FORMATS = {
  parse: {
    dateInput: 'MM/YYYY',
  },
  display: {
    dateInput: 'MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-month-picker',
  standalone: true,
  providers: [
    provideMomentDateAdapter(MY_FORMATS),
    provideNativeDateAdapter()
  ],
  imports: [MatFormFieldModule, MatInputModule, MatDatepickerModule, MatIconModule,
    CommonModule, MatButtonModule,
    MatDatepickerModule, MatNativeDateModule, MatMomentDateModule,
    MonthPickerHeaderComponent, MatMenuModule
  ],
  templateUrl: './month-picker.component.html',
  styleUrl: './month-picker.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonthPickerComponent implements OnInit {
  @Input() highlightedMonths: string[] = [];
  @Output() monthSelected = new EventEmitter<Date>()
  colorService = inject(ColorService)



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
    this.emitSelectedDate()
  }

  emitSelectedDate() {
    this.monthSelected.emit(this.selectedDate());
  }

  previousMonth() {
    const currentDate = this.selectedDate();
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    this.selectedDate.set(newDate);
    this.monthSelected.emit(newDate);
  }

  // Navigate to the next month
  nextMonth() {
    const currentDate = this.selectedDate();
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    this.selectedDate.set(newDate);
    this.monthSelected.emit(newDate);
  }

  // Toggle calendar visibility
  toggleCalendar() {
    this.calendarVisible.set(!this.calendarVisible());
    this.calendarVisible() ? this.calendarMenuTrigger.openMenu() : this.calendarMenuTrigger.closeMenu();
  }

  // Handle month selection
  onMonthSelected(selectedMonth: Date) {
    // Create a new Date instance to ensure immutability
    const newDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    this.selectedDate.set(newDate);
    this.calendarVisible.set(false); // Hide calendar after selection
    this.calendarMenuTrigger.closeMenu();
    this.monthSelected.emit(newDate);
  }

  // Handle year selection (optional)
  yearSelected(selectedYear: Date) {
    const currentDate = this.selectedDate();
    const newDate = new Date(selectedYear.getFullYear(), currentDate.getMonth(), 1);
    this.selectedDate.set(newDate);
  }
}
