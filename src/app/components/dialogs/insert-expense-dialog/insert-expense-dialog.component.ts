import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { BasePageComponent } from '../../../base-components/base-page/base-page.component';
import { DataService } from '../../../services/data.service';
import { SingleMonthData } from '../../models';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { debounceTime, takeUntil } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { UiService } from '../../../services/ui.service';
import { ColorService } from '../../../services/color.service';
import { processStringAmountToNumber } from '../../../utils/utils';

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
  userSingleMonthEntries: SingleMonthData


  constructor() {
    super();
    this.form = this.fb.group({
      insertInto: ['', Validators.required],
      amount: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.dataService.getSingleMonthData().pipe(takeUntil(this.componentDestroyed$)).subscribe((data: SingleMonthData) => {
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
    const normalisedSearchTerm = searchTerm.toLowerCase();
    if (!normalisedSearchTerm) {
      /** Assign a shallow copy of the `allOptions` array to avoid mutations */
      this.filteredOptions = this.allOptions.slice();
    } else {
      this.filteredOptions = this.allOptions.filter(option =>
        option.toLowerCase().includes(normalisedSearchTerm)
      );
    }
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
      this.dataService.processInputData(updatedRawInput, this.userSingleMonthEntries.month, { showSnackbarWhenDone: true });
    } else {
      this.uiService.showSnackBar('No matching entry found!', 'Error');
    }
  }

}
