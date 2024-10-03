import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SankeyChartComponent } from "./components/sankey-chart/sankey-chart.component";
import { PieChartComponent } from './components/pie-chart/pie-chart.component';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { InputListComponent } from './components/input-list/input-list.component';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { DataService } from './components/data.service';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import { InputDialogComponent } from "./components/input-dialog/input-dialog.component";
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SankeyChartComponent, PieChartComponent, NgxEchartsDirective, InputListComponent,
    MatButtonModule, CommonModule, MatIconModule, MatMenuModule, InputDialogComponent],
  providers: [
    provideEcharts(),
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'finance-management';
  isVerticalLayout = true;

  dataService = inject(DataService)


  toggleLayout() {
    this.isVerticalLayout = !this.isVerticalLayout;
  }
}
