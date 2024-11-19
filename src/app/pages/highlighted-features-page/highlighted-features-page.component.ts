import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { UiService } from '../../services/ui.service';
import { ColorService } from '../../services/color.service';
import { RoutePath } from '../../components/models';

@Component({
  selector: 'app-highlighted-features-page',
  standalone: true,
  imports: [NavbarComponent, CommonModule, MatButtonModule,
    RouterModule, MatCardModule
  ],
  templateUrl: './highlighted-features-page.component.html',
  styleUrl: './highlighted-features-page.component.scss'
})
export class HighlightedFeaturesPageComponent {
  colorService = inject(ColorService)
  uiService = inject(UiService)

  RoutePath = RoutePath

}
