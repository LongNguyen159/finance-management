import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InsertExpenseDialogComponent } from './insert-expense-dialog.component';

describe('InsertExpenseDialogComponent', () => {
  let component: InsertExpenseDialogComponent;
  let fixture: ComponentFixture<InsertExpenseDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InsertExpenseDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InsertExpenseDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
