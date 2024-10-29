import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainPageDialogComponent } from './main-page-dialog.component';

describe('MainPageDialogComponent', () => {
  let component: MainPageDialogComponent;
  let fixture: ComponentFixture<MainPageDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainPageDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainPageDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
