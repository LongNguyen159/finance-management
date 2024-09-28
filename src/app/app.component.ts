import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SankeyChartComponent } from "./components/sankey-chart/sankey-chart.component";
import { PieChartComponent } from './components/pie-chart/pie-chart.component';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SankeyChartComponent, PieChartComponent, NgxEchartsDirective],
  providers: [
    provideEcharts(),
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'finance-management';
}
