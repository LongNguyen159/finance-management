import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { SankeyChartComponent } from "../../components/charts/sankey-chart/sankey-chart.component";
import { PieChartComponent } from "../../components/charts/pie-chart/pie-chart.component";
import { ColorService } from '../../services/color.service';
import { MatDividerModule } from '@angular/material/divider';
import { PieData, SingleMonthData, TreeNode } from '../../components/models';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TreemapChartComponent } from '../../components/charts/treemap-chart/treemap-chart.component';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-main-page-single-month',
  standalone: true,
  imports: [SankeyChartComponent, PieChartComponent,
    MatDividerModule, CommonModule,
    MatIconModule,
    TreemapChartComponent,
    MatButtonModule
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

  pieChartDataBrutto: PieData[] = []
  pieChartDataNetto: PieData[] = []
  viewTreeMap: boolean = false

  treeMapData: TreeNode[] = []


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
    this.treeMapData = this.chartData.treeMapData
  
  
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
