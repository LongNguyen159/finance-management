import { Component } from '@angular/core';
import { StorageManagerComponent } from '../../components/storage-manager/storage-manager.component';
import { NavbarComponent } from "../../components/navbar/navbar.component";

@Component({
  selector: 'app-storage-page',
  standalone: true,
  imports: [StorageManagerComponent, NavbarComponent],
  templateUrl: './storage-page.component.html',
  styleUrl: './storage-page.component.scss'
})
export class StoragePageComponent {

}
