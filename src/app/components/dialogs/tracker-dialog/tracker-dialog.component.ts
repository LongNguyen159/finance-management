import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ProgressCardComponent } from "../../progress-card/progress-card.component";
import { BasePageComponent } from '../../../base-components/base-page/base-page.component';
import { NavigationStart, Router } from '@angular/router';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-tracker-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, CommonModule, ProgressCardComponent],
  templateUrl: './tracker-dialog.component.html',
  styleUrl: './tracker-dialog.component.scss'
})
export class TrackerDialogComponent extends BasePageComponent implements OnInit {
  router = inject(Router)
  dialogRef = inject(MatDialogRef);

  currentYear = new Date().getFullYear();

  ngOnInit(): void {
    this.router.events.pipe(takeUntil(this.componentDestroyed$)).subscribe(event => {
      if (event instanceof NavigationStart) {
        this.dialogRef.close();
      }
    });
  }

  onNavigateToSmartBudgeter(isNavigate: boolean) {
    if (!isNavigate) {
      return
    }
    this.dialogRef.close()
  }
}
