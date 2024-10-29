import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainPageSingleMonthComponent } from './main-page-single-month.component';

describe('MainPageSingleMonthComponent', () => {
  let component: MainPageSingleMonthComponent;
  let fixture: ComponentFixture<MainPageSingleMonthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainPageSingleMonthComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainPageSingleMonthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
