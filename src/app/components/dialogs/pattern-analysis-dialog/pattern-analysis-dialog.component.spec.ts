import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatternAnalysisDialogComponent } from './pattern-analysis-dialog.component';

describe('PatternAnalysisDialogComponent', () => {
  let component: PatternAnalysisDialogComponent;
  let fixture: ComponentFixture<PatternAnalysisDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatternAnalysisDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatternAnalysisDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
