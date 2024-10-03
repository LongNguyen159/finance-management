import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import { InputListComponent } from '../input-list/input-list.component';

@Component({
  selector: 'app-input-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule,
    InputListComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './input-dialog.component.html',
  styleUrl: './input-dialog.component.scss'
})
export class InputDialogComponent {
}
