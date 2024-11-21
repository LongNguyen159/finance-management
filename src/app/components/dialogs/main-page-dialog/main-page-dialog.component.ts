import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MainPageSingleMonthComponent } from "../../../pages/main-page-single-month/main-page-single-month.component";
import { SingleMonthData } from '../../models';

@Component({
  selector: 'app-main-page-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MainPageSingleMonthComponent],
  templateUrl: './main-page-dialog.component.html',
  styleUrl: './main-page-dialog.component.scss'
})
export class MainPageDialogComponent{
  constructor(
    public dialogRef: MatDialogRef<MainPageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: SingleMonthData
  ) {}
}
