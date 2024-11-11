import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import { MatDialogModule} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ColorService } from '../../../services/color.service';

@Component({
  selector: 'app-input-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule,
    CommonModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './did-you-know-dialog.component.html',
  styleUrl: './did-you-know-dialog.component.scss'
})
export class DidYouKnowDialogComponent {
  colorService = inject(ColorService)
}
