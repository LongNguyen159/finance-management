import { Component, effect, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { EChartsOption } from 'echarts';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { SankeyData } from '../../models';
import { DataService } from '../../../services/data.service';
import { ColorService } from '../../../services/color.service';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { parseLocaleStringToNumber, removeSystemPrefix } from '../../../utils/utils';
import { MatButtonModule } from '@angular/material/button';
import { DialogsService } from '../../../services/dialogs.service';
import { CurrencyService } from '../../../services/currency.service';


@Component({
  selector: 'app-sankey-chart',
  standalone: true,
  imports: [NgxEchartsDirective, CommonModule, MatChipsModule, MatButtonModule],
  providers: [
    provideEcharts(),
    CurrencyPipe
  ],
  templateUrl: './sankey-chart.component.html',
  styleUrl: './sankey-chart.component.scss'
})
export class SankeyChartComponent implements OnChanges {

  /** Chart data input */
  @Input() sankeyData: SankeyData
  @Input() remainingBalance: string = '-'

  /** Chart Configs input */
  @Input() chartHeight: string = '75vh'
  @Input() orientation: 'horizontal' | 'vertical' = 'horizontal'


  dataService = inject(DataService)
  colorService = inject(ColorService)
  dialogService = inject(DialogsService)
  currencyPipe = inject(CurrencyPipe)
  currencyService = inject(CurrencyService)

  sankeyOption: EChartsOption = this.getBaseChartOptions()
  sankeyMerge: EChartsOption = {}

  isDarkMode = this.colorService.isDarkMode(); // Call the signal

  constructor() {
    effect(() => {
      this.updateSankeyChart();
    });
  }


  getBaseChartOptions(): EChartsOption {
    return {
      animation: true,
      tooltip: {
        trigger: 'item',
        position: 'top',
        triggerOn: 'mousemove',
        backgroundColor: this.isDarkMode ? this.colorService.darkBackgroundSecondary : this.colorService.lightBackgroundPrimary,
        textStyle: {
          color: this.isDarkMode ? this.colorService.darkTextPrimary : this.colorService.lightTextPrimary,
        },
        formatter: (params: any) => {
          if (params.dataType === 'node') {
            const nodeName = removeSystemPrefix(params.data.name);
            return `${nodeName}: <strong>${this.currencyPipe.transform(params.data.value, this.currencyService.getSelectedCurrency())}</strong>`;
          } else {
            const source = params.data.source ? removeSystemPrefix(params.data.source) : '';
            const target = params.data.target ? removeSystemPrefix(params.data.target) : '';
            return `${source} → ${target}: <strong>${this.currencyPipe.transform(params.data.value, this.currencyService.getSelectedCurrency())}</strong>`;
          }
        }
      },
      toolbox: {
        right: 20,
        feature: {
          saveAsImage: {
            name: `Financial Flow Sankey_${this.dataService.getTodaysDate()}`,
            backgroundColor: this.isDarkMode ? this.colorService.darkBackgroundPrimary : this.colorService.lightBackgroundPrimary,
          },
        },
      },
      series: [
      ]
    }
  }


  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['sankeyData']) {
      this.updateSankeyChart()
    }

    if (changes && changes['orientation']) {
      this.updateSankeyChart()
    }
  }

  updateSankeyChart() {
    const isDarkMode = this.colorService.isDarkMode(); // Call the signal

    this.sankeyMerge = {
      ...this.getBaseChartOptions(),
      series: [
        {
          nodeAlign: 'left',
          type: 'sankey',
          data: this.sankeyData.nodes,
          links: this.sankeyData.links,
          emphasis: { focus: 'adjacency' },
          orient: this.orientation,
          label: {
            show: false,
            position: this.orientation === 'horizontal' ? 'right' : 'top',
            fontSize: 12,
            color: isDarkMode ? this.colorService.darkTextPrimary : this.colorService.lightTextPrimary,
            // Use rich text for formatting
            rich: {
              bold: {
                fontWeight: 'bold',
                fontSize: 12,
                color: isDarkMode ? this.colorService.darkTextPrimary : this.colorService.lightTextPrimary,
              },
              normal: {
                fontSize: 12,
                color: isDarkMode ? this.colorService.darkTextPrimary : this.colorService.lightTextPrimary,
              }
            },
            formatter: (params: any) => {
              const nodeName = removeSystemPrefix(params.name); // Remove system prefix
              return [
                `{bold|${nodeName}}`, // Bold name
                `{normal|${params.value.toLocaleString('en-US')}}`, // Normal value
              ].join('\n'); // Join with a newline
            }
          },
          labelLayout: {
            hideOverlap: true,
          },
          nodeGap: 28,
          lineStyle: { color: 'gradient', curveness: 0.5 }
        }
      ]
    }
  }


  //#region Helper Functions
  isPositiveBalance(): boolean {
    const balanceNumber = parseLocaleStringToNumber(this.remainingBalance);
    return balanceNumber >= 0;
  }

  parseLocaleStringToNumber(value: string): number {
    return parseLocaleStringToNumber(value);
  }

  getBalanceClass(): string {
    return this.isPositiveBalance() ? 'positive-balance' : 'negative-balance';
  }
  //#endregion
}
