import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimpleMonthPickerComponent } from './simple-month-picker.component';

describe('SimpleMonthPickerComponent', () => {
  let component: SimpleMonthPickerComponent;
  let fixture: ComponentFixture<SimpleMonthPickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimpleMonthPickerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SimpleMonthPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
