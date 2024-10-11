import { Component, inject, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { InputListComponent } from '../input-list/input-list.component';
import { RouterModule } from '@angular/router';
import { DataService } from '../data.service';
import { ColorService } from '../../services/color.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [MatMenuModule, MatIconModule, MatButtonModule, InputListComponent, RouterModule, NavbarComponent,
    NavbarComponent, CommonModule
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  @Input() showAddInput: boolean = true;
  @Input() showBackButton: boolean = true;
  @Input() showOpenDocs: boolean = true;
  @Input() showLogo: boolean = true;

  dataService = inject(DataService)
  colorService = inject(ColorService)
}
