import { Component } from '@angular/core';
import { StorageManagerComponent } from '../../components/storage-manager/storage-manager.component';
import { NavbarComponent } from "../../components/navbar/navbar.component";
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-storage-page',
  standalone: true,
  imports: [StorageManagerComponent, NavbarComponent, MatTabsModule, MatButtonModule, MatIconModule],
  templateUrl: './storage-page.component.html',
  styleUrl: './storage-page.component.scss'
})
export class StoragePageComponent {

}
