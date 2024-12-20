import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryRegressionChartComponent } from './category-regression-chart.component';

describe('CategoryRegressionChartComponent', () => {
  let component: CategoryRegressionChartComponent;
  let fixture: ComponentFixture<CategoryRegressionChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryRegressionChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoryRegressionChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
