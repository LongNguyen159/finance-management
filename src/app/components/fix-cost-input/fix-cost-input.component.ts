import { Component } from '@angular/core';
import { InputListComponent } from '../input-list/input-list.component';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
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
    MatCardModule, ErrorCardComponent],
  templateUrl: './fix-cost-input.component.html',
  styleUrl: './fix-cost-input.component.scss',
})
export class FixCostInputComponent extends InputListComponent {
  constructor(fb: FormBuilder) {
    super(fb); // Pass FormBuilder to the parent constructor
  }

  override ngOnInit() {
    this.existingNodes = Object.values(expenseCategoryDetails);
    this.filteredNodes = [...this.existingNodes];
    this.listenCategoryChanges()


    const existingFixCosts = localStorage.getItem('fixCosts');

    if (existingFixCosts) {
      const parsedFixCosts: {links: UserDefinedLink[]} = JSON.parse(existingFixCosts);

      parsedFixCosts.links.forEach(link => {
        this.linkArray.push(this._createLinkGroup(link), { emitEvent: false });
      })

      console.log('exising fix costs', parsedFixCosts)
    }

    this.linkForm.valueChanges.pipe(takeUntil(this.componentDestroyed$), debounceTime(250)).subscribe(() => {
     
      if (this.linkForm.valid) {
        this.saveToLocalStorage()
      }
    })    
  }

  
  override updateInput() {
    if (!this.linkForm.valid || this.updateFromService) return;
  
    const formData: UserDefinedLink[] = this.linkForm.value.links;

    /** Do not allow negative values on form */
    const negatives = formData.filter(link => link.value < 0);
    if (negatives.length > 0) { 
      this.uiService.showSnackBar('Negative values are not allowed!', 'Dismiss')
      return;
    }
    
    this.taxNodeExists = this._hasTaxNode(formData);
  }

  override addLink(): void {
    this.linkArray.push(this._createLinkGroup(), { emitEvent: false });
    // scroll to bottom after adding new form field
    this.scrollToBottom()
  }

  override removeLink(index: number): void {
    this.linkArray.removeAt(index, { emitEvent: false });
    this.saveToLocalStorage()
  }


  saveToLocalStorage() {
    localStorage.setItem('fixCosts', JSON.stringify(this.linkForm.value));
  }

  override ngOnDestroy(): void {
  }
}