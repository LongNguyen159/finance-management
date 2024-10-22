import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { BasePageComponent } from '../../../base-components/base-page/base-page.component';
import { DataService, ProcessedOutputData } from '../../../services/data.service';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { debounceTime, takeUntil } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { UiService } from '../../../services/ui.service';
import { ColorService } from '../../../services/color.service';

@Component({
  selector: 'app-insert-expense-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatInputModule, ReactiveFormsModule, MatSelectModule,
    CommonModule, NgxMatSelectSearchModule
  ],
  templateUrl: './insert-expense-dialog.component.html',
  styleUrl: './insert-expense-dialog.component.scss'
})
export class InsertExpenseDialogComponent extends BasePageComponent implements OnInit {
  dataService = inject(DataService)
  fb = inject(FormBuilder);
  uiService = inject(UiService)
  colorService = inject(ColorService)

  form: FormGroup;
  searchControl = new FormControl()


  allOptions: string[] = []
  filteredOptions: string[] = []
  userSingleMonthEntries: ProcessedOutputData


  constructor() {
    super();
    this.form = this.fb.group({
      insertInto: ['', Validators.required],
      amount: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.dataService.getSingleMonthData().pipe(takeUntil(this.componentDestroyed$)).subscribe((data: ProcessedOutputData) => {
      this.userSingleMonthEntries = data;
      this.allOptions = data.rawInput.map(item => item.target)
      /** Assign a shallow copy of the `allOptions` array to avoid mutations */
      this.filteredOptions = this.allOptions.slice();
    })


    this.searchControl.valueChanges
      .pipe(takeUntil(this.componentDestroyed$), debounceTime(250))
      .subscribe((searchTerm: string) => {
        this.filterOptions(searchTerm);
      });
  }


  private filterOptions(searchTerm: string): void {
    if (!searchTerm) {
      /** Assign a shallow copy of the `allOptions` array to avoid mutations */
      this.filteredOptions = this.allOptions.slice();
    } else {
      this.filteredOptions = this.allOptions.filter(option =>
        option.toLowerCase().includes(searchTerm)
      );
    }
  }



  /** Working version, but mutating the original `rawInput` array. */
  // submitForm() {
  //   if (!this.form.valid) {
  //     return;
  //   }
  
  //   console.log(this.form.value);
  //   const amount = this.form.value.amount;
  //   const totalAmount = this.processStringAmountToNumber(amount);
  
  //   if (totalAmount === null) {
  //     this.uiService.showSnackBar('Invalid input!', 'OK');
  //     return;
  //   }
  
  //   console.log('Total amount:', totalAmount);
  //   console.log('Current raw input', this.userSingleMonthEntries.rawInput);
  
  //   // Find the matching entry based on the "target"
  //   const matchingEntry = this.userSingleMonthEntries.rawInput.find(item => item.target === this.form.value.insertInto);
  
  //   if (matchingEntry) {
  //     // Update the value of the matching entry by adding the totalAmount
  //     matchingEntry.value += totalAmount; // Add totalAmount to the existing value
  
  //     console.log('Updated entry:', matchingEntry);
  //     console.log('Updated raw input:', this.userSingleMonthEntries.rawInput);
  //     this.dataService.processInputData(this.userSingleMonthEntries.rawInput, this.userSingleMonthEntries.month);
  
  //     this.uiService.showSnackBar('Input inserted successfully!', 'OK');
  //   } else {
  //     this.uiService.showSnackBar('No matching entry found!', 'Error');
  //   }
  // }


  /** Submit form, refactored version, not modifying original `rawInput` array. */
  submitForm() {
    if (!this.form.valid) {
      return;
    }
  
    const amount = this.form.value.amount;
    const totalAmount = this.processStringAmountToNumber(amount);
  
    if (totalAmount === null) {
      this.uiService.showSnackBar('Invalid input!', 'OK');
      return;
    }
    
    // Find the index of the matching entry based on "target"
    const entryIndex = this.userSingleMonthEntries.rawInput.findIndex(item => item.target === this.form.value.insertInto);
  
    if (entryIndex !== -1) {
      // Create a shallow copy of the matching entry
      const updatedEntry = { ...this.userSingleMonthEntries.rawInput[entryIndex] };
  
      // Update the value immutably
      updatedEntry.value += totalAmount;
  
      // Create a new array with the updated entry
      const updatedRawInput = [
        ...this.userSingleMonthEntries.rawInput.slice(0, entryIndex),
        updatedEntry,
        ...this.userSingleMonthEntries.rawInput.slice(entryIndex + 1)
      ];
  
      // Send the updated array to the service
      this.dataService.processInputData(updatedRawInput, this.userSingleMonthEntries.month, false, true);
    } else {
      this.uiService.showSnackBar('No matching entry found!', 'Error');
    }
  }

  /** Process string input like '110 + 50' to '160'
   * @param amount The string input to process
   * @returns The total amount as a number or null if the input is invalid
   */
  processStringAmountToNumber(amount: string): number | null {
    // Replace commas with dots for German input
    const normalizedAmount = amount.replace(/,/g, '.');

    // Remove unnecessary spaces around numbers, "+", and "-" signs
    const cleanedAmount = normalizedAmount.replace(/\s+/g, '');

    // Validate the cleaned input: must consist of valid numbers with optional "+" and "-" signs
    if (!/^[-+]?(\d+(\.\d+)?)([-+]\d+(\.\d+)?)*$/.test(cleanedAmount)) {
      return null; // Invalid input
    }

    try {
      // Use eval to compute the total since it's a valid math expression
      const total = eval(cleanedAmount);
      return total;
    } catch (error) {
      return null; // In case of any error during evaluation
    }
  }
}
