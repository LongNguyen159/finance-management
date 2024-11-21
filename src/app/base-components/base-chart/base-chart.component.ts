import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { EChartsType } from 'echarts';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';

@Component({
  selector: 'app-base-chart',
  standalone: true,
  imports: [NgxEchartsDirective, CommonModule],
  providers: [
    provideEcharts(),
  ],
  templateUrl: './base-chart.component.html',
  styleUrl: './base-chart.component.scss'
})
export class BaseChartComponent implements OnDestroy {

  protected _chartInstance?: EChartsType

  onChartInit(chart: EChartsType) {
    this._chartInstance = chart;
  }

  ngOnDestroy(): void {
    if (this._chartInstance && !this._chartInstance.isDisposed()) {
      this._chartInstance?.dispose();
    }
  }
}
