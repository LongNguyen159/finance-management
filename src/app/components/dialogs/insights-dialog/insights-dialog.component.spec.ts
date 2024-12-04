import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InsightsDialogComponent } from './insights-dialog.component';

describe('InsightsDialogComponent', () => {
  let component: InsightsDialogComponent;
  let fixture: ComponentFixture<InsightsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InsightsDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InsightsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
