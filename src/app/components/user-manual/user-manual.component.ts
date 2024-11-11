import { Component, inject } from '@angular/core';
import { ColorService } from '../../services/color.service';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-user-manual',
  standalone: true,
  imports: [CommonModule, MatDividerModule, MatIconModule],
  templateUrl: './user-manual.component.html',
  styleUrl: './user-manual.component.scss'
})
export class UserManualComponent {
  colorService = inject(ColorService)

}
