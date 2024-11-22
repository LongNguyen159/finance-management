import { Component, effect, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { EChartsOption } from 'echarts';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { TreeNode } from '../../models';
import { ColorService } from '../../../services/color.service';
import { removeSystemPrefix } from '../../../utils/utils';

@Component({
  selector: 'app-treemap-chart',
  standalone: true,
  imports: [NgxEchartsDirective],
  providers: [
    provideEcharts(),
  ],
  templateUrl: './treemap-chart.component.html',
  styleUrl: './treemap-chart.component.scss'
})
export class TreemapChartComponent implements OnInit, OnChanges {
  @Input() treeData: TreeNode[] = []

  colorService = inject(ColorService)

  chartOptions: EChartsOption = this.getBaseOptions()
  mergeOptions: EChartsOption

  constructor() {
    effect(() => {
      this.updateChart()
    })
  }

  ngOnInit(): void {
    this.updateChart()
  }

  getBaseOptions(): EChartsOption {
    return {
      tooltip: {
        formatter: (info: any) => {
          const value = info.value || 0;
          return `<b>${removeSystemPrefix(info.name) || 'Total Expenses'}</b>: ${value}`;
        },
      },
      series: [],
    };
  }


  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['treeData']) {
      this.updateChart()
    }
  }

  updateChart() {
    this.mergeOptions = {
      ...this.getBaseOptions(),
      series: {
        type: 'treemap',
        label: {
          show: true,
          formatter: '{b}', // Show the name of each node
        },
        upperLabel: {
          show: true,
          formatter(params) {
            return removeSystemPrefix(params.name);
          },
          color: this.colorService.isDarkMode() ? this.colorService.darkTextPrimary : this.colorService.lightTextPrimary,
        },
        itemStyle: {
          borderColor: this.colorService.isDarkMode() ? '#404040' : '#e5e5e5',
        },
        data: this.treeData,
        levels: [
          {
            itemStyle: {
              borderWidth: 0,
              gapWidth: 5
            }
          },
          {
            itemStyle: {
              gapWidth: 1
            }
          },
          {
            colorSaturation: [0.35, 0.5],
            itemStyle: {
              gapWidth: 1,
              borderColorSaturation: 0.6
            }
          }
        ],
      },
    }
  }
}
