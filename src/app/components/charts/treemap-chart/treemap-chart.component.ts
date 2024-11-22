import { Component, effect, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { EChartsOption } from 'echarts';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { TreeNode } from '../../models';
import { ColorService } from '../../../services/color.service';
import { removeSystemPrefix } from '../../../utils/utils';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-treemap-chart',
  standalone: true,
  imports: [NgxEchartsDirective,
    MatButtonModule
  ],
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

  currentChartType: 'treemap' | 'sunburst' = 'treemap';


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


  private getTreemapSeries(hideUpperLabels: boolean = false): EChartsOption['series'] {
    return {
      type: 'treemap',
      id: 'treemap-sunburst-transition',
      animationDurationUpdate: 600,
      universalTransition: true,
      label: {
        show: true,
        formatter: '{b}', // Show the name of each node
      },
      upperLabel: {
        show: !hideUpperLabels, // Hide or show the labels based on the argument
        formatter: (params: any) => removeSystemPrefix(params.name),
        color: this.colorService.isDarkMode()
          ? this.colorService.darkTextPrimary
          : this.colorService.lightTextPrimary,
      },
      itemStyle: {
        borderColor: this.colorService.isDarkMode() ? '#404040' : '#e5e5e5',
      },
      data: this.treeData,
      breadcrumb: {
        show: false,
      },
    };
  }

  private getSunburstSeries(): EChartsOption['series'] {
    return {
      type: 'sunburst',
      id: 'treemap-sunburst-transition',
      radius: ['20%', '90%'],
      animationDurationUpdate: 600,
      universalTransition: true,
      itemStyle: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,.5)',
      },
      label: {
        show: false,
      },
      data: this.treeData,
    };
  }

  updateChart(series: EChartsOption['series'] = this.getTreemapSeries()) {
    this.mergeOptions = {
      ...this.getBaseOptions(),
      series: series
    }
  }

  toggleChartType() {
    // Determine the next chart type
    const isSwitchingToTreemap = this.currentChartType === 'sunburst';
    const newChartType = isSwitchingToTreemap ? 'treemap' : 'sunburst';
  
    // Handle the transition based on the chart type
    if (isSwitchingToTreemap) {
      // Hide upper labels, then delay the transition to treemap
      this.updateChart(this.getTreemapSeries(true));
  
      setTimeout(() => {
        this.currentChartType = newChartType;
        this.updateChart(this.getTreemapSeries(false));
      }, 370); // Adjust delay as needed
    } else {
      // Immediate transition to sunburst
      this.currentChartType = newChartType;
      this.updateChart(this.getSunburstSeries());
    }
  }
}
