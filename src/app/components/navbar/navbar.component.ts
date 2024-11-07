import { Component, inject, Input, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { InputListComponent } from '../input-list/input-list.component';
import { Router, RouterModule } from '@angular/router';
import { DataService } from '../../services/data.service';
import { ColorService } from '../../services/color.service';
import { CommonModule, Location } from '@angular/common';
import { DialogsService } from '../../services/dialogs.service';
import { UiService } from '../../services/ui.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [MatMenuModule, MatIconModule, MatButtonModule, InputListComponent, RouterModule, NavbarComponent,
    NavbarComponent, CommonModule
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class NavbarComponent {
  @Input() showAddInput: boolean = true;
  @Input() showBackButton: boolean = true;
  @Input() showOpenDocs: boolean = true;
  @Input() showLogo: boolean = true;
  @Input() showUpdates: boolean = true;
  @Input() showStorage: boolean = true;

  @Input() backLink: string = '';
  @Input() scrollToTop: boolean = false;

  dataService = inject(DataService)
  colorService = inject(ColorService)
  dialogService = inject(DialogsService)
  uiService = inject(UiService)
  private location = inject(Location)
  private router = inject(Router)


  navigateBack() {
    

    if (this.backLink) {
      this.router.navigate([this.backLink]);
      if (this.scrollToTop) {
        this.uiService.scrollToTop();
      }

      return
    }
    
    if (window.history.length > 1) {
      this.location.back();
    } else {
      // If no back history, navigate to a fallback route (e.g., homepage)
      this.router.navigate(['/']);
    }
    if (this.scrollToTop) {
      this.uiService.scrollToTop();
    }
  }
}
