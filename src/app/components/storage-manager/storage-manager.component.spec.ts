import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StorageManagerComponent } from './storage-manager.component';

describe('StorageManagerComponent', () => {
  let component: StorageManagerComponent;
  let fixture: ComponentFixture<StorageManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StorageManagerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StorageManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
