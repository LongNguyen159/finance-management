import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrendsLineChartComponent } from './trends-line-chart.component';

describe('TrendsLineChartComponent', () => {
  let component: TrendsLineChartComponent;
  let fixture: ComponentFixture<TrendsLineChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrendsLineChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrendsLineChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
