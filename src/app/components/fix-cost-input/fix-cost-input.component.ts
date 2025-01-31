import { Component } from '@angular/core';
import { InputListComponent } from '../input-list/input-list.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatCardModule } from '@angular/material/card';
import { expenseCategoryDetails, UserDefinedLink } from '../models';
import { debounceTime, takeUntil } from 'rxjs';
import { ErrorCardComponent } from "../error-card/error-card.component";
import { MatTooltipModule } from '@angular/material/tooltip';


@Component({
  selector: 'app-fix-cost-input',
  standalone: true,
  imports: [MatButtonModule,
    ReactiveFormsModule,
    CommonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    NgxMatSelectSearchModule,
    MatCardModule, ErrorCardComponent,
    MatTooltipModule
  ],
  templateUrl: './fix-cost-input.component.html',
  styleUrl: './fix-cost-input.component.scss',
})
export class FixCostInputComponent extends InputListComponent {
  fixCostsInfoTooltip = 'If you change your Fix Costs defined here, you will have to click "Update Fix Costs" in your "Edit Input" dialog to apply the changes.'

  constructor(fb: FormBuilder) {
    super(fb); // Pass FormBuilder to the parent constructor
  }

  override ngOnInit() {
    this.existingNodes = Object.values(expenseCategoryDetails);
    this.filteredNodes = [...this.existingNodes];
    this.initialFormState = [...this.linkArray.value]; // Store the initial form state
    this.listenCategoryChanges()


    let existingFixCosts = localStorage.getItem('fixCosts') 

    if (this.dataService.isDemo()) {
      existingFixCosts = JSON.stringify(this.dataService.demoLinks.filter(item => item.isFixCost));
    }


    if (existingFixCosts) {
      const parsedFixCosts: UserDefinedLink[] = JSON.parse(existingFixCosts);

      parsedFixCosts.forEach(link => {
        link.isFixCost = true;
        this.linkArray.push(this._createLinkGroup(link), { emitEvent: false });
      })
    }

    this.linkForm.valueChanges.pipe(takeUntil(this.componentDestroyed$), debounceTime(250)).subscribe(() => {
     
      if (this.linkForm.valid) {
        this.saveToLocalStorage()
      }
    })    
  }

  
  override updateInput() {
    if (!this.linkForm.valid) return;
  
    const formData: UserDefinedLink[] = this.linkForm.value.links;

    /** Do not allow negative values on form */
    const negatives = formData.filter(link => link.value < 0);
    if (negatives.length > 0) { 
      this.uiService.showSnackBar('Negative values are not allowed!', 'Dismiss')
      return;
    }

    if (JSON.stringify(formData) === JSON.stringify(this.initialFormState)) {
      return; // No changes, don't proceed
    }
    
    this.taxNodeExists = this._hasTaxNode(formData);
    this.saveToLocalStorage()

    // After processing, update the initial form state to the new one
    this.initialFormState = [...formData]; // Update the stored form state
  }


  override removeLink(index: number): void {
    this.linkArray.removeAt(index, { emitEvent: false });
    this.saveToLocalStorage()
  }


  saveToLocalStorage() {
    if (!this.linkForm.valid) return;
    localStorage.setItem('fixCosts', JSON.stringify(this.linkArray.value.map((link: UserDefinedLink) => ({ ...link, isFixCost: true }))));
  }

  override ngOnDestroy(): void {

    if (JSON.stringify(this.linkArray.value) === JSON.stringify(this.initialFormState)) {
      return; // No changes, don't proceed
    }

    if (this.linkForm.valid) {
      this.saveToLocalStorage()
    }
  }
}
