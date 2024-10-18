import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { DemoChartComponent } from '../../components/charts/demo-chart/demo-chart.component';

@Component({
  selector: 'app-welcome-page',
  standalone: true,
  imports: [DemoChartComponent, MatButtonModule, MatIconModule, RouterModule],
  templateUrl: './welcome-page.component.html',
  styleUrl: './welcome-page.component.scss'
})
export class WelcomePageComponent {
  constructor(private router: Router) {}


  navigateToDocs() {
    this.router.navigate(['/docs']);
  }
}
