import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DataService } from '../../services/data.service';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-storage-manager',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatIconModule, CommonModule, MatIconModule],
  templateUrl: './storage-manager.component.html',
  styleUrl: './storage-manager.component.scss'
})
export class StorageManagerComponent implements OnInit{
  dataService = inject(DataService)
  localStorageData: { [key: string]: string } = {};
  keys: string[] = [];


  ngOnInit(): void {
    this.refreshData();
  }

  refreshData() {
    this.localStorageData = this.dataService.getMonthlyDataFromLocalStorage();
    console.log('localStorageData', this.localStorageData);
  }


  removeItem(key: string) {
    this.dataService.removeLocalStorageItem(key);
    this.refreshData();
  }


}
