import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
@Component({
  selector: 'app-storage-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatCardModule,
    MatRadioModule, CommonModule, FormsModule],
  templateUrl: './storage-dialog.component.html',
  styleUrl: './storage-dialog.component.scss'
})
export class StorageDialogComponent {

}
