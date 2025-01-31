import { Component, effect, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { EChartsOption } from 'echarts';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { TreeNode } from '../../models';
import { ColorService } from '../../../services/color.service';
import { removeSystemPrefix } from '../../../utils/utils';
import { MatButtonModule } from '@angular/material/button';
import { CurrencyPipe } from '@angular/common';
import { CurrencyService } from '../../../services/currency.service';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UiService } from '../../../services/ui.service';
import { BaseChartComponent } from '../../../base-components/base-chart/base-chart.component';
@Component({
  selector: 'app-treemap-chart',
  standalone: true,
  imports: [NgxEchartsDirective,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatTooltipModule
  ],
  providers: [
    provideEcharts(),
    CurrencyPipe
  ],
  templateUrl: './treemap-chart.component.html',
  styleUrl: './treemap-chart.component.scss'
})
export class TreemapChartComponent extends BaseChartComponent implements OnInit, OnChanges {
  @Input() treeData: TreeNode[] = []
  @Input() totalExpenses: number = -1
  @Input() totalNetIncome: number = -1

  @Input() actionsPosition: 'top' | 'bottom' = 'bottom'

  currencyPipe = inject(CurrencyPipe)
  uiService = inject(UiService)
  currencyService = inject(CurrencyService)

  chartOptions: EChartsOption = this.getBaseOptions()
  mergeOptions: EChartsOption

  currentChartType: 'treemap' | 'sunburst' = 'treemap';


  constructor() {
    super()
    effect(() => {
      this.updateChart(this.currentChartType === 'treemap' ? this.getTreemapSeries() : this.getSunburstSeries())
    })
  }

  ngOnInit(): void {
    this.updateChart(this.currentChartType === 'treemap' ? this.getTreemapSeries() : this.getSunburstSeries())
  }

  getBaseOptions(): EChartsOption {
    return { 
      color: this.colorService.isDarkMode() 
        ? this.colorService.chartColorPaletteDark 
        : this.colorService.chartColorPaletteLight,
      tooltip: {
        borderWidth: 2,
        borderRadius: 12,
        backgroundColor: this.colorService.isDarkMode() ? this.colorService.darkBackgroundSecondary : this.colorService.lightBackgroundPrimary,
        textStyle: {
          color: this.colorService.isDarkMode() ? this.colorService.darkTextPrimary : this.colorService.lightTextPrimary,
        },
        formatter: (info: any) => {
          const value = this.currencyPipe.transform(info.value, this.currencyService.getSelectedCurrency());
          const shareOfTotal = ((info.value / this.totalNetIncome) * 100).toFixed(2);
  
          // Get parent node details
          const parentNode = info?.treePathInfo?.[info.treePathInfo.length - 2];
          const parentName = parentNode ? removeSystemPrefix(parentNode.name) : '';
          const parentValue = parentNode?.value || null;
          const shareOfParent = parentValue 
            ? ((info.value / parentValue) * 100).toFixed(2) 
            : 'N/A';
  
          return `
            <div style="text-align: left; font-size: 14px; line-height: 1.5;">
              <div style="display: flex; justify-content: space-between;">
                <span><strong>${removeSystemPrefix(info.name) || 'Total'}</strong></span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Value:</span>
                &nbsp;
                <span><strong>${value}</strong></span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                  <span>Share of Total:</span>
                  &nbsp;
                  <span><strong>${shareOfTotal}%</strong></span>
                </div>
              ${
                parentName
                  ? `<div style="display: flex; justify-content: space-between;">
                       <span>Share of ${parentName}:</span>
                       &nbsp;
                       <span><strong>${shareOfParent}%</strong></span>
                     </div>`
                  : ''
              }
            </div>`;
        },
      },
      series: [],
    };
  }
  
  
  
  

  /** Map the color to series. This function helps persist color between the same series when switching
   * between treemap and sunburst charts. 
   * 
   * A good side-effect: It also helps matching the color in the Basic pie chart.
   */
  generateColorMapping(data: TreeNode[], parentColor?: string): TreeNode[] {
    const colorPalette = this.colorService.chartColorPaletteLight;
  
    // A variable to keep track of the color index
    let colorIndex = 0;
  
    return data.map((node, index) => {
      // If no parent color, assign a new color, otherwise inherit the parent color
      const color = parentColor ?? colorPalette[(index + Math.floor(index / colorPalette.length)) % colorPalette.length];
  
      // Apply the color to the current node
      node.itemStyle = { color };
  
      // Recursively apply colors to children if they exist
      if (node.children) {
        node.children = this.generateColorMapping(node.children, color);
      }
  
      return node;
    });
  }


  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['treeData']) {
      /** Assign color for each series to persist colour when switching charts. */
      this.treeData = this.generateColorMapping([...this.treeData]); // Clone the data for safety
      this.updateChart(this.currentChartType === 'treemap' ? this.getTreemapSeries() : this.getSunburstSeries())
    }
  }


  private getTreemapSeries(hideUpperLabels: boolean = false): EChartsOption['series'] {
    return {
      type: 'treemap',
      id: 'treemap-sunburst-transition',
      animationDurationUpdate: 600,
      width: '95%',
      height: '95%',
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
        borderWidth: 1,
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
        borderColor: this.colorService.isDarkMode() ? '#404040' : '#e5e5e5',
      },
      label: {
        show: false,
      },
      data: this.treeData,
    };
  }

  updateChart(series: EChartsOption['series']) {
    this.mergeOptions = {
      ...this.getBaseOptions(),
      series: series
    }
  }

  /** Reset zoom on treemap. */
  resetZoom(chartInstance: any): void {
    if (this.currentChartType === 'treemap') {
      chartInstance.dispatchAction({
        type: 'treemapZoomToNode',
        targetNodeId: 0 // Assuming root node has ID 0
      });
    } else if (this.currentChartType === 'sunburst') {
      // No built-in zoom reset for sunburst, but you can re-apply options
      this.updateChart(this.getSunburstSeries());
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
      }, 370);
    } else {
      // Immediate transition to sunburst
      this.currentChartType = newChartType;
      this.updateChart(this.getSunburstSeries());
    }
  }
}
