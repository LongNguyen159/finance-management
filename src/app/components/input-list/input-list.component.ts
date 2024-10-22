import { Component, inject, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import { DataService, ProcessedOutputData } from '../../services/data.service';
import { EntryType, UserDefinedLink } from '../models';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatIconModule} from '@angular/material/icon';
import { takeUntil } from 'rxjs';
import {MatAutocomplete, MatAutocompleteModule, MatAutocompleteTrigger} from '@angular/material/autocomplete';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { BasePageComponent } from '../../base-components/base-page/base-page.component';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import { UiService } from '../../services/ui.service';

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

export class InputListComponent extends BasePageComponent implements OnInit, OnDestroy {
  dataService = inject(DataService)
  uiService = inject(UiService)
  @ViewChildren(MatAutocompleteTrigger) autocompleteTriggers!: QueryList<MatAutocompleteTrigger>;


  demoLinks: UserDefinedLink[] = this.dataService.demoLinks;

  linkForm: FormGroup; // FormGroup to manage input fields
  sourceSearchControl = new FormControl(); // Search control for the dropdown
  initialFormState: UserDefinedLink[] = []; // Initial form state to compare with new data

  linkTypes: EntryType[] = [EntryType.Income, EntryType.Expense, EntryType.Tax]; // Types of links
  entryTypes = EntryType; // Enum for entry types

  existingNodes: string[] = []; // To hold existing node names
  filteredNodes: string[] = []; // To hold filtered suggestions for auto-complete

  taxNodeExists = false; // Flag to check if a tax node exists

  updateFromService = false; // Flag to control value changes

  dataMonth: string = ''


  constructor(private fb: FormBuilder) {
    super();
    this.linkForm = this.fb.group({
      links: this.fb.array([])
    });
  }

  ngOnInit(): void {
    /** On response from service, update forms to reflect correct amount if children expenses
     * exceed their parent.
     */
    this.dataService.getProcessedData().pipe(takeUntil(this.componentDestroyed$)).subscribe(data => {
      this.dataMonth = data.month
      this.existingNodes = data.sankeyData.nodes.map(node => node.name)
      this.filteredNodes = [...this.existingNodes];
      this.taxNodeExists = this._hasTaxNode(data.rawInput);

      /** Populate links with predefined data */
      this.populateInputFields(data)
      this._addDefaultNode();

      console.log('data changed', data)
    });

    // Listen to changes in the search control to filter the dropdown
    this.sourceSearchControl.valueChanges.pipe(takeUntil(this.componentDestroyed$)).subscribe((searchTerm) => {
      this.filteredNodes = this._filterNodes(searchTerm);
      this._addDefaultNode();
    });
  }

  /** Update Input, this function when triggered will send the input data to service to update the form state.
   * Only trigger this function to reatively update the form.
   * For example like summing the total children value to reflect on the parent node.
   * Else, we just submit the form on component destroy.
   */
  updateInput() {
    if (!this.linkForm.valid && this.updateFromService) return;
  
    const formData: UserDefinedLink[] = this.linkForm.value.links;
  
    // Early exit if there are no changes compared to the initial form state
    if (JSON.stringify(formData) === JSON.stringify(this.initialFormState)) {
      return; // No changes, don't proceed
    }
  
    console.log('User input changed!');
    
    this.taxNodeExists = this._hasTaxNode(formData);
    this.dataService.processInputData(formData, this.dataMonth);
  
    // After processing, update the initial form state to the new one
    this.initialFormState = [...formData]; // Update the stored form state
  }

  checkTaxNodeExists() {
    this.taxNodeExists = this._hasTaxNode(this.linkForm.value.links);
  }


  //#region Copy & Paste Links
  copyLinks(): void {
    const currentLinks = this.linkForm.value.links;
    if (currentLinks && currentLinks.length > 0) {
      this.dataService.storeCopiedLinks(currentLinks);
      this.uiService.showSnackBar(`'${this.dataMonth}' copied to clipboard!`, 'Ok');
    } else {
      this.uiService.showSnackBar('Nothing to copy!', 'Dismiss');
    }
  }

  // Method to paste stored data back into the form
  pasteLinks(): void {
    const copiedLinks = this.dataService.retrieveCopiedLinks();
    if (copiedLinks) {
      this.populateInputFields({ rawInput: copiedLinks } as ProcessedOutputData);
      this.uiService.showSnackBar('Links pasted!', 'Ok');
    } else {
      this.uiService.showSnackBar('Clipboard is empty!', 'Dismiss');
    }
  }
  //#endregion


  //#region Form Initialisation
  /** Function to create form input.
   * @param link Optional parameter to populate the form with existing data
   * if no `link` param is provided, an empty form with default values '' will be created.
   */
  private _createLinkGroup(link?: UserDefinedLink): FormGroup {
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
    if (linkGroup.get('type')?.value == EntryType.Income || linkGroup.get('type')?.value == EntryType.Tax) {
      linkGroup.get('source')?.disable({ emitEvent: false });
    }


    // Subscribe to changes in the type field
    linkGroup.get('type')?.valueChanges.pipe(takeUntil(this.componentDestroyed$)).subscribe(value => {
      if (value == EntryType.Income || value == EntryType.Tax) {
        linkGroup.get('source')?.disable({ emitEvent: false }); // Disable source if income
      } else {
        linkGroup.get('source')?.enable({ emitEvent: false });  // Enable source otherwise
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


  /** Initiliase/Populate the form with predefined data */
  populateInputFields(selectedMonthData: ProcessedOutputData): void {
    console.log('populating input fields...', selectedMonthData.rawInput)

    /** clear the form and repopulate it with new data. */
    this.linkArray.clear({ emitEvent: false });
    
    const links = this.dataService.isDemo ? this.demoLinks : selectedMonthData.rawInput;
    
    // Populate form without emitting valueChanges
    links.forEach(link => this.linkArray.push(this._createLinkGroup(link), { emitEvent: false }));
    // Shallow copy to avoid mutations
    this.initialFormState = [...links];
  }
  //#endregion


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



  /** Helper function to determine tax node in links */
  private _hasTaxNode(data: UserDefinedLink[]): boolean {
    return data.some(item => item.type == EntryType.Tax)
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
      linkGroup.get('source')?.setErrors({ cycle: true }, { emitEvent: false });
      return;
    }
  
    // Build adjacency list from existing links
    // const adjacencyList = this.buildAdjacencyList(links);
  
    // Find all descendants of the target
    const descendants = this.findDescendants(target, links);

    
    /** Check if a node is sourcing its decendants. If yes, return cycle error */
    if (descendants.has(source)) {
      linkGroup.get('source')?.setErrors({ cycle: true }, { emitEvent: false }); // Cycle detected
    } else {
      linkGroup.get('source')?.setErrors(null, { emitEvent: false });  // No cycle
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
    this.linkArray.push(this._createLinkGroup(), { emitEvent: false });
  }

  // Remove an input row
  removeLink(index: number): void {
    this.linkArray.removeAt(index, { emitEvent: false });
    // Update chart when input changed
    this.dataService.processInputData(this.linkForm.value.links, this.dataMonth)
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
      this.dataService.processInputData(formData, this.dataMonth)
    }
  }

  closeAutoComplete(index: number): void {
    const trigger = this.autocompleteTriggers.toArray()[index];
    setTimeout(() => {
      trigger.closePanel();
    }, 0);
  }

  
  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.onSubmit()
  }
}
