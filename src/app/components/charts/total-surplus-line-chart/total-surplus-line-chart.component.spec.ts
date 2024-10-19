import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TotalSurplusLineChartComponent } from './total-surplus-line-chart.component';

describe('TotalSurplusLineChartComponent', () => {
  let component: TotalSurplusLineChartComponent;
  let fixture: ComponentFixture<TotalSurplusLineChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TotalSurplusLineChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TotalSurplusLineChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
