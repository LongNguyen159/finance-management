import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-error-card',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  templateUrl: './error-card.component.html',
  styleUrl: './error-card.component.scss',
  animations: [
    trigger('fadeInOut', [
      state('void', style({
        opacity: 0
      })),
      transition(':enter, :leave', [
        animate('200ms ease-in')
      ])
    ])
  ]
})
export class ErrorCardComponent implements OnChanges {
  defaultErrorMessage: string = 'New changes won’t be saved until all issues are resolved.'

  @Input() errorMessage: string = this.defaultErrorMessage

  @Input() errorMessageMultiple: { type: string, message: string }[] = []


  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['errorMessage'] && changes['errorMessage'].currentValue) {
      this.errorMessage = changes['errorMessage'].currentValue
    }

    if (!this.errorMessage) {
      this.errorMessage = this.defaultErrorMessage
    }
  }
}
