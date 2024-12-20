import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy } from '@angular/core';
import { EChartsType } from 'echarts';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { ColorService } from '../../services/color.service';

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
  protected colorService = inject(ColorService)
  protected _chartInstance?: EChartsType

  /** On chart init, assign chart instance. */
  onChartInit(chart: EChartsType) {
    this._chartInstance = chart;
  }

  ngOnDestroy(): void {
  }
}
