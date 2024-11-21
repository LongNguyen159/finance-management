import { Component, effect, inject, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { EChartsOption } from 'echarts';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { DataService } from '../../../services/data.service';
import { ColorService } from '../../../services/color.service';
import { removeSystemPrefix } from '../../../utils/utils';
import { CurrencyService } from '../../../services/currency.service';
@Component({
  selector: 'app-pie-chart',
  standalone: true,
  imports: [NgxEchartsDirective, CommonModule],
  providers: [
    provideEcharts(),
    CurrencyPipe
  ],
  templateUrl: './pie-chart.component.html',
  styleUrl: './pie-chart.component.scss'
})
export class PieChartComponent implements OnChanges {
  dataService = inject(DataService)
  colorService = inject(ColorService)
  currencyPipe = inject(CurrencyPipe)
  currencyService = inject(CurrencyService)

  @Input() pieChartData: any[] = []
  @Input() chartTitle: string = ''
  @Input() chartDescription: string = ''

  @Input() totalExpenses: number = -1
  @Input() totalIncome: number = -1

  @Input() chartHeight: string = '70vh'

  pieOption: EChartsOption = this.getBaseChartOptions()
  pieMergeOption: EChartsOption = {}

  constructor() {
    effect(() => {
      this.updateChart();
    });
  }

  getBaseChartOptions(): EChartsOption {
    return {
      color: this.colorService.isDarkMode() ? this.colorService.chartColorPaletteDark : this.colorService.chartColorPaletteLight,
      tooltip: {
        trigger: 'item',
        backgroundColor: this.colorService.isDarkMode() ? this.colorService.darkBackgroundSecondary : this.colorService.lightBackgroundPrimary,
        textStyle: {
          color: this.colorService.isDarkMode() ? this.colorService.darkTextPrimary : this.colorService.lightTextPrimary,
        },
        formatter: (params: any) => {
          // Use toLocaleString to format the value
          const value = this.currencyPipe.transform(params.data.value, this.currencyService.getSelectedCurrency()); // Format the value
          return `${removeSystemPrefix(params.name)}: <b>${value} (${params.percent}%)</b>`; // Bold the params.name
        }
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        textStyle: {
          color: this.colorService.isDarkMode() ? this.colorService.darkTextPrimary : this.colorService.lightTextPrimary,
        },
        formatter: (name: string) => {
          return removeSystemPrefix(name);
        }
      },
      toolbox: {
        right: 20,
        feature: {
          saveAsImage: {
            name: `${this.chartTitle}_${this.dataService.getTodaysDate()}`,
            backgroundColor: this.colorService.isDarkMode() ? this.colorService.darkBackgroundPrimary : this.colorService.lightBackgroundPrimary,
          },
        },
      },
      series: []
    }
  }


  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['pieChartData']) {
      this.updateChart()
    }
  }

  updateChart() {
    this.pieMergeOption = {
      ...this.getBaseChartOptions(),
      series: [
        {
          type: 'pie',
          radius: '50%',
          data: this.pieChartData,
          emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
          label: {
            formatter: (params: any) =>  {
              return `${removeSystemPrefix(params.name)}: ${params.value.toLocaleString('en-US')} (${params.percent.toLocaleString('en-US')}%)`;
            },
            fontSize: 12,
            color: this.colorService.isDarkMode() ? this.colorService.darkTextPrimary : this.colorService.lightTextPrimary
          },
          padAngle: 0.5,
          avoidLabelOverlap: true,
          itemStyle: {
            borderWidth: 0, // Adjust thickness for the gap
            borderColor: this.colorService.isDarkMode() ? this.colorService.darkBackgroundPrimary : this.colorService.lightBackgroundPrimary, // Use a contrasting color for the gap
            borderRadius: 6,
            borderJoin: "round"
          }
        }
      ]
    }
  }
}
