import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FixCostInputComponent } from './fix-cost-input.component';

describe('FixCostInputComponent', () => {
  let component: FixCostInputComponent;
  let fixture: ComponentFixture<FixCostInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FixCostInputComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FixCostInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
