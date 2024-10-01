import { Component, inject, OnInit } from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import { DataService } from '../data.service';
import { UserDefinedLink } from '../models';

@Component({
  selector: 'app-input-list',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './input-list.component.html',
  styleUrl: './input-list.component.scss'
})
export class InputListComponent implements OnInit {
  dataService = inject(DataService)


  userDefinedLinks: UserDefinedLink[] = [
    { type: 'income', target: 'Income', value: 3000 },
    { type: 'income', target: 'Roommate Contribution', value: 565 },
    { type: 'tax', target: 'Taxes', value: 208 },
    { type: 'expense', target: 'Housing', value: 1096 },
    { type: 'expense', target: 'Groceries', value: 160 },
    { type: 'expense', target: 'Commute', value: 49 },
    { type: 'expense', target: 'Electricity', value: 108, source: 'Housing' },
    { type: 'expense', target: 'Water', value: 35, source: 'Housing' },      
    { type: 'expense', target: 'Rent', value: 833, source: 'Housing' },
    { type: 'expense', target: 'Wifi', value: 40, source: 'Housing' },
    { type: 'expense', target: 'Kitchen', value: 80, source: 'Housing' },
    { type: 'expense', target: 'Sport', value: 20 },
    { type: 'expense', target: 'Sim Card', value: 20 },
    { type: 'expense', target: 'Radio Fees', value: 19 },
  ]


  constructor() { }

  ngOnInit(): void {
    this.dataService.getProcessedData().subscribe(data => {
      console.log('data', data)
    })
  }


  updateInput() {
    this.dataService.processInputData(this.userDefinedLinks)
  }
}
