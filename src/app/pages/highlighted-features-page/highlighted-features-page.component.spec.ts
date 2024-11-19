import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HighlightedFeaturesPageComponent } from './highlighted-features-page.component';

describe('HighlightedFeaturesPageComponent', () => {
  let component: HighlightedFeaturesPageComponent;
  let fixture: ComponentFixture<HighlightedFeaturesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HighlightedFeaturesPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HighlightedFeaturesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
