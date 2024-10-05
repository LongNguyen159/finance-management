import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DidYouKnowDialogComponent } from './did-you-know-dialog.component';

describe('InputDialogComponent', () => {
  let component: DidYouKnowDialogComponent;
  let fixture: ComponentFixture<DidYouKnowDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DidYouKnowDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DidYouKnowDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
