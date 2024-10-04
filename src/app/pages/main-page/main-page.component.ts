import { Component, inject, OnInit } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { SankeyChartComponent } from '../../components/sankey-chart/sankey-chart.component';
import { PieChartComponent } from '../../components/pie-chart/pie-chart.component';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { InputListComponent } from '../../components/input-list/input-list.component';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { InputDialogComponent } from '../../components/input-dialog/input-dialog.component';
import { MatDividerModule } from '@angular/material/divider';
import { UserManualComponent } from '../../components/user-manual/user-manual.component';
import { DataService, ProcessedOutputData } from '../../components/data.service';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [SankeyChartComponent, PieChartComponent, NgxEchartsDirective, InputListComponent,
    MatButtonModule, CommonModule, MatIconModule, MatMenuModule, InputDialogComponent, MatDividerModule,
    UserManualComponent],
  providers: [
    provideEcharts(),
  ],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.scss'
})
export class MainPageComponent implements OnInit{
  isVerticalLayout = true;

  dataService = inject(DataService)

  processedOutputData: ProcessedOutputData
  totalExpenses: number = -1
  totalGrossIncome: number = -1
  totalNetIncome: number = -1
  showGrossIncomePieChart: boolean = false /** Only shown when tax is given and > 0 */

  pieChartDataBrutto: any[] = []
  pieChartDataNetto: any[] = []

  ngOnInit(): void {
    this.dataService.getProcessedData().subscribe(data => {

      this.processedOutputData = data
      this.pieChartDataNetto = data.pieData
      this.totalExpenses = data.totalExpenses
      this.totalGrossIncome = data.totalGrossIncome
      this.totalNetIncome = data.totalUsableIncome


      if (this.processedOutputData.totalTax == 0) {
        this.showGrossIncomePieChart = false

        this.pieChartDataBrutto = this.pieChartDataNetto
      } else {
        this.showGrossIncomePieChart = true

        this.pieChartDataBrutto = [
          ...this.pieChartDataNetto,
          {name: 'Taxes', value: this.processedOutputData.totalTax}
        ]
        this.totalGrossIncome = this.processedOutputData.totalGrossIncome
      }
    })
  }


  toggleLayout() {
    this.isVerticalLayout = !this.isVerticalLayout;
  }
}
