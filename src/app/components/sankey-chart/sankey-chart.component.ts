import { Component, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { EChartsOption } from 'echarts';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { DataService, ProcessedOutputData } from '../data.service';
import { SankeyData } from '../models';
import { ColorService } from '../../services/color.service';


@Component({
  selector: 'app-sankey-chart',
  standalone: true,
  imports: [NgxEchartsDirective],
  providers: [
    provideEcharts(),
  ],
  templateUrl: './sankey-chart.component.html',
  styleUrl: './sankey-chart.component.scss'
})
export class SankeyChartComponent implements OnChanges {

  @Input() sankeyData: SankeyData
  @Input() remainingBalance: string = '-'

  dataService = inject(DataService)
  colorService = inject(ColorService)

  sankeyOption: EChartsOption = {}
  mergeOption: EChartsOption = {}

  constructor() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['sankeyData']) {
      this.updateSankeyChart()
    }
  }


  updateSankeyChart() {
    this.sankeyOption = {
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        backgroundColor: this.colorService.isDarkMode? this.colorService.darkBackgroundSecondary : this.colorService.lightBackgroundPrimary,
        textStyle: {
          color: this.colorService.isDarkMode? this.colorService.darkTextPrimary : this.colorService.lightTextPrimary,
        },
        
      },
      toolbox: {
        right: 20,
        feature: {
          saveAsImage: {
            name: `Financial Flow Sankey_${this.dataService.getTodaysDate()}`
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
            color: this.colorService.isDarkMode? this.colorService.darkTextPrimary : this.colorService.lightTextPrimary,
            formatter: (params: any) => {
              return `${params.name}\n${params.value.toLocaleString()}`; // Show value in label
            }
           },
          nodeGap: 15,
          lineStyle: { color: 'gradient', curveness: 0.5 }
        }
      ]
    }
  }
}
