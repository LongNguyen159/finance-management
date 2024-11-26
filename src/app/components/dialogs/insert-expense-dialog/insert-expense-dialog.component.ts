import { Component, Inject, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { BasePageComponent } from '../../../base-components/base-page/base-page.component';
import { DataService } from '../../../services/data.service';
import { SingleMonthData, UserDefinedLink } from '../../models';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { takeUntil } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { UiService } from '../../../services/ui.service';
import { ColorService } from '../../../services/color.service';
import { addImplicitPlusSigns, processStringAmountToNumber } from '../../../utils/utils';
import { LogsService } from '../../../services/logs.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-insert-expense-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatInputModule, ReactiveFormsModule, MatSelectModule,
    CommonModule, NgxMatSelectSearchModule,
    MatTooltipModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './insert-expense-dialog.component.html',
  styleUrl: './insert-expense-dialog.component.scss'
})
export class InsertExpenseDialogComponent extends BasePageComponent implements OnInit {
  dataService = inject(DataService)
  fb = inject(FormBuilder);
  uiService = inject(UiService)
  colorService = inject(ColorService)
  logService = inject(LogsService)

  form: FormGroup;
  searchControl = new FormControl()

  userSingleMonthEntries: SingleMonthData

  entryToUpdateIndex: number = -1;
  entryToUpdate: UserDefinedLink

  newValueUpdated: string | number = 0;

  isHistoryVisible: boolean = false;


  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {name: string, value: number}
  ) {
    super();
    this.form = this.fb.group({
      amount: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.form.get('amount')?.setValue(this.data.value);

    this.dataService.getSingleMonthData().pipe(takeUntil(this.componentDestroyed$)).subscribe((oneMonthEntries: SingleMonthData) => {
      this.userSingleMonthEntries = oneMonthEntries;
      
      this.entryToUpdateIndex = this.userSingleMonthEntries.rawInput.findIndex(item => item.target === this.data.name);
      if (this.entryToUpdateIndex !== -1) {
        // Create a shallow copy of the matching entry
        this.entryToUpdate = { ...this.userSingleMonthEntries.rawInput[this.entryToUpdateIndex] };
      }

    })
  }

  validateKeyPress(event: KeyboardEvent): void {
    const allowedChars = /[0-9+\-.\s]/; // Allows digits, plus, minus, decimal points, and whitespace
    const key = event.key;
  
    if (!allowedChars.test(key)) {
      event.preventDefault(); // Block invalid characters
    }
  }

  validatePaste(event: ClipboardEvent): void {
    const clipboardData = event.clipboardData;
    const pastedText = clipboardData?.getData('text') || '';
  
    // Remove all characters except digits, +, -, ., and whitespace
    const sanitizedText = pastedText.replace(/[^0-9+\-.\s]/g, '');
  
    if (sanitizedText !== pastedText) {
      event.preventDefault();
      const inputField = event.target as HTMLInputElement;
      inputField.value = sanitizedText;
    }
  }


  updateInput() {
    const amount = this.form.value.amount;
    const totalAmount = processStringAmountToNumber(amount);
    this.newValueUpdated = addImplicitPlusSigns(amount.toString() || '0')


  
    if (totalAmount === null) {
      this.uiService.showSnackBar('Invalid input!', 'OK');
      return;
    }
  
    this.form.get('amount')?.setValue(totalAmount);
  }

  /** Submit form, refactored version, not modifying original `rawInput` array. */
  submitForm() {
    if (!this.form.valid) {
      return;
    }
  
    const amount = this.form.value.amount;
    const totalAmount = processStringAmountToNumber(amount);
  
    if (totalAmount === null) {
      this.uiService.showSnackBar('Invalid input!', 'OK');
      return;
    }

    if (!this.entryToUpdate) {
      this.uiService.showSnackBar('No matching entry found!');
      return;
    }
    
    // Update the value immutably (patch the value of the entry, everything else remains the same)
    this.entryToUpdate.value = totalAmount;

    /** Update log */
    this.logService.setLog(this.userSingleMonthEntries.month, this.entryToUpdate.id, this.newValueUpdated)


    // Create a new array with the updated entry
    const updatedRawInput = [
      ...this.userSingleMonthEntries.rawInput.slice(0, this.entryToUpdateIndex),
      this.entryToUpdate,
      ...this.userSingleMonthEntries.rawInput.slice(this.entryToUpdateIndex + 1)
    ];

    // Send the updated array to the service
    this.dataService.processInputData(updatedRawInput, this.userSingleMonthEntries.month, { showSnackbarWhenDone: true });
  }

  toggleHistory() {
    this.isHistoryVisible = !this.isHistoryVisible;
  }

}
