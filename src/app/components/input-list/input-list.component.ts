import { AfterViewInit, Component, ElementRef, inject, Input, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import { DataService, MonthlyData, SingleMonthData } from '../../services/data.service';
import { DateChanges, EntryType, ExpenseCategory, expenseCategoryDetails, ExpenseCategoryDetails, UserDefinedLink } from '../models';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatIconModule} from '@angular/material/icon';
import { debounceTime, takeUntil } from 'rxjs';
import { MatAutocompleteModule, MatAutocompleteTrigger} from '@angular/material/autocomplete';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { BasePageComponent } from '../../base-components/base-page/base-page.component';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import { UiService } from '../../services/ui.service';
import { MonthPickerComponent } from "../month-picker/month-picker.component";
import { formatDateToYYYYMM } from '../../utils/utils';
import { MatCardModule } from '@angular/material/card';
import { ErrorCardComponent } from "../error-card/error-card.component";
import { ColorService } from '../../services/color.service';
import { onMonthChanges } from '../../utils/data-utils';

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
    MatSlideToggleModule, MonthPickerComponent,
    MatCardModule, ErrorCardComponent],
  templateUrl: './input-list.component.html',
  styleUrl: './input-list.component.scss'
})

/** 
 * Notes for this component:
 * - This component is used to manage the input fields for the user-defined links.
 * 
 * Every time form changes: value changes, a row is removed, a row is pasted, we should call `updateSavedFormValuesOnFormChanges()` to notify that the current month
 * changes its value from initial state. This way, we can process the previous month before switching to a new month.
 * 
 * Switching months just repopulate the from with new data, and update the saved form values to the new form values. All within one lifecycle (Form is not destroyed or reinitialised).
 * 
 * 
 * - Use `_createLinkGroup()` to create a new form group for each link; Params 'links' in the function is optional for predefined links. If no links are provided, an empty form will be created.
 * 
 */

export class InputListComponent extends BasePageComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() triggeredMonthByDialog: string = ''

  dataService = inject(DataService)
  uiService = inject(UiService)
  colorService = inject(ColorService)
  @ViewChildren(MatAutocompleteTrigger) autocompleteTriggers!: QueryList<MatAutocompleteTrigger>;
  @ViewChild('bottomContent') bottomContent!: ElementRef;


  demoLinks: UserDefinedLink[] = this.dataService.demoLinks;

  linkForm: FormGroup; // FormGroup to manage input fields
  sourceSearchControl = new FormControl(); // Search control for the dropdown
  initialFormState: UserDefinedLink[] = []; // Initial form state to compare with new data

  linkTypes: EntryType[] = [EntryType.Income, EntryType.Expense, EntryType.Tax]; // Types of links
  entryTypes = EntryType; // Enum for entry types

  existingNodes: ExpenseCategoryDetails[] = []; // To hold existing node names
  filteredNodes: ExpenseCategoryDetails[] = []; // To hold filtered suggestions for auto-complete

  taxNodeExists = false; // Flag to check if a tax node exists

  updateFromService = false; // Flag to control value changes

  isFixCostsExpanded: boolean = false;

  isVariableCostsExpanded: boolean = true;

  dataMonth: string = ''
  singleMonthData: SingleMonthData
  allMonthsData: MonthlyData

  /** Save the current input values every time user changes the input.
   * Currently only assigned by valueChanges, and after user switches to new month, it assigns new value.
   */
  savedFormValues: UserDefinedLink[] = []

  /** Flag to track changes in the form. If true, means form has changes.
   * Use this flag to determine if we need to save the form values before switching to another month,
   * or process the form values before doing something.
   */
  hasChanges: boolean = false;

  /** Fixed links array. This hold the fix costs stored in local storage */
  fixedLinks: UserDefinedLink[] = []


  constructor(private fb: FormBuilder) {
    super();
    this.linkForm = this.fb.group({
      links: this.fb.array([])
    });
  }

  ngOnInit(): void {
    /** Retrieve fixed costs from local storage */
    this.fixedLinks = this.dataService.retrieveFixCostsLinks()


    this.dataService.getAllMonthsData().pipe(takeUntil(this.componentDestroyed$)).subscribe(allMonthsData => {
      this.allMonthsData = allMonthsData
    })

    /** On response from service, update forms to reflect correct amount if children expenses
     * exceed their parent.
     */
    this.dataService.getSingleMonthData().pipe(takeUntil(this.componentDestroyed$)).subscribe(data => {
      this.singleMonthData = data;
      this.dataMonth = data.month
      /** Only include expense nodes. */
      this.existingNodes = Object.values(expenseCategoryDetails)


      this.filteredNodes = [...this.existingNodes];
      this.taxNodeExists = this._hasTaxNode(data.rawInput);

      /** Populate links with predefined data */
      this.populateInputFields(data)
      this._addDefaultNode();

      console.log('fetched data to InputList: ', data)
    });

    // Listen to changes in the search control to filter the dropdown
    this.listenCategoryChanges()
    
    /** Listen to changes in value. If changes, save the current form value immediately. */
    this.linkForm.valueChanges.pipe(takeUntil(this.componentDestroyed$), debounceTime(300)).subscribe((formData) => {
      this.updateSavedFormValuesOnFormChanges()
    })
  }

  /** This function is used to hold the current form values. If there are changes in the form,
   * either by adding more links or remove links (via copy-paste also), or form values changes
   * call this function.
   * 
   * Main purpose of holding the saved form values is to track whether there are changes in the form.
   * If yes, process the form values before switching to another month. If no, do nothing.
   * If we don't have this functionality of saving current form values, we can't track whether there are changes in the form,
   * so every onMonthChanges, we will process the form values, which is inefficient.
   */
  private updateSavedFormValuesOnFormChanges() {
    this.savedFormValues = this.linkArray.value.slice();
    this.hasChanges = true;
  }

  
  
  protected listenCategoryChanges() {
    this.sourceSearchControl.valueChanges.pipe(takeUntil(this.componentDestroyed$)).subscribe((searchTerm) => {
      this.filteredNodes = this._filterNodes(searchTerm);
      this._addDefaultNode();
    });

  }
  
  //#region Month Changes
  onMonthChanges(selectedMonth: DateChanges) {
    const currentMonth = formatDateToYYYYMM(selectedMonth.currentMonth)
    const prevMonth = formatDateToYYYYMM(selectedMonth.previousMonth)

    /** This will trigger subscription onInit of this component. No need to update global variables here as we already did it in the subscription. */
    onMonthChanges(selectedMonth.currentMonth, this.allMonthsData, this.singleMonthData, this.dataService)

    /** Only process previous months if there are changes in the form detected by the boolen flag `hasChanges`.
     * Else it would process every previou months on month changes.
     */
    if (currentMonth !== prevMonth && this.hasChanges) {
      // Process previous month values if there are changes of that month and user navigate to another month.
      this.processMonthBeforeMonthChanges(prevMonth, this.savedFormValues)
      
      // Reset has changes flag after processing the month.
      this.hasChanges = false;
    }
    /** Assign the saved form values to the current form values (instead of previous month)
     * We do this to make the savedFormValues up-to-date to track whether it changes.
     */
    this.savedFormValues = this.linkForm.value.links.slice();
  }

  ngAfterViewInit(): void {
    /** Scroll to bottom of dialog input every time component is initialised.
     * Do it here because the view is not yet rendered in ngOnInit.
     */
    // this.scrollToBottom();
  }


  /** This function is used to process the previous month (in compare to current month).
   * Triggered when user changes the month.
   * USE CASE: When user made some changes, and navigate to another month, we want to save changes and process it.
   * @param previouMonthValue The previous month value
   * @param previousFormValues The previous form values
   */
  processMonthBeforeMonthChanges(previouMonthValue: string | undefined, previousFormValues: UserDefinedLink[]) {
    /** On first change the previousMomthValue can be undefined, in that case, do nothing. */
    if (!previouMonthValue || previousFormValues.length == 0) return;


    /** If process Input data, remember NOT to emit, because we only want to save it, if we emit,
     * the current month will be overriden from the data of previous month.
     */
    this.dataService.processInputData(previousFormValues, previouMonthValue, { showSnackbarWhenDone: true, emitObservable: false})
  }
  //#endregion



  /** Update Input, this function when triggered will send the input data to service to update the form state.
   * Only trigger this function to reatively update the form.
   * For example like summing the total children value to reflect on the parent node.
   * Else, we just submit the form on component destroy.
   */
  updateInput() {
    if (!this.linkForm.valid || this.updateFromService) return;
  
    const formData: UserDefinedLink[] = this.linkForm.value.links;


    /** Do not allow negative values on form */
    const negatives = formData.filter(link => link.value < 0);
    if (negatives.length > 0) { 
      this.uiService.showSnackBar('Negative values are not allowed!', 'Dismiss')
      return;
    }
  
    // Early exit if there are no changes compared to the initial form state
    if (JSON.stringify(formData) === JSON.stringify(this.initialFormState)) {
      return; // No changes, don't proceed
    }
    
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
      this.populateInputFields({ rawInput: copiedLinks } as SingleMonthData);
      this.hasChanges = true;
      this.uiService.showSnackBar('Links pasted!', 'Ok');
      /** Process the pasted links */
      this.dataService.processInputData(copiedLinks, this.dataMonth);
    } else {
      this.uiService.showSnackBar('Clipboard is empty!', 'Dismiss');
    }
  }

  pasteFixCosts() {
    if (this.fixedLinks.length == 0) {
      this.uiService.showSnackBar('No fix costs found', 'Dismiss');
      return;
    }

    const existingFixCosts: UserDefinedLink[] = this.linkArray.value.filter((link: UserDefinedLink) => link.isFixCost)

    /** If there are no changes in the fix costs section and user paste it, do nothing. */
    if (JSON.stringify(this.fixedLinks) == JSON.stringify(existingFixCosts)) {
      this.uiService.showSnackBar('No changes', 'Dismiss');
      return;
    }

    this.isFixCostsExpanded = true;
    
    /** If different, clear out the current fixed costs link and paste the link in local storage in.
     * This wil avoid duplicate fixed costs in the form.
     */
    if (JSON.stringify(this.fixedLinks) !== JSON.stringify(existingFixCosts)) { 
      // Filter out the current fixed costs from `linkArray`
      const updatedLinks = this.linkArray.value.filter((link: UserDefinedLink) => !link.isFixCost);
    
      // Add fixedLinks from localStorage to the filtered linkArray
      const newLinkArray = [...updatedLinks, ...this.fixedLinks];
    
      // Update the form with the new link array
      this.populateInputFields({ rawInput: newLinkArray } as SingleMonthData);
      /** Update saved form values. */
      this.updateSavedFormValuesOnFormChanges()

      this.dataService.processInputData(this.linkForm.value.links, this.dataMonth);
      this.hasChanges = true;
      this.uiService.showSnackBar('Fix costs updated!', 'Ok');
    }
  }
  //#endregion


  private _checkDuplicateName(value: string | null, formGroup: FormGroup): void {
    if (!value) return;
    
    // Get all form values and normalize for comparison
    const formValues: string[] = this.linkArray.value.map((link: UserDefinedLink) => link.target.toLowerCase());
    const duplicateNames: string[] = formValues.filter((item, index) => formValues.indexOf(item) !== index);

    // Display a snackbar notification if duplicates are found
    if (duplicateNames.length > 0) {
      formGroup.get('target')?.setErrors({ duplicatedName: true }, { emitEvent: false });
      this.uiService.showSnackBar('Duplicate names are not allowed!', 'Dismiss');
    } else {
      formGroup.get('target')?.setErrors(null, { emitEvent: false });
    }
  }


  //#region Form Initialisation
  /** Function to create form input.
   * @param link Optional parameter to populate the form with existing data
   * if no `link` param is provided, an empty form with default values '' will be created.
   */
  protected _createLinkGroup(link?: UserDefinedLink): FormGroup {
    const linkGroup = this.fb.group({
      type: [link ? link.type : '', Validators.required],
      target: [link ? link.target : '', [
        Validators.required,

        /** Non empty node names */
        nonEmptyValidator(),

        /** Not allowed node names: */
        restrictedNodeNamesValidator(this.dataService.nonAllowedNames)
      ]],
      value: [link ? link.value : 0, [Validators.required, Validators.min(0)]],
      source: [link ? link.source : ''], // Optional
      isFixCost: [link ? link.isFixCost : false]
    });

    // Disable the source field if type is 'income'
    if (linkGroup.get('type')?.value == EntryType.Income || linkGroup.get('type')?.value == EntryType.Tax) {
      linkGroup.get('source')?.disable({ emitEvent: false });
    }

    linkGroup.get('target')?.valueChanges.pipe(takeUntil(this.componentDestroyed$), debounceTime(200)).subscribe(value => {
      if (value) {
        this._checkDuplicateName(value, linkGroup);
        this.checkForCycle(value, linkGroup.get('source')?.value, linkGroup, this.linkArray.value);
        this.checkForNonAllowedNames(value, linkGroup)
      }
    })


    // Subscribe to changes in the type field
    linkGroup.get('type')?.valueChanges.pipe(takeUntil(this.componentDestroyed$)).subscribe(value => {
      if (value == EntryType.Income || value == EntryType.Tax) {
        linkGroup.get('source')?.disable({ emitEvent: false }); // Disable source if type = income or tax
        linkGroup.get('source')?.setValue('', { emitEvent: false }); // Clear source field
      } else {
        linkGroup.get('source')?.enable({ emitEvent: false });  // Enable source otherwise
      }
    });


    // Listen to changes in the source field for filtering options
    linkGroup.get('source')?.valueChanges.pipe(takeUntil(this.componentDestroyed$)).subscribe(value => {
      if (value) {
        /** Set type automatic to expense if category choosed */
        linkGroup.get('type')?.setValue(EntryType.Expense, { emitEvent: false });
        // this._filterNodes(value);
        this.checkForCycle(value, linkGroup.get('target')?.value, linkGroup, this.linkArray.value);
      }
    });
    return linkGroup;
  }

  checkForNonAllowedNames(name: string, linkGroup: FormGroup) {
    const isNotAllowedName = this.dataService.nonAllowedNames.includes(name.trim())
    if (isNotAllowedName) {
      linkGroup.get('target')?.setErrors({ restrictedNodeName: true }, { emitEvent: false });
      this.uiService.showSnackBar(`'${name}' is a reserved name and cannot be used!`, 'Dismiss');
    }
  }


  /** Initiliase/Populate the form with predefined data */
  populateInputFields(selectedMonthData: SingleMonthData): void {
    console.log('populating input fields...', selectedMonthData.rawInput)

    /** clear the form and repopulate it with new data. */
    this.linkArray.clear({ emitEvent: false });
    
    const links = this.dataService.isDemo() ? this.demoLinks : selectedMonthData.rawInput;
    
    // Populate form without emitting valueChanges
    links.forEach(link => this.linkArray.push(this._createLinkGroup(link), { emitEvent: false }));

    // Check for cycles in the initial form state
    this.linkArray.controls.forEach((control) => {
      this.checkForCycle(control.get('source')?.value, control.get('target')?.value, control as FormGroup);
    })


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
    const defaultNode = {
      label: '-- None --',
      value: '-- None --'
    }
    if (!this.filteredNodes.includes(defaultNode)) {
      this.filteredNodes.unshift(defaultNode);
    }
  }



  /** Helper function to determine tax node in links */
  protected _hasTaxNode(data: UserDefinedLink[]): boolean {
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
  
  /**
   * Checks for cycles in the links based on source and target.
   * A cycle occurs when:
   *   - source equals target, or
   *   - source is found among the descendants of target.
   * 
   * @param source Source node
   * @param target Target node (optional)
   * @param linkGroup FormGroup with source and target fields (optional)
   * @param links Array of links to search for descendants (optional)
  */
  private checkForCycle(source: string, target: string | null | undefined, linkGroup?: FormGroup, links?: UserDefinedLink[]): void {
    this.dataService.hasDataCycle.set(false); // Reset cycle flag
      
    // Exit if either source or target is missing
    if (!source || !target) return;

    // Check for direct cycle (source == target)
    if (source.toLowerCase() === target.toLowerCase()) {
      this.setCycleError(true, linkGroup);
      console.log('Cycle detected: source equals target');
      return;
    }

    // Exit if no links provided for descendant check
    if (!links) return;

    // Check if source is a descendant of target
    // const descendants = this.findDescendants(target, links);

    // console.log('Descendants:', descendants);
    // const hasCycle = descendants.has(source);
    // if (hasCycle) {
    //   this.setCycleError(hasCycle, linkGroup);
    // } else {
    //   this.setCycleError(null, linkGroup)
    // }
    // console.log(hasCycle ? 'Cycle detected: source is a descendant' : 'No cycle detected');
  } 

  /**
   * Sets the cycle error state on source and target fields.
   * @param linkGroup FormGroup containing source and target fields
   * @param hasCycle Boolean indicating if a cycle was detected
   */
  private setCycleError(hasCycle: boolean | null, linkGroup?: FormGroup): void {
    this.dataService.hasDataCycle.set(hasCycle || false);
    
    if (linkGroup) {
      const cycleError = hasCycle ? { cycle: true } : null;
      linkGroup.get('source')?.setErrors(cycleError, { emitEvent: false });
      linkGroup.get('target')?.setErrors(cycleError, { emitEvent: false });
    }
  }

  //#endregion


  //#region Link Controls
  // Filter nodes based on user input
  private _filterNodes(value: string): { label: string, value: string }[] {
    const filterValue = value.toLowerCase();
  
    // Filter nodes, excluding the current node if it matches
    return this.filteredNodes = this.existingNodes
      .filter(node => node.label.toLowerCase().includes(filterValue) && node.label.toLowerCase() !== filterValue);
  }

  // Add a new input row
  addLink(): void {
    /** Mark as untouch to prevent form being marked as invalid on adding link without doing anything yet */
    this.linkForm.markAsUntouched()
    this.linkArray.push(this._createLinkGroup(), { emitEvent: false });
    // scroll to bottom after adding new form field
    setTimeout(() => {
      this.scrollToBottom()
    }, 200)
  }

  // Remove an input row
  removeLink(index: number): void {
    const link: UserDefinedLink = this.linkArray.at(index).value;
    this.linkArray.removeAt(index, { emitEvent: false });
    this.updateSavedFormValuesOnFormChanges()
    this.dataService.processInputData(this.linkForm.value.links, this.dataMonth);
  }

  // Getter to easily access the FormArray
  get linkArray(): FormArray {
    return this.linkForm.get('links') as FormArray;
  }

  get fixCosts(): UserDefinedLink[] {
    return this.linkArray.value.filter((link: UserDefinedLink) => link.isFixCost);
  }

  //#endregion

  // Submit form and emit the data (to parent component or a service)
  onSubmit(): void {
    if (!this.linkForm.valid) return;

    const formData: UserDefinedLink[] = this.linkForm.value.links;
    this.dataService.processInputData(formData, this.dataMonth)
  }

  closeAutoComplete(index: number): void {
    const trigger = this.autocompleteTriggers.toArray()[index];
    setTimeout(() => {
      trigger.closePanel();
    }, 0);
  }


  scrollToBottom(): void {
    this.bottomContent.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  
  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.onSubmit()
  }
}
