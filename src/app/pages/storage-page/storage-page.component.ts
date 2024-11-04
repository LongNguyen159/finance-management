import { Component, inject } from '@angular/core';
import { StorageManagerComponent } from '../../components/storage-manager/storage-manager.component';
import { NavbarComponent } from "../../components/navbar/navbar.component";
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FixCostInputComponent } from "../../components/fix-cost-input/fix-cost-input.component";
import { CommonModule } from '@angular/common';
import { ColorService } from '../../services/color.service';

@Component({
  selector: 'app-storage-page',
  standalone: true,
  imports: [StorageManagerComponent, NavbarComponent, MatTabsModule, MatButtonModule, MatIconModule, FixCostInputComponent,
    CommonModule
  ],
  templateUrl: './storage-page.component.html',
  styleUrl: './storage-page.component.scss'
})
export class StoragePageComponent {
  colorService = inject(ColorService)
}
