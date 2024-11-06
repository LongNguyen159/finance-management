import { ChangeDetectionStrategy, Component, effect, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { InputListComponent } from '../../components/input-list/input-list.component';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {MatChipsModule} from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { UserManualComponent } from '../../components/user-manual/user-manual.component';
import { DataService, MonthlyData, SingleMonthData } from '../../services/data.service';
import { takeUntil } from 'rxjs';
import { BasePageComponent } from '../../base-components/base-page/base-page.component';
import { NavbarComponent } from "../../components/navbar/navbar.component";
import { ColorService } from '../../services/color.service';
import { MonthPickerComponent } from "../../components/month-picker/month-picker.component";
import { onMonthChanges } from '../../utils/data-utils';
import { DidYouKnowDialogComponent } from '../../components/dialogs/did-you-know-dialog/did-you-know-dialog.component';
import { PieChartComponent } from '../../components/charts/pie-chart/pie-chart.component';
import { SankeyChartComponent } from '../../components/charts/sankey-chart/sankey-chart.component';
import { DialogsService } from '../../services/dialogs.service';
import { Budget, DateChanges, ExpenseCategory, ExpenseCategoryDetails, expenseCategoryDetails, SYSTEM_PREFIX } from '../../components/models';
import { BudgetRadarChartComponent } from "../../components/charts/budget-radar-chart/budget-radar-chart.component";
import { BudgetGaugeChartComponent } from "../../components/charts/budget-gauge-chart/budget-gauge-chart.component";
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { BudgetService } from '../../services/budget.service';
@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [SankeyChartComponent, PieChartComponent, NgxEchartsDirective, InputListComponent,
    MatButtonModule, CommonModule, MatIconModule, MatMenuModule, DidYouKnowDialogComponent, MatDividerModule,
    UserManualComponent, NavbarComponent, MonthPickerComponent,
    MatChipsModule, BudgetRadarChartComponent, BudgetGaugeChartComponent,
  MatSlideToggleModule, FormsModule],
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
  budgetService = inject(BudgetService)
  entriesOfOneMonth: SingleMonthData
  monthlyData: MonthlyData = {};
  highlightMonths: string[] = []


  totalExpenses: number = -1
  totalGrossIncome: number = -1
  totalNetIncome: number = -1
  showGrossIncomePieChart: boolean = false /** Only shown when tax is given and > 0 */

  pieChartDataBrutto: {name: string, value: number}[] = []
  pieChartDataNetto: {name: string, value: number}[] = []

  isDarkmode: boolean = false

  categories: ExpenseCategoryDetails[] = Object.values(expenseCategoryDetails)

  budgets: Budget[] = [
    // { category: ExpenseCategory.Housing, value: 1200 },
    // { category: ExpenseCategory.Shopping, value: 200 },
    // { category: ExpenseCategory.Groceries, value: 180 },
    // { category: ExpenseCategory.Restaurants, value: 150 },
    // { category: ExpenseCategory.Education, value: 300 },
    // { category: ExpenseCategory.Savings, value: 400 },
    // { category: ExpenseCategory.Health, value: 40 },
    // { category: ExpenseCategory.Entertainment, value: 220 },
    // { category: ExpenseCategory.Hobby, value: 180 },
    // { category: ExpenseCategory.Commute, value: 100 },
    // { category: ExpenseCategory.Utils, value: 0 },
    // { category: ExpenseCategory.Other, value: 0 }
  ]
  
  
  spending: Budget[] = []

  indicators: ExpenseCategoryDetails[] = []
  showGaugeChart: boolean = false
  
  constructor() {
    super();
    effect(() => {
      this.budgets = this.budgetService.budget()
      console.log('budget updated', this.budgets)
    })
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

    this.dataService.getSingleMonthData().pipe(takeUntil(this.componentDestroyed$)).subscribe((data: SingleMonthData) => {
      if (data && Object.keys(data).length > 0) {
        this.showGaugeChart = false // Reset gauge chart flag
        this.entriesOfOneMonth = data
        this.pieChartDataNetto = data.pieData
        this.totalExpenses = data.totalExpenses
        this.totalGrossIncome = data.totalGrossIncome
        this.totalNetIncome = data.totalUsableIncome

        this.getBudgetData()
  
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


  getBudgetData() {
    const categoriesValues = this.pieChartDataNetto.filter(item => item.name.includes(SYSTEM_PREFIX)).map(item => ({
      category: item.name as ExpenseCategory,
      value: item.value
    }))
    this.spending = categoriesValues

    /** Find overlap between spending and budget. Only show what appears in both arrays and not null or 0. */
    this.indicators = categoriesValues
      .filter(a => a.value > 0 && this.budgets.some(b => b.category === a.category && b.value > 0))
      .map(a => {
        return expenseCategoryDetails[a.category];
      });

    this.showGaugeChart = this.indicators.length <= 2
  }



  getBudgetValue(category: string): number {
    const budget = this.budgets.find(b => b.category === category);
    return budget ? budget.value : 0;
  }

  getActualSpendingValue(category: string): number {
    const spending = this.spending.find(s => s.category === category);
    return spending ? spending.value : 0;
  }



  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['selectedMonth']) {
      // this.onMonthChanges(this.selectedMonth)
    }
  }


  onMonthChanges(selectedMonth: DateChanges) {    
    onMonthChanges(selectedMonth.currentMonth, this.monthlyData, this.entriesOfOneMonth, this.dataService)
  }

  toggleLayout() {
    this.isVerticalLayout = !this.isVerticalLayout;
  }
}
