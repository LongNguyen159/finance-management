import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackerSelectorDialogComponent } from './tracker-selector-dialog.component';

describe('TrackerSelectorDialogComponent', () => {
  let component: TrackerSelectorDialogComponent;
  let fixture: ComponentFixture<TrackerSelectorDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackerSelectorDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackerSelectorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
