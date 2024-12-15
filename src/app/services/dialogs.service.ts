import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DidYouKnowDialogComponent } from '../components/dialogs/did-you-know-dialog/did-you-know-dialog.component';
import { SettingsDialogComponent } from '../components/dialogs/settings-dialog/settings-dialog.component';
import { InputListDialogComponent } from '../components/dialogs/input-list-dialog/input-list-dialog.component';
import { InsertExpenseDialogComponent } from '../components/dialogs/insert-expense-dialog/insert-expense-dialog.component';
import { InsightsDialogComponent } from '../components/dialogs/insights-dialog/insights-dialog.component';
import { PatternAnalysisDialogComponent } from '../components/dialogs/pattern-analysis-dialog/pattern-analysis-dialog.component';
import { AbnormalityChartData } from '../components/models';
import { TrackerDialogComponent } from '../components/dialogs/tracker-dialog/tracker-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class DialogsService {
  readonly dialog = inject(MatDialog)
  constructor() { }



  openDidYouKnowDialog() {
    this.dialog.open(DidYouKnowDialogComponent);
  }

  openSettingsDialog() {
    this.dialog.open(SettingsDialogComponent, {
        width: '45rem',
        maxWidth: '60vw',
        height: '35rem',
        maxHeight: '90vh',
    })
  }


  openInsertIntoDialog(entryToModify: {name: string, value: number} ) {
    this.dialog.open(InsertExpenseDialogComponent, {
        width: '40rem',
        maxWidth: '60vw',
        // minHeight: '23rem',
        // height: '27rem',
        // maxHeight: '90vh',
        data: entryToModify
    })
  }


  
  openPatternAnalysisDialog(chartData: AbnormalityChartData) {
    this.dialog.open(PatternAnalysisDialogComponent, {
      width: '75rem',
      height: '83vh',
      maxHeight: '90vh',
      maxWidth: '98vw',
      data: chartData
    })
  }

  /** Open Tracker dialog, content are the current progress vs target year spending, defined by 
   * the smart budgeter.
   */
  openTrackerDialog() {
    this.dialog.open(TrackerDialogComponent, {
      width: '75rem',
      height: '83vh',
      maxHeight: '90vh',
      maxWidth: '98vw',
    })
  }

  openInsightsDialog() {
    this.dialog.open(InsightsDialogComponent, {
      width: '55rem',
        maxWidth: '70vw',
        height: '35rem',
        maxHeight: '90vh',
    })
  }

  


  openInputListDialog() {
      const dialogRef = this.dialog.open(InputListDialogComponent, {
          width: '75rem',
          height: '83vh',
          maxHeight: '90vh',
          maxWidth: '90vw',
          disableClose: false
      });
  }
}
