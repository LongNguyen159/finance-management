import { Component, inject, OnInit } from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import { DataService } from '../data.service';
import { UserDefinedLink } from '../models';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatIconModule} from '@angular/material/icon';
import { debounceTime, filter } from 'rxjs';


@Component({
  selector: 'app-input-list',
  standalone: true,
  imports: [MatButtonModule,
    ReactiveFormsModule,
    CommonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './input-list.component.html',
  styleUrl: './input-list.component.scss'
})
export class InputListComponent implements OnInit {
  dataService = inject(DataService)


  userDefinedLinks: UserDefinedLink[] = [
    { type: 'income', target: 'Income', value: 1000 },
    { type: 'expense', target: 'House', value: 800},
    { type: 'expense', target: 'Rent', value: 500, source: 'House'},
    { type: 'expense', target: 'Rent2', value: 400, source: 'House'},
    { type: 'expense', target: 'Shopping', value: 800},
    { type: 'expense', target: 'Clothes', value: 250, source: 'Shopping'},

    // { type: 'income', target: 'Income', value: 3000 },
    // { type: 'income', target: 'Roommate Contribution', value: 565 },
    // { type: 'tax', target: 'Taxes', value: 208 },
    // { type: 'expense', target: 'Housing', value: 1096 },
    // { type: 'expense', target: 'Groceries', value: 160 },
    // { type: 'expense', target: 'Commute', value: 49 },
    // { type: 'expense', target: 'Electricity', value: 108, source: 'Housing' },
    // { type: 'expense', target: 'Water', value: 35, source: 'Housing' },      
    // { type: 'expense', target: 'Rent', value: 833, source: 'Housing' },
    // { type: 'expense', target: 'Wifi', value: 40, source: 'Housing' },
    // { type: 'expense', target: 'Kitchen', value: 80, source: 'Housing' },
    // { type: 'expense', target: 'Sport', value: 20 },
    // { type: 'expense', target: 'Sim Card', value: 20 },
    // { type: 'expense', target: 'Radio Fees', value: 19 },
  ]

  linkForm: FormGroup; // FormGroup to manage input fields
  
  linkTypes = ['income', 'expense', 'tax']


  constructor(private fb: FormBuilder) {
    this.linkForm = this.fb.group({
      links: this.fb.array([this.createLinkGroup()])
    });
  }

  ngOnInit(): void {
    this.dataService.getProcessedData().subscribe(data => {
      console.log('data', data)
    })

    this.handleTypeChange()
    this.dataService.processInputData(this.userDefinedLinks)


    this.linkForm.valueChanges
    .pipe(
      debounceTime(500),
      filter(() => this.linkForm.valid) // Only proceed if the form is valid
    )
    .subscribe(formData => {
      this.dataService.processInputData(formData.links);
    });
  }

  createLinkGroup(): FormGroup {
    return this.fb.group({
      type: ['', Validators.required],
      target: ['', Validators.required],
      value: [0, [Validators.required, Validators.min(0)]],
      source: [''] // Optional
    });
  }

  // Add a new input row
  addLink(): void {
    this.linkArray.push(this.createLinkGroup());
  }

  // Remove an input row
  removeLink(index: number): void {
    this.linkArray.removeAt(index);
  }

  // Getter to easily access the FormArray
  get linkArray(): FormArray {
    return this.linkForm.get('links') as FormArray;
  }

  handleTypeChange(): void {
    // For each link in the form array, subscribe to type changes
    const linksArray = this.linkForm.get('links') as FormArray;
    linksArray.controls.forEach(control => {
      const typeControl = control.get('type');
      
      const sourceControl = control.get('source');
  
      if (typeControl) {
        typeControl.valueChanges.subscribe(value => {
          if (value === 'income') {
            sourceControl?.disable(); // Disable source field if type is 'income'
          } else {
            sourceControl?.enable();  // Enable source field otherwise
          }
        });
      }
    })
  }


  // Submit form and emit the data (to parent component or a service)
  onSubmit(): void {
    if (this.linkForm.valid) {
      const formData: UserDefinedLink[] = this.linkForm.value.links;
      this.dataService.processInputData(formData)
    }
  }


  updateInput() {
    this.dataService.processInputData(this.userDefinedLinks)
  }
}
