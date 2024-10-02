import { Component, inject, OnInit } from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import { DataService } from '../data.service';
import { UserDefinedLink } from '../models';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatIconModule} from '@angular/material/icon';
import { debounceTime, filter } from 'rxjs';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
@Component({
  selector: 'app-input-list',
  standalone: true,
  imports: [MatButtonModule,
    ReactiveFormsModule,
    CommonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatAutocompleteModule,
    NgxMatSelectSearchModule,
  ],
  templateUrl: './input-list.component.html',
  styleUrl: './input-list.component.scss'
})

/**
 * TODO:
 * - Fix: Source from field not reflecting the selected value of the form.
 * 
 */
export class InputListComponent implements OnInit {
  dataService = inject(DataService)
  userDefinedLinks: UserDefinedLink[] = [
    { type: 'income', target: 'Salary', value: 1400 },
    { type: 'income', target: 'Salary2', value: 1000 },
    { type: 'tax', target: 'Taxes', value: 220},
    { type: 'expense', target: 'Housing', value: 800},
    { type: 'expense', target: 'Rent', value: 500, source: 'Housing'},
    { type: 'expense', target: 'Gardening', value: 300, source: 'Housing'},
    { type: 'expense', target: 'Utils', value: 100, source: 'Gardening'},
  ]

  linkForm: FormGroup; // FormGroup to manage input fields
  sourceSearchControl = new FormControl(); // Search control for the dropdown

  linkTypes = ['income', 'expense', 'tax']

  existingNodes: string[] = []; // To hold existing node names
  filteredNodes: string[] = []; // To hold filtered suggestions for auto-complete



  constructor(private fb: FormBuilder) {
    this.linkForm = this.fb.group({
      links: this.fb.array([this.createLinkGroup()])
    });
  }

  ngOnInit(): void {
    this.dataService.getProcessedData().subscribe(data => {
      this.existingNodes = data.sankeyData.nodes.map(node => node.name)
      console.log('data', data)
    });

    /** Update Chart every time user changes the form input */
    this.linkForm.valueChanges
    .pipe(
      debounceTime(400),
      filter(() => this.linkForm.valid) // Only proceed if the form is valid
    )
    .subscribe(formData => {
      this.dataService.processInputData(formData.links);
    });

     // Listen to changes in the search control to filter the dropdown
     this.sourceSearchControl.valueChanges.subscribe((searchTerm) => {
      this.filteredNodes = this.filterNodes(searchTerm);
    });

    this.initializeLinks()
  }
  
  // Method to initialize the links with predefined data
  initializeLinks(): void {
    this.linkArray.clear()
    this.dataService.processInputData(this.userDefinedLinks)
    this.userDefinedLinks.forEach(link => this.linkArray.push(this.createLinkGroup(link)));
  }



  createLinkGroup(link?: UserDefinedLink): FormGroup {
    const linkGroup = this.fb.group({
      type: [link ? link.type : '', Validators.required],
      target: [link ? link.target : '', Validators.required],
      value: [link ? link.value : 0, [Validators.required, Validators.min(0)]],
      source: [link ? link.source : ''] // Optional
    });

    // Disable the source field if type is 'income'
    if (linkGroup.get('type')?.value === 'income') {
      linkGroup.get('source')?.disable();
    }


    // Subscribe to changes in the type field
    linkGroup.get('type')?.valueChanges.subscribe(value => {
      console.log('value', value)
      if (value === 'income') {
        linkGroup.get('source')?.disable(); // Disable source if income
      } else {
        linkGroup.get('source')?.enable();  // Enable source otherwise
      }
    });


    // Listen to changes in the source field for filtering options
    linkGroup.get('source')?.valueChanges.subscribe(value => {
      if (value) {
        this.filterNodes(value);
        this.checkForCycle(value, linkGroup.get('target')?.value);
      }
      
      
    });


    return linkGroup;
  }

  // Check for cycle and set error on source control if needed
  private checkForCycle(source: string, target: string | undefined | null): void {
    if (source.toLowerCase() === target?.toLowerCase()) {
      this.linkArray.controls.forEach((group) => {
        group.get('source')?.setErrors({ cycle: true });
      });
    } else {
      this.linkArray.controls.forEach((group) => {
        group.get('source')?.setErrors(null); // Clear the error
      });
    }
  }

  // Filter nodes based on user input
  private filterNodes(value: string): string[] {
    const filterValue = value.toLowerCase();
    
    // Filter nodes, excluding the current node if it matches
    return this.filteredNodes = this.existingNodes
      .filter(node => node.toLowerCase().includes(filterValue) && node.toLowerCase() !== filterValue);
  }

  // Add a new input row
  addLink(): void {
    this.linkArray.push(this.createLinkGroup());
  }

  // Remove an input row
  removeLink(index: number): void {
    this.linkArray.removeAt(index);
    // Update chart when input changed
    this.dataService.processInputData(this.linkForm.value.links)
  }

  // Getter to easily access the FormArray
  get linkArray(): FormArray {
    return this.linkForm.get('links') as FormArray;
  }

  // Submit form and emit the data (to parent component or a service)
  onSubmit(): void {
    if (this.linkForm.valid) {
      const formData: UserDefinedLink[] = this.linkForm.value.links;
      this.dataService.processInputData(formData)
    }
  }

}
