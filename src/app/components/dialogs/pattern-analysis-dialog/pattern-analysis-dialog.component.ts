import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { AbnormalityChartData } from '../../models';
import { CategoryRegressionChartComponent } from "../../charts/category-regression-chart/category-regression-chart.component";

@Component({
  selector: 'app-pattern-analysis-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, CommonModule, CategoryRegressionChartComponent],
  templateUrl: './pattern-analysis-dialog.component.html',
  styleUrl: './pattern-analysis-dialog.component.scss'
})
export class PatternAnalysisDialogComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AbnormalityChartData
  ) {}
}
