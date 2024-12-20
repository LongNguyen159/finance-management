import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmartBudgeterComponent } from './smart-budgeter.component';

describe('SmartBudgeterComponent', () => {
  let component: SmartBudgeterComponent;
  let fixture: ComponentFixture<SmartBudgeterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmartBudgeterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SmartBudgeterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
