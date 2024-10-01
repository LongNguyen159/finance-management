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
    { type: 'income', target: 'Salary', value: 1400 },
    { type: 'tax', target: 'Taxes', value: 220},
    { type: 'expense', target: 'Housing', value: 800},
    { type: 'expense', target: 'Rent', value: 500, source: 'Housing'},
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


    /** Update Chart every time user changes the form input */
    this.linkForm.valueChanges
    .pipe(
      debounceTime(500),
      filter(() => this.linkForm.valid) // Only proceed if the form is valid
    )
    .subscribe(formData => {
      this.dataService.processInputData(formData.links);
    });

    this.initializeLinks()
  }
  
  // Method to initialize the links with predefined data
  initializeLinks(): void {
    this.linkArray.clear()
    this.userDefinedLinks.forEach(link => this.linkArray.push(this.createLinkGroup(link)));
  }

  createLinkGroup(link?: UserDefinedLink): FormGroup {
    if (link) {
      return this.fb.group({
        type: [link.type, Validators.required],
        target: [link.target, Validators.required],
        value: [link.value, [Validators.required, Validators.min(0)]],
        source: [link.source]
      });
    } else {
      return this.fb.group({
        type: ['', Validators.required],
        target: ['', Validators.required],
        value: [0, [Validators.required, Validators.min(0)]],
        source: [''] // Optional
      });  
    }
    
  }

  // Add a new input row
  addLink(): void {
    this.linkArray.push(this.createLinkGroup());
  }

  // Remove an input row
  removeLink(index: number): void {
    this.linkArray.removeAt(index);
    this.dataService.processInputData(this.linkForm.value.links)
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
