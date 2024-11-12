import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BudgetRadarChartComponent } from './budget-radar-chart.component';

describe('BudgetRadarChartComponent', () => {
  let component: BudgetRadarChartComponent;
  let fixture: ComponentFixture<BudgetRadarChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetRadarChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BudgetRadarChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
