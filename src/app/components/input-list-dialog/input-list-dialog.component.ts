import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { InputListComponent } from '../input-list/input-list.component';

@Component({
  selector: 'app-input-list-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule,
    InputListComponent
  ],
  templateUrl: './input-list-dialog.component.html',
  styleUrl: './input-list-dialog.component.scss'
})
export class InputListDialogComponent {

}
