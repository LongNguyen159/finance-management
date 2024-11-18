import { Component, inject } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { ColorService } from '../../services/color.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { UiService } from '../../services/ui.service';
import { MatCardModule } from '@angular/material/card';

/**
 * TODO: UPDATE THIS PAGE EVERY TIME A NEW RELEASE IS MADE.
 */
@Component({
  selector: 'app-whats-new-page',
  standalone: true,
  imports: [NavbarComponent, CommonModule, MatButtonModule,
    RouterModule, MatCardModule
  ],
  templateUrl: './whats-new-page.component.html',
  styleUrl: './whats-new-page.component.scss'
})
export class WhatsNewPageComponent {
  colorService = inject(ColorService)
  uiService = inject(UiService)
}
