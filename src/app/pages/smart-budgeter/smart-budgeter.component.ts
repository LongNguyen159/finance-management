import { Component, inject } from '@angular/core';
import { BudgetSliderComponent } from "../../components/budget-slider/budget-slider.component";
import { NavbarComponent } from "../../components/navbar/navbar.component";
import { CommonModule } from '@angular/common';
import { ColorService } from '../../services/color.service';

@Component({
  selector: 'app-smart-budgeter',
  standalone: true,
  imports: [
    BudgetSliderComponent,
    NavbarComponent,
    CommonModule
  ],
  templateUrl: './smart-budgeter.component.html',
  styleUrl: './smart-budgeter.component.scss'
})
export class SmartBudgeterComponent {
  colorService = inject(ColorService)
}
