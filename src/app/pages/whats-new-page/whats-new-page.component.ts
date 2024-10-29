import { Component, inject } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { ColorService } from '../../services/color.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-whats-new-page',
  standalone: true,
  imports: [NavbarComponent, CommonModule],
  templateUrl: './whats-new-page.component.html',
  styleUrl: './whats-new-page.component.scss'
})
export class WhatsNewPageComponent {
  colorService = inject(ColorService)

}
