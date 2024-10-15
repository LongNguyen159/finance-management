import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { InputListComponent } from '../input-list/input-list.component';
import { DataService } from '../../services/data.service';
import { BasePageComponent } from '../../base-components/base-page/base-page.component';
import { takeUntil } from 'rxjs';
import { formatYearMonthToLongDate } from '../../utils/utils';

@Component({
  selector: 'app-input-list-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule,
    InputListComponent
  ],
  templateUrl: './input-list-dialog.component.html',
  styleUrl: './input-list-dialog.component.scss'
})
export class InputListDialogComponent extends BasePageComponent implements OnInit {
  dataService = inject(DataService)
  monthString: string = ''

  ngOnInit(): void {
    this.dataService.getProcessedData().pipe(takeUntil(this.componentDestroyed$)).subscribe(data => {
      this.monthString = formatYearMonthToLongDate(data.month)
    })
  }
}
