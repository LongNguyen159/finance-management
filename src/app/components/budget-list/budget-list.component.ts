import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { expenseCategoryDetails } from '../models';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ColorService } from '../../services/color.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-budget-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './budget-list.component.html',
  styleUrl: './budget-list.component.scss'
})
export class BudgetListComponent {
  colorService = inject(ColorService)
  expenseCategoryDetails = Object.values(expenseCategoryDetails);

  onBudgetClick(category: string) {
    console.log('Budget clicked', category);
  }
}
