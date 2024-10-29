import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';



import { takeUntil } from 'rxjs';
import { InputListComponent } from '../../input-list/input-list.component';
import { DataService, MonthlyData, SingleMonthData } from '../../../services/data.service';
import { BasePageComponent } from '../../../base-components/base-page/base-page.component';
import {formatYearMonthToLongDate } from '../../../utils/utils';
import { MonthPickerComponent } from "../../month-picker/month-picker.component";


@Component({
  selector: 'app-input-list-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule,
    InputListComponent, MonthPickerComponent],
  templateUrl: './input-list-dialog.component.html',
  styleUrl: './input-list-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InputListDialogComponent extends BasePageComponent implements OnInit {
  dataService = inject(DataService)
  monthString: string = ''
  singleMonthData: SingleMonthData
  allMonthsData: MonthlyData

  currentMonth: string = ''

  ngOnInit(): void {
    this.dataService.getSingleMonthData().pipe(takeUntil(this.componentDestroyed$)).subscribe(data => {
      if (data) {
        this.singleMonthData = data
        this.monthString = formatYearMonthToLongDate(data.month)
      }
    })

    // this.dataService.getAllMonthsData().pipe(takeUntil(this.componentDestroyed$)).subscribe(allMonthsData => {
    //   this.allMonthsData = allMonthsData
    // })
  }

  // onMonthChanges(selectedMonth: Date) {
  //   this.currentMonth = formatDateToYYYYMM(selectedMonth)
  //   onMonthChanges(selectedMonth, this.allMonthsData, this.singleMonthData, this.dataService)
  // }
}
