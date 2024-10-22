import { ChangeDetectionStrategy, Component, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { InputListComponent } from '../../components/input-list/input-list.component';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {MatChipsModule} from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { UserManualComponent } from '../../components/user-manual/user-manual.component';
import { DataService, MonthlyData, ProcessedOutputData } from '../../services/data.service';
import { takeUntil } from 'rxjs';
import { BasePageComponent } from '../../base-components/base-page/base-page.component';
import { NavbarComponent } from "../../components/navbar/navbar.component";
import { ColorService } from '../../services/color.service';
import { MonthPickerComponent } from "../../components/month-picker/month-picker.component";
import { formatDateToString, onMonthChanges } from '../../utils/utils';
import { DidYouKnowDialogComponent } from '../../components/dialogs/did-you-know-dialog/did-you-know-dialog.component';
import { PieChartComponent } from '../../components/charts/pie-chart/pie-chart.component';
import { SankeyChartComponent } from '../../components/charts/sankey-chart/sankey-chart.component';
import { DialogsService } from '../../services/dialogs.service';
@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [SankeyChartComponent, PieChartComponent, NgxEchartsDirective, InputListComponent,
    MatButtonModule, CommonModule, MatIconModule, MatMenuModule, DidYouKnowDialogComponent, MatDividerModule,
    UserManualComponent, NavbarComponent, MonthPickerComponent,
    MatChipsModule],
  providers: [
    provideEcharts(),
  ],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.scss',
  changeDetection: ChangeDetectionStrategy.Default
})
export class MainPageComponent extends BasePageComponent implements OnInit, OnChanges {
  @Input() hasMonthPicker: boolean = true;
  @Input() hasNavbar: boolean = false;
  @Input() selectedMonth: Date = new Date();

  isVerticalLayout = true;

  dataService = inject(DataService)
  colorService = inject(ColorService)
  dialogService = inject(DialogsService)
  entriesOfOneMonth: ProcessedOutputData
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
      const filteredMonthlyData = Object.keys(data).reduce((result, month) => {
        const dataEntry = data[month];
        // Check if the data contains meaningful entries
        if (dataEntry.rawInput.length > 0 || dataEntry.totalGrossIncome > 0 || dataEntry.totalExpenses > 0) {
            result[month] = dataEntry; // Keep non-empty months
        }
          return result;
      }, {} as MonthlyData);
      
      this.monthlyData = filteredMonthlyData;
      this.highlightMonths = Object.keys(filteredMonthlyData); // Get keys of filtered data
    })

    this.dataService.getSingleMonthData().pipe(takeUntil(this.componentDestroyed$)).subscribe((data: ProcessedOutputData) => {
      if (data && Object.keys(data).length > 0) {
        this.entriesOfOneMonth = data
        this.pieChartDataNetto = data.pieData
        this.totalExpenses = data.totalExpenses
        this.totalGrossIncome = data.totalGrossIncome
        this.totalNetIncome = data.totalUsableIncome
  
  
        if (this.entriesOfOneMonth.totalTax == 0) {
          this.showGrossIncomePieChart = false
  
          this.pieChartDataBrutto = this.pieChartDataNetto
        } else {
          this.showGrossIncomePieChart = true
  
          this.pieChartDataBrutto = [
            ...this.pieChartDataNetto,
            {name: 'Taxes', value: this.entriesOfOneMonth.totalTax}
          ]
          this.totalGrossIncome = this.entriesOfOneMonth.totalGrossIncome
        }
      }
    })
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['selectedMonth']) {
      // this.onMonthChanges(this.selectedMonth)
    }
  }


  onMonthChanges(selectedMonth: Date) {    
    onMonthChanges(selectedMonth, this.monthlyData, this.entriesOfOneMonth, this.dataService)
  }

  toggleLayout() {
    this.isVerticalLayout = !this.isVerticalLayout;
  }
}
