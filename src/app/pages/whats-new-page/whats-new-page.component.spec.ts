import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhatsNewPageComponent } from './whats-new-page.component';

describe('WhatsNewPageComponent', () => {
  let component: WhatsNewPageComponent;
  let fixture: ComponentFixture<WhatsNewPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhatsNewPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WhatsNewPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
