import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BudgetGaugeChartComponent } from './budget-gauge-chart.component';

describe('BudgetGaugeChartComponent', () => {
  let component: BudgetGaugeChartComponent;
  let fixture: ComponentFixture<BudgetGaugeChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetGaugeChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BudgetGaugeChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
