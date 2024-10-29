import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputListDialogComponent } from './input-list-dialog.component';

describe('InputListDialogComponent', () => {
  let component: InputListDialogComponent;
  let fixture: ComponentFixture<InputListDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputListDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InputListDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
