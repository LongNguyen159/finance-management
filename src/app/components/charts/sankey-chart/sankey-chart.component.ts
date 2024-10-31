import { Component, effect, inject, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { EChartsOption } from 'echarts';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { SankeyData } from '../../models';
import { DataService } from '../../../services/data.service';
import { ColorService } from '../../../services/color.service';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { removeSystemPrefix } from '../../../utils/utils';


@Component({
  selector: 'app-sankey-chart',
  standalone: true,
  imports: [NgxEchartsDirective, CommonModule, MatChipsModule],
  providers: [
    provideEcharts(),
  ],
  templateUrl: './sankey-chart.component.html',
  styleUrl: './sankey-chart.component.scss'
})
export class SankeyChartComponent implements OnChanges {

  @Input() sankeyData: SankeyData
  @Input() remainingBalance: string = '-'

  @Input() chartHeight: string = '70vh'

  dataService = inject(DataService)
  colorService = inject(ColorService)

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
  }


  updateSankeyChart() {
    const isDarkMode = this.colorService.isDarkMode(); // Call the signal

    this.sankeyOption = {
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
            return `${nodeName}: <strong>${params.data.value.toLocaleString()}</strong>`;
          } else {
            const source = params.data.source ? removeSystemPrefix(params.data.source) : '';
            const target = params.data.target ? removeSystemPrefix(params.data.target) : '';
            return `${source} → ${target}: <strong>${params.data.value.toLocaleString()}</strong>`;
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
          label: {
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
                `{normal|${params.value.toLocaleString()}}`, // Normal value
              ].join('\n'); // Join with a newline
            }
          },
          nodeGap: 28,
          lineStyle: { color: 'gradient', curveness: 0.5 }
        }
      ]
    }
  }
}
