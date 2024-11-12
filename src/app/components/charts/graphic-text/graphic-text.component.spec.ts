import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphicTextComponent } from './graphic-text.component';

describe('GraphicTextComponent', () => {
  let component: GraphicTextComponent;
  let fixture: ComponentFixture<GraphicTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraphicTextComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GraphicTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
