import { Component, effect, inject, input, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { EChartsOption } from 'echarts';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { SankeyData } from '../../models';
import { DataService } from '../../../services/data.service';
import { ColorService } from '../../../services/color.service';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { parseLocaleStringToNumber, removeSystemPrefix } from '../../../utils/utils';
import { MatButtonModule } from '@angular/material/button';
import { DialogsService } from '../../../services/dialogs.service';


@Component({
  selector: 'app-sankey-chart',
  standalone: true,
  imports: [NgxEchartsDirective, CommonModule, MatChipsModule, MatButtonModule],
  providers: [
    provideEcharts(),
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

  sankeyOption: EChartsOption = {}
  mergeOption: EChartsOption = {}
  

  constructor() {
    effect(() => {
      this.updateSankeyChart();
    });
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['sankeyData']) {
      this.updateSankeyChart()
    }

    if (changes && changes['orientation']) {
      this.updateSankeyChart()
    }
  }

  isPositiveBalance(): boolean {
    const balanceNumber = parseLocaleStringToNumber(this.remainingBalance);
    return balanceNumber >= 0;
  }

  getBalanceClass(): string {
    return this.isPositiveBalance() ? 'positive-balance' : 'negative-balance';
  }


  updateSankeyChart() {
    const isDarkMode = this.colorService.isDarkMode(); // Call the signal

    this.sankeyOption = {
      animation: this.orientation === 'horizontal' ? true : false,
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        backgroundColor: isDarkMode ? this.colorService.darkBackgroundSecondary : this.colorService.lightBackgroundPrimary,
        textStyle: {
          color: isDarkMode ? this.colorService.darkTextPrimary : this.colorService.lightTextPrimary,
        },
        formatter: (params: any) => {
          if (params.dataType === 'node') {
            const nodeName = removeSystemPrefix(params.data.name);
            return `${nodeName}: <strong>${params.data.value.toLocaleString('en-US')}</strong>`;
          } else {
            const source = params.data.source ? removeSystemPrefix(params.data.source) : '';
            const target = params.data.target ? removeSystemPrefix(params.data.target) : '';
            return `${source} → ${target}: <strong>${params.data.value.toLocaleString('en-US')}</strong>`;
          }
        }
      },
      toolbox: {
        right: 20,
        feature: {
          saveAsImage: {
            name: `Financial Flow Sankey_${this.dataService.getTodaysDate()}`,
            backgroundColor: isDarkMode ? this.colorService.darkBackgroundPrimary : this.colorService.lightBackgroundPrimary,
          },
        },
      },
      series: [
        {
          nodeAlign: 'left',
          type: 'sankey',
          data: this.sankeyData.nodes,
          links: this.sankeyData.links,
          emphasis: { focus: 'adjacency' },
          orient: this.orientation,
          label: {
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
}
