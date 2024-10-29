import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncomeExpenseRatioChartComponent } from './income-expense-ratio-chart.component';

describe('IncomeExpenseRatioChartComponent', () => {
  let component: IncomeExpenseRatioChartComponent;
  let fixture: ComponentFixture<IncomeExpenseRatioChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncomeExpenseRatioChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IncomeExpenseRatioChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
