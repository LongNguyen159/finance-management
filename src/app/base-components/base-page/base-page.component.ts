import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-base-page',
  standalone: true,
  imports: [],
  templateUrl: './base-page.component.html',
  styleUrl: './base-page.component.scss'
})
export class BasePageComponent implements OnDestroy {
  protected componentDestroyed$ = new Subject<void>()

  constructor() {}

  ngOnDestroy(): void {
    this.componentDestroyed$.next()
    this.componentDestroyed$.unsubscribe()
  }
}
