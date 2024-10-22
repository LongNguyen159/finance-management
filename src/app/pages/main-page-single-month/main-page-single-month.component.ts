import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { SankeyChartComponent } from "../../components/charts/sankey-chart/sankey-chart.component";
import { PieChartComponent } from "../../components/charts/pie-chart/pie-chart.component";
import { ColorService } from '../../services/color.service';
import { MatDividerModule } from '@angular/material/divider';
import { SingleMonthData } from '../../services/data.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-page-single-month',
  standalone: true,
  imports: [SankeyChartComponent, PieChartComponent,
    MatDividerModule, CommonModule
  ],
  templateUrl: './main-page-single-month.component.html',
  styleUrl: './main-page-single-month.component.scss'
})
export class MainPageSingleMonthComponent implements OnChanges {
  @Input() chartData: SingleMonthData

  colorService = inject(ColorService)


  totalExpenses: number = -1
  totalGrossIncome: number = -1
  totalNetIncome: number = -1
  showGrossIncomePieChart: boolean = false /** Only shown when tax is given and > 0 */

  pieChartDataBrutto: any[] = []
  pieChartDataNetto: any[] = []



  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['chartData']) {
      this.populateChartData()
    }
  }


  populateChartData() {
    this.pieChartDataNetto = this.chartData.pieData
    this.totalExpenses = this.chartData.totalExpenses
    this.totalGrossIncome = this.chartData.totalGrossIncome
    this.totalNetIncome = this.chartData.totalUsableIncome
  
  
    if (this.chartData.totalTax == 0) {
      this.showGrossIncomePieChart = false

      this.pieChartDataBrutto = this.pieChartDataNetto
    } else {
      this.showGrossIncomePieChart = true

      this.pieChartDataBrutto = [
        ...this.pieChartDataNetto,
        {name: 'Taxes', value: this.chartData.totalTax}
      ]
      this.totalGrossIncome = this.chartData.totalGrossIncome
    }
  }
}
