import { Component, inject, OnInit } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { SankeyChartComponent } from '../../components/sankey-chart/sankey-chart.component';
import { PieChartComponent } from '../../components/pie-chart/pie-chart.component';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { InputListComponent } from '../../components/input-list/input-list.component';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DidYouKnowDialogComponent } from '../../components/did-you-know-dialog/did-you-know-dialog.component';
import { MatDividerModule } from '@angular/material/divider';
import { UserManualComponent } from '../../components/user-manual/user-manual.component';
import { DataService, MonthlyData, ProcessedOutputData } from '../../services/data.service';
import { takeUntil } from 'rxjs';
import { BasePageComponent } from '../../base-components/base-page/base-page.component';
import { NavbarComponent } from "../../components/navbar/navbar.component";
import { ColorService } from '../../services/color.service';
import { MonthPickerComponent } from "../../components/month-picker/month-picker.component";
import { formatDateToString } from '../../utils/utils';
@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [SankeyChartComponent, PieChartComponent, NgxEchartsDirective, InputListComponent,
    MatButtonModule, CommonModule, MatIconModule, MatMenuModule, DidYouKnowDialogComponent, MatDividerModule,
    UserManualComponent, NavbarComponent, MonthPickerComponent],
  providers: [
    provideEcharts(),
  ],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.scss'
})
export class MainPageComponent extends BasePageComponent implements OnInit{
  isVerticalLayout = true;

  dataService = inject(DataService)
  colorService = inject(ColorService)

  processedOutputData: ProcessedOutputData
  monthlyData: MonthlyData = {};
  highlightMonths: string[] = []


  totalExpenses: number = -1
  totalGrossIncome: number = -1
  totalNetIncome: number = -1
  showGrossIncomePieChart: boolean = false /** Only shown when tax is given and > 0 */

  pieChartDataBrutto: any[] = []
  pieChartDataNetto: any[] = []

  isDarkmode: boolean = false
  
  constructor() {
    super();
  }
  ngOnInit(): void {
    this.dataService.getAllMonthsData().pipe(takeUntil(this.componentDestroyed$)).subscribe(data => {
      this.monthlyData = data
      this.highlightMonths = Object.keys(data)
      
      console.log('all months data', data)
    })

    this.dataService.getProcessedData().pipe(takeUntil(this.componentDestroyed$)).subscribe(data => {
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


  onMonthChanges(selectedMonth: Date) {    
    if (Object.keys(this.monthlyData).length == 0) {
      console.warn('month data is not ready by the time on month changes is called')
      return
    }

    const monthString = formatDateToString(selectedMonth);
    
    // Check if the month exists in the MonthlyData
    if (this.monthlyData[monthString]) {
      // Month exists, retrieve the processed data
      const existingData = this.monthlyData[monthString];
      this.processedOutputData = existingData; // Update processed output data
      console.log(`month ${monthString} exists, calling service to process input`)
      this.dataService.processInputData(existingData.rawInput, monthString);
      
    } else {
      // Month does not exist, create a new empty entry
      this.processedOutputData = this.initializeEmptyData(monthString); // Initialize empty data
      this.monthlyData[monthString] = this.processedOutputData; // Add to the monthlyData
      console.log(`No data for ${monthString}. Initialized new entry.`);
      this.dataService.processInputData([], monthString);
    }
  }

  // Initialize empty data for a month
  private initializeEmptyData(monthString: string): ProcessedOutputData {
    return {
      sankeyData: { nodes: [], links: [] }, // Adjust based on your SankeyData structure
      totalUsableIncome: 0,
      totalGrossIncome: 0,
      totalTax: 0,
      totalExpenses: 0,
      remainingBalance: '0',
      pieData: {},
      rawInput: [],
      month: monthString
    };
  }

  toggleLayout() {
    this.isVerticalLayout = !this.isVerticalLayout;
  }
}
