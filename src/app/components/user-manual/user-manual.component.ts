import { Component, inject } from '@angular/core';
import { ColorService } from '../../services/color.service';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-user-manual',
  standalone: true,
  imports: [CommonModule, MatDividerModule],
  templateUrl: './user-manual.component.html',
  styleUrl: './user-manual.component.scss'
})
export class UserManualComponent {
  colorService = inject(ColorService)

}
