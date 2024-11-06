import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-budget-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, CommonModule,
    MatInputModule, ReactiveFormsModule, FormsModule
  ],
  templateUrl: './budget-dialog.component.html',
  styleUrl: './budget-dialog.component.scss'
})
export class BudgetDialogComponent {
  budgetValue: number;
  constructor(
    public dialogRef: MatDialogRef<BudgetDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { categoryLabel: string; value: number }
  ) {
    this.budgetValue = data.value || 0;
  }

  validateInput() {
    if (this.budgetValue < 0) {
      this.budgetValue = 0;
    }
  }

  save() {
    this.dialogRef.close(this.budgetValue);
  }

  close() {
    this.dialogRef.close();
  }
}
