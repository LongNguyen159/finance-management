import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';



import { takeUntil } from 'rxjs';
import { InputListComponent } from '../../input-list/input-list.component';
import { DataService, MonthlyData, ProcessedOutputData } from '../../../services/data.service';
import { BasePageComponent } from '../../../base-components/base-page/base-page.component';
import { formatYearMonthToLongDate, onMonthChanges } from '../../../utils/utils';
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
  singleMonthData: ProcessedOutputData
  allMonthsData: MonthlyData

  ngOnInit(): void {
    this.dataService.getProcessedData().pipe(takeUntil(this.componentDestroyed$)).subscribe(data => {
      this.singleMonthData = data
      this.monthString = formatYearMonthToLongDate(data.month)
    })

    this.dataService.getAllMonthsData().pipe(takeUntil(this.componentDestroyed$)).subscribe(allMonthsData => {
      this.allMonthsData = allMonthsData
    })
  }

  onMonthChanges(selectedMonth: Date) {
    onMonthChanges(selectedMonth, this.allMonthsData, this.singleMonthData, this.dataService)
  }
}
