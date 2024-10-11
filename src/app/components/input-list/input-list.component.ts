import { Component, inject, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import { DataService } from '../data.service';
import { UserDefinedLink } from '../models';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatIconModule} from '@angular/material/icon';
import { debounceTime, filter, take, takeUntil } from 'rxjs';
import {MatAutocomplete, MatAutocompleteModule, MatAutocompleteTrigger} from '@angular/material/autocomplete';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { BasePageComponent } from '../../base-components/base-page/base-page.component';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';

/** Prevent user to define a certain node name that coincides with our system generated node name. */
function restrictedNodeNamesValidator(restrictedNames: string[]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const forbidden = restrictedNames.includes(control.value);
    return forbidden ? { restrictedNodeName: { value: control.value } } : null;
  };
}


/** Custom Validator to ensure the field is not empty or only spaces */
function nonEmptyValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value?.trim();
    return value ? null : { emptyOrWhitespace: { value: control.value } };
  };
}
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
    MatSlideToggleModule,
  ],
  templateUrl: './input-list.component.html',
  styleUrl: './input-list.component.scss'
})

/**
 * TODO:
 * - Fix: Source from field not reflecting the selected value of the form.
 * 
 */
export class InputListComponent extends BasePageComponent implements OnInit {
  dataService = inject(DataService)
  @ViewChildren(MatAutocompleteTrigger) autocompleteTriggers!: QueryList<MatAutocompleteTrigger>;


  demoLinks: UserDefinedLink[] = this.dataService.demoLinks;

  linkForm: FormGroup; // FormGroup to manage input fields
  sourceSearchControl = new FormControl(); // Search control for the dropdown

  linkTypes = ['income', 'expense', 'tax']

  existingNodes: string[] = []; // To hold existing node names
  filteredNodes: string[] = []; // To hold filtered suggestions for auto-complete

  taxNodeExists = false; // Flag to check if a tax node exists

  updateFromService = false; // Flag to control value changes



  constructor(private fb: FormBuilder) {
    super();
    this.linkForm = this.fb.group({
      links: this.fb.array([this.createLinkGroup()])
    });
  }

  ngOnInit(): void {
    /** On response from service, update forms to reflect correct amount if children expenses
     * exceed their parent.
     */
    this.dataService.getProcessedData().pipe(takeUntil(this.componentDestroyed$)).subscribe(data => {
      this.existingNodes = data.sankeyData.nodes.map(node => node.name)
      this.filteredNodes = [...this.existingNodes];
      this._addDefaultNode();
      this.updateFormValueReactively(data.rawInput);
    });

    /** Update Chart every time user changes the form input */
    this.linkForm.valueChanges
    .pipe(
      takeUntil(this.componentDestroyed$),
      debounceTime(1400),
      filter(() => this.linkForm.valid && !this.updateFromService) // Only proceed if the form is valid
    )
    .subscribe(formData => {
      this.dataService.processInputData(formData.links);
      this.taxNodeExists = this._hasTaxNode(formData.links);
    });

    // Listen to changes in the search control to filter the dropdown
    this.sourceSearchControl.valueChanges.pipe(takeUntil(this.componentDestroyed$)).subscribe((searchTerm) => {
      this.filteredNodes = this._filterNodes(searchTerm);
      this._addDefaultNode();
    });

    this.initializeLinks()
  }

  /** This is used to 'remove' the source from the field. It will be linked to default income node.
   * In our service, we already have a logic that handles if source node is not found, link to default income node.
   * We don't have 'default income' node, so it's understood that it'll be linked to default income node.
   * Unless user defines 'default income' node, it'll be linked to default income node.
   */
  private _addDefaultNode() {
    if (!this.filteredNodes.includes('default')) {
      this.filteredNodes.unshift('Default income');
    }
  }

  /** Update form value to correctly reflect the value of children sum in their parent */
  updateFormValueReactively(rawInput: UserDefinedLink[]): void {
    // Check if the new data is different from the current values
    const currentLinks = this.linkArray.controls.map(control => control.value);
    const isDifferent = JSON.stringify(currentLinks) !== JSON.stringify(rawInput);
  
    if (!isDifferent) {
      return; // Don't proceed if data hasn't changed
    }
  
    this.updateFromService = true; // Set the flag to true
  
    // Clear current form array
    this.linkArray.clear();
  
    // Populate the form with the new data
    rawInput.forEach(link => {
      this.linkArray.push(this.createLinkGroup(link));
    });

  
    this.updateFromService = false; // Reset the flag
  }
  


  /** Helper function to determine tax node in links */
  private _hasTaxNode(data: UserDefinedLink[]): boolean {
    return data.some(item => item.type === 'tax')
  }


  
  /** Initiliase/Populate the form with predefined data */
  initializeLinks(): void {
    this.linkArray.clear()
    if (this.dataService.isDemo) {
      this.demoLinks.forEach(link => this.linkArray.push(this.createLinkGroup(link)));
    } else {
      this.dataService.savedData.rawInput.forEach(link => this.linkArray.push(this.createLinkGroup(link)));
    }
  }

  /** Popuplate the form */
  createLinkGroup(link?: UserDefinedLink): FormGroup {
    const linkGroup = this.fb.group({
      type: [link ? link.type : '', Validators.required],
      target: [link ? link.target : '', [
        Validators.required,
        nonEmptyValidator(),  // Add this validator to ensure the target is not empty or whitespace
        restrictedNodeNamesValidator(['Default income', 'Total Income', 'Usable Income'])
      ]],
      value: [link ? link.value : 0, [Validators.required, Validators.min(0)]],
      source: [link ? link.source : ''] // Optional
    });

    // Disable the source field if type is 'income'
    if (linkGroup.get('type')?.value === 'income' || linkGroup.get('type')?.value === 'tax') {
      linkGroup.get('source')?.disable();
    }


    // Subscribe to changes in the type field
    linkGroup.get('type')?.valueChanges.pipe(takeUntil(this.componentDestroyed$)).subscribe(value => {
      if (value === 'income') {
        linkGroup.get('source')?.disable(); // Disable source if income
      } else {
        linkGroup.get('source')?.enable();  // Enable source otherwise
      }
    });


    // Listen to changes in the source field for filtering options
    linkGroup.get('source')?.valueChanges.pipe(takeUntil(this.componentDestroyed$)).subscribe(value => {
      if (value) {
        this._filterNodes(value);
        this.checkForCycle(value, linkGroup.get('target')?.value, linkGroup, this.linkArray.value);
      }
      
      
    });
    return linkGroup;
  }

  //#region Cycle Detection
  private buildAdjacencyList(links: UserDefinedLink[]): Map<string, string[]> {
    const adjacencyList = new Map<string, string[]>();
  
    links.forEach(link => {
      if (link.source && link.target) {
        if (!adjacencyList.has(link.source)) {
          adjacencyList.set(link.source, []);
        }
        adjacencyList.get(link.source)?.push(link.target);
      }
    });
  
    return adjacencyList;
  }
  
  // Step 2: Find all descendants of a node using DFS
  private findDescendants(node: string, links: UserDefinedLink[]): Set<string> {
    const descendants = new Set<string>();
    const stack = [node];  // Use a stack for DFS

    const adjacencyList = this.buildAdjacencyList(links);
  
    while (stack.length > 0) {
      const currentNode = stack.pop();
      const children = adjacencyList.get(currentNode || '') || [];
  
      children.forEach(child => {
        if (!descendants.has(child)) {
          descendants.add(child);
          stack.push(child);  // Keep searching for deeper descendants
        }
      });
    }
  
    return descendants;
  }
  
  /** Check for cycle in the links.
   * @param source Source node
   * @param target Target node
   * @param linkGroup FormGroup containing the source and target fields
   * @param links Array of links
   * 
   * @if source = target, it's a cycle error
   * @if source is sourcing its descendants, it's a cycle error
   */
  private checkForCycle(source: string, target: string | undefined | null, linkGroup: FormGroup, links: UserDefinedLink[]): void {
    if (!target) {
      return;
    }


    /** If source = value, it's a cycle error, exit the function early. */
    if (source.toLowerCase() === target.toLowerCase()) {
      linkGroup.get('source')?.setErrors({ cycle: true });
      return;
    }
  
    // Build adjacency list from existing links
    // const adjacencyList = this.buildAdjacencyList(links);
  
    // Find all descendants of the target
    const descendants = this.findDescendants(target, links);

    
    /** Check if a node is sourcing its decendants. If yes, return cycle error */
    if (descendants.has(source)) {
      linkGroup.get('source')?.setErrors({ cycle: true }); // Cycle detected
    } else {
      linkGroup.get('source')?.setErrors(null);  // No cycle
    }
  }

  //#endregion


  //#region Link Controls
  // Filter nodes based on user input
  private _filterNodes(value: string): string[] {
    const filterValue = value.toLowerCase();
    
    // Filter nodes, excluding the current node if it matches
    return this.filteredNodes = this.existingNodes
      .filter(nodeName => nodeName.toLowerCase().includes(filterValue) && nodeName.toLowerCase() !== filterValue);
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

  //#endregion

  // Submit form and emit the data (to parent component or a service)
  onSubmit(): void {
    if (this.linkForm.valid) {
      const formData: UserDefinedLink[] = this.linkForm.value.links;
      this.dataService.processInputData(formData)
    }
  }

  closeAutoComplete(index: number): void {
    const trigger = this.autocompleteTriggers.toArray()[index];
    setTimeout(() => {
      trigger.closePanel();
    }, 0);
  }
}
